import { planDb } from '../storage/db';
import { taskDb } from '../storage/taskDb';
import { statusAuditDb } from '../storage/statusAuditDb';
import { planStatusService } from './planStatusService';
import { LessonPlan } from '../../models/plan';

export class InvalidPlanIdError extends Error {
  public code = 'INVALID_PLAN_ID';
  public status = 400;
  constructor(message: string = 'Invalid plan ID format') {
    super(message);
    this.name = 'InvalidPlanIdError';
  }
}

export class PlanNotFoundError extends Error {
  public code = 'PLAN_NOT_FOUND';
  public status = 404;
  constructor(message: string = 'Plan not found or already deleted') {
    super(message);
    this.name = 'PlanNotFoundError';
  }
}

export class UnauthorizedError extends Error {
  public code = 'UNAUTHORIZED';
  public status = 401;
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class PlanLockedError extends Error {
  public code = 'PLAN_LOCKED';
  public status = 409;
  constructor(message: string = 'Plan is currently locked by a running operation') {
    super(message);
    this.name = 'PlanLockedError';
  }
}

export interface DeletePlanResult {
  success: boolean;
  id: string;
  message: string;
}

const PLAN_ID_REGEX = /^[a-zA-Z0-9_-]{3,128}$/;

export class PlanService {
  /**
   * Internal hook for testing transaction rollback on mid-operation failure
   */
  public _injectedFailure = false;

  /**
   * Validates the plan ID format
   */
  public isValidPlanId(planId: unknown): planId is string {
    return typeof planId === 'string' && PLAN_ID_REGEX.test(planId.trim());
  }

  /**
   * Permanently deletes a plan and all its plan-owned records in an atomic transaction.
   * Scoped strictly to the authenticated owner.
   * Preserves all shared directory, global standards, other plans, and user settings.
   */
  public async deletePlan(userId: string | null | undefined, planId: string): Promise<DeletePlanResult> {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new UnauthorizedError('Authentication required. Missing user identity.');
    }

    const cleanUserId = userId.trim();

    if (!this.isValidPlanId(planId)) {
      throw new InvalidPlanIdError('Invalid plan ID format. Must be 3-128 alphanumeric characters, underscores or hyphens.');
    }

    const cleanPlanId = planId.trim();

    // Use per-user mutex lock to serialize operations and eliminate race conditions
    return planStatusService.withUserLock(cleanUserId, async () => {
      // Load plan scoped to owner
      const existing = planDb.getById(cleanPlanId);

      // Security: non-existent plan and other user's plan return 404 (prevent existence leaking)
      if (!existing) {
        throw new PlanNotFoundError('Plan not found or already deleted.');
      }

      const planOwner = existing.userId || 'teacher_default';
      if (planOwner !== cleanUserId) {
        // Return 404 so existence of another user's plan is not leaked
        throw new PlanNotFoundError('Plan not found or already deleted.');
      }

      // Snapshot for transactional rollback
      const planSnapshot: LessonPlan = JSON.parse(JSON.stringify(existing));
      const tasksSnapshot = taskDb.getByPlanId(cleanPlanId);
      const auditSnapshot = statusAuditDb.getByPlanId(cleanPlanId);

      try {
        if (this._injectedFailure) {
          throw new Error('Simulated transaction failure during plan deletion.');
        }

        // 1. Delete plan-owned tasks from task storage
        taskDb.deleteByPlanId(cleanPlanId);

        // 2. Remove plan status history (purges plan-owned status history rows)
        statusAuditDb.removeByPlanId(cleanPlanId);

        // 3. Keep minimal audit entry (user ID, plan ID, deletion time, no plan content)
        statusAuditDb.record({
          userId: cleanUserId,
          planId: cleanPlanId,
          planTitle: '', // Explicitly no plan content
          fromStatus: existing.status,
          toStatus: 'deleted',
          timestamp: new Date().toISOString(),
          reason: 'Teacher confirmed permanent plan deletion',
        });

        // 4. Delete the plan row from plan storage
        const deleted = planDb.delete(cleanPlanId);
        if (!deleted) {
          throw new Error('Failed to delete plan record from storage.');
        }

        return {
          success: true,
          id: cleanPlanId,
          message: 'Lesson plan deleted successfully.',
        };
      } catch (err) {
        // Rollback all storage changes atomically
        planDb.restore(planSnapshot);
        taskDb.restoreTasks(tasksSnapshot);
        statusAuditDb.removeByPlanId(cleanPlanId);
        statusAuditDb.restoreEntries(auditSnapshot);
        throw err;
      }
    });
  }
}

export const planService = new PlanService();
