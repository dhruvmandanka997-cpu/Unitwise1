import { config } from '../../config';
import { LessonPlan, PlanStatus, normalizePlanStatus } from '../../models/plan';
import { planDb } from '../storage/db';
import { statusAuditDb } from '../storage/statusAuditDb';
import { taskDb } from '../storage/taskDb';

export class ActiveLimitReachedError extends Error {
  public code = 'ACTIVE_LIMIT_REACHED';
  public status = 409;
  public limit: number;
  public activePlans: Array<{ id: string; title: string; subject: string; gradeLevel: string }>;

  constructor(
    message: string,
    limit: number,
    activePlans: Array<{ id: string; title: string; subject: string; gradeLevel: string }>
  ) {
    super(message);
    this.name = 'ActiveLimitReachedError';
    this.limit = limit;
    this.activePlans = activePlans;
  }
}

export class InvalidStatusTransitionError extends Error {
  public code = 'INVALID_STATUS_TRANSITION';
  public status = 400;

  constructor(fromStatus: string, toStatus: string, message?: string) {
    super(message || `Invalid plan status transition from '${fromStatus}' to '${toStatus}'`);
    this.name = 'InvalidStatusTransitionError';
  }
}

export class StaleStateError extends Error {
  public code = 'STALE_ACTIVE_STATE';
  public status = 409;
  public freshActivePlans: Array<{ id: string; title: string; subject: string; gradeLevel: string }>;

  constructor(freshActivePlans: Array<{ id: string; title: string; subject: string; gradeLevel: string }>) {
    super('The active plans state has changed in another session. Please refresh and review.');
    this.name = 'StaleStateError';
    this.freshActivePlans = freshActivePlans;
  }
}

export interface ActivePlanSummary {
  userId: string;
  activeCount: number;
  maxActivePlans: number;
  isAtLimit: boolean;
  isOverLimit: boolean;
  activePlans: Array<{
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    updatedAt: string;
    statusChangedAt?: string;
  }>;
}

export class PlanStatusService {
  private userLocks: Map<string, Promise<void>> = new Map();

  public get maxActivePlans(): number {
    return config.maxActivePlans || 3;
  }

  /**
   * Acquire a per-user async mutex to prevent concurrent "check then update" races.
   */
  public async withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    const targetUser = userId || 'teacher_default';
    const prevLock = this.userLocks.get(targetUser) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.userLocks.set(targetUser, nextLock);

    try {
      await prevLock;
      return await fn();
    } finally {
      releaseLock!();
      if (this.userLocks.get(targetUser) === nextLock) {
        this.userLocks.delete(targetUser);
      }
    }
  }

  /**
   * Returns all active plans owned by the given user.
   */
  public getUserActivePlans(userId: string): LessonPlan[] {
    const targetUser = userId || 'teacher_default';
    const userPlans = planDb.getByUserId(targetUser);
    return userPlans.filter((p) => normalizePlanStatus(p.status) === 'active');
  }

  /**
   * Returns active plan count and metadata for the user.
   */
  public getActiveSummary(userId: string): ActivePlanSummary {
    const targetUser = userId || 'teacher_default';
    const active = this.getUserActivePlans(targetUser);
    const count = active.length;
    const limit = this.maxActivePlans;

    return {
      userId: targetUser,
      activeCount: count,
      maxActivePlans: limit,
      isAtLimit: count === limit,
      isOverLimit: count > limit,
      activePlans: active.map((p) => ({
        id: p.id,
        title: p.title,
        subject: p.subject,
        gradeLevel: p.gradeLevel,
        updatedAt: p.updatedAt,
        statusChangedAt: p.statusChangedAt,
      })),
    };
  }

  /**
   * Validate whether a status transition is permissible under the domain rules.
   */
  public isTransitionAllowed(fromStatus: PlanStatus, toStatus: PlanStatus): boolean {
    if (fromStatus === toStatus) return true; // idempotent

    switch (fromStatus) {
      case 'draft':
        return toStatus === 'active';
      case 'active':
        return toStatus === 'completed' || toStatus === 'cancelled';
      case 'completed':
        return toStatus === 'active'; // Reopen
      case 'cancelled':
        return toStatus === 'active' || toStatus === 'draft';
      default:
        return false;
    }
  }

  /**
   * Activates a plan, safely enforcing the MAX_ACTIVE_PLANS limit with idempotency.
   */
  public async activatePlan(userId: string, planId: string, reason?: string): Promise<{ plan: LessonPlan; isIdempotent: boolean }> {
    return this.withUserLock(userId, async () => {
      const targetUser = userId || 'teacher_default';
      const plan = planDb.getById(planId);
      if (!plan) {
        throw new Error(`Plan not found: ${planId}`);
      }
      const owner = plan.userId || 'teacher_default';
      if (owner !== targetUser) {
        throw new Error('Access denied: plan belongs to another teacher account.');
      }

      const currentStatus = normalizePlanStatus(plan.status);

      // Idempotency: if already active, return success without double counting
      if (currentStatus === 'active') {
        return { plan, isIdempotent: true };
      }

      // Check transition validity
      if (!this.isTransitionAllowed(currentStatus, 'active')) {
        throw new InvalidStatusTransitionError(currentStatus, 'active');
      }

      // Check active limit
      const activePlans = this.getUserActivePlans(targetUser);
      if (activePlans.length >= this.maxActivePlans) {
        throw new ActiveLimitReachedError(
          `You already have ${this.maxActivePlans} active plans. Deactivate one to activate another.`,
          this.maxActivePlans,
          activePlans.map((p) => ({
            id: p.id,
            title: p.title,
            subject: p.subject,
            gradeLevel: p.gradeLevel,
          }))
        );
      }

      const now = new Date().toISOString();
      const updated = planDb.update(plan.id, {
        status: 'active',
        statusChangedAt: now,
        previousStatus: currentStatus,
      });

      if (!updated) {
        throw new Error('Failed to update plan status in database');
      }

      statusAuditDb.record({
        userId: targetUser,
        planId: plan.id,
        planTitle: plan.title,
        fromStatus: currentStatus,
        toStatus: 'active',
        timestamp: now,
        reason: reason || 'Teacher activated plan',
      });

      taskDb.syncWithPlans(planDb.getAll());
      return { plan: updated, isIdempotent: false };
    });
  }

  /**
   * Change plan status following the strict state machine rules.
   */
  public async changePlanStatus(
    userId: string,
    planId: string,
    targetStatus: PlanStatus,
    reason?: string
  ): Promise<LessonPlan> {
    if (targetStatus === 'active') {
      const result = await this.activatePlan(userId, planId, reason);
      return result.plan;
    }

    return this.withUserLock(userId, async () => {
      const targetUser = userId || 'teacher_default';
      const plan = planDb.getById(planId);
      if (!plan) {
        throw new Error(`Plan not found: ${planId}`);
      }
      const owner = plan.userId || 'teacher_default';
      if (owner !== targetUser) {
        throw new Error('Access denied: plan belongs to another teacher account.');
      }

      const currentStatus = normalizePlanStatus(plan.status);

      if (currentStatus === targetStatus) {
        return plan; // idempotent no-op
      }

      if (!this.isTransitionAllowed(currentStatus, targetStatus)) {
        throw new InvalidStatusTransitionError(currentStatus, targetStatus);
      }

      const now = new Date().toISOString();
      const updated = planDb.update(plan.id, {
        status: targetStatus,
        statusChangedAt: now,
        previousStatus: currentStatus,
      });

      if (!updated) {
        throw new Error('Failed to update plan status in database');
      }

      statusAuditDb.record({
        userId: targetUser,
        planId: plan.id,
        planTitle: plan.title,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        timestamp: now,
        reason: reason || `Teacher updated status to ${targetStatus}`,
      });

      taskDb.syncWithPlans(planDb.getAll());
      return updated;
    });
  }

  /**
   * Atomic swap: Deactivates one active plan and activates another in a single transaction.
   * If either validation fails, neither plan is altered.
   */
  public async swapActivePlans(
    userId: string,
    deactivatePlanId: string,
    activatePlanId: string,
    reason?: string
  ): Promise<{ deactivatedPlan: LessonPlan; activatedPlan: LessonPlan; summary: ActivePlanSummary }> {
    return this.withUserLock(userId, async () => {
      const targetUser = userId || 'teacher_default';

      if (deactivatePlanId === activatePlanId) {
        throw new Error('Cannot swap a plan with itself.');
      }

      const planToDeactivate = planDb.getById(deactivatePlanId);
      if (!planToDeactivate) {
        throw new Error(`Plan to deactivate not found: ${deactivatePlanId}`);
      }
      if ((planToDeactivate.userId || 'teacher_default') !== targetUser) {
        throw new Error('Access denied to plan to deactivate.');
      }
      if (normalizePlanStatus(planToDeactivate.status) !== 'active') {
        throw new Error(`Plan "${planToDeactivate.title}" is not currently active.`);
      }

      const planToActivate = planDb.getById(activatePlanId);
      if (!planToActivate) {
        throw new Error(`Plan to activate not found: ${activatePlanId}`);
      }
      if ((planToActivate.userId || 'teacher_default') !== targetUser) {
        throw new Error('Access denied to plan to activate.');
      }
      const activateCurrentStatus = normalizePlanStatus(planToActivate.status);
      if (activateCurrentStatus === 'active') {
        throw new Error(`Plan "${planToActivate.title}" is already active.`);
      }

      if (!this.isTransitionAllowed(activateCurrentStatus, 'active')) {
        throw new InvalidStatusTransitionError(activateCurrentStatus, 'active');
      }

      const now = new Date().toISOString();

      // Deactivate first plan (transitions active -> cancelled)
      const updatedDeactivated = planDb.update(planToDeactivate.id, {
        status: 'cancelled',
        statusChangedAt: now,
        previousStatus: 'active',
      });

      // Activate second plan
      const updatedActivated = planDb.update(planToActivate.id, {
        status: 'active',
        statusChangedAt: now,
        previousStatus: activateCurrentStatus,
      });

      if (!updatedDeactivated || !updatedActivated) {
        throw new Error('Atomic swap failed during database update.');
      }

      // Record audit logs for both
      statusAuditDb.record({
        userId: targetUser,
        planId: planToDeactivate.id,
        planTitle: planToDeactivate.title,
        fromStatus: 'active',
        toStatus: 'cancelled',
        timestamp: now,
        reason: reason || `Swapped out for "${planToActivate.title}"`,
      });

      statusAuditDb.record({
        userId: targetUser,
        planId: planToActivate.id,
        planTitle: planToActivate.title,
        fromStatus: activateCurrentStatus,
        toStatus: 'active',
        timestamp: now,
        reason: reason || `Swapped in replacing "${planToDeactivate.title}"`,
      });

      taskDb.syncWithPlans(planDb.getAll());

      const summary = this.getActiveSummary(targetUser);
      return {
        deactivatedPlan: updatedDeactivated,
        activatedPlan: updatedActivated,
        summary,
      };
    });
  }

  /**
   * Over-limit resolution: Teacher chooses which 1-3 plans to keep active.
   * Stale protection: expectedActivePlanIds must match the current active plans.
   */
  public async resolveOverLimit(
    userId: string,
    params: {
      keepPlanIds: string[];
      expectedActivePlanIds: string[];
      reason?: string;
    }
  ): Promise<{ keptPlans: LessonPlan[]; deactivatedPlans: LessonPlan[]; summary: ActivePlanSummary }> {
    return this.withUserLock(userId, async () => {
      const targetUser = userId || 'teacher_default';
      const currentActive = this.getUserActivePlans(targetUser);
      const currentActiveIds = currentActive.map((p) => p.id).sort();
      const expectedIds = [...params.expectedActivePlanIds].sort();

      // Stale check
      const isStale =
        currentActiveIds.length !== expectedIds.length ||
        currentActiveIds.some((id, idx) => id !== expectedIds[idx]);

      if (isStale) {
        throw new StaleStateError(
          currentActive.map((p) => ({
            id: p.id,
            title: p.title,
            subject: p.subject,
            gradeLevel: p.gradeLevel,
          }))
        );
      }

      const { keepPlanIds, reason } = params;

      if (!Array.isArray(keepPlanIds) || keepPlanIds.length < 1 || keepPlanIds.length > this.maxActivePlans) {
        throw new Error(`You must select between 1 and ${this.maxActivePlans} plans to keep active.`);
      }

      // Verify every keep ID is in current active set
      for (const id of keepPlanIds) {
        if (!currentActive.some((p) => p.id === id)) {
          throw new Error(`Plan ${id} is not among your currently active plans.`);
        }
      }

      const toDeactivate = currentActive.filter((p) => !keepPlanIds.includes(p.id));
      const now = new Date().toISOString();

      const deactivatedPlans: LessonPlan[] = [];
      for (const p of toDeactivate) {
        const updated = planDb.update(p.id, {
          status: 'cancelled',
          statusChangedAt: now,
          previousStatus: 'active',
        });
        if (updated) {
          deactivatedPlans.push(updated);
          statusAuditDb.record({
            userId: targetUser,
            planId: p.id,
            planTitle: p.title,
            fromStatus: 'active',
            toStatus: 'cancelled',
            timestamp: now,
            reason: reason || 'Deactivated during over-limit resolution',
          });
        }
      }

      const keptPlans = currentActive.filter((p) => keepPlanIds.includes(p.id));
      taskDb.syncWithPlans(planDb.getAll());

      const summary = this.getActiveSummary(targetUser);
      return { keptPlans, deactivatedPlans, summary };
    });
  }
}

export const planStatusService = new PlanStatusService();
