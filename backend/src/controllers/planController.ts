import { Request, Response } from 'express';
import { planDb } from '../services/storage/db';
import { taskDb } from '../services/storage/taskDb';
import { LessonPlan, LessonPlanSchema, normalizePlanStatus } from '../models/plan';
import { referenceService } from '../services/references/referenceService';
import {
  planStatusService,
  ActiveLimitReachedError,
  InvalidStatusTransitionError,
  StaleStateError,
} from '../services/plan/planStatusService';
import {
  planService,
  InvalidPlanIdError,
  PlanNotFoundError,
  UnauthorizedError,
  PlanLockedError,
} from '../services/plan/planService';

// Sliding-window in-memory rate limiter for destructive operations: max 30 delete requests per 60s
const DELETE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_DELETES_PER_WINDOW = 30;
const deleteRateLimitMap = new Map<string, number[]>();

function checkDeleteRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = deleteRateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < DELETE_RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_DELETES_PER_WINDOW) {
    deleteRateLimitMap.set(key, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  deleteRateLimitMap.set(key, validTimestamps);
  return true;
}

export function resolveAuthUser(req: Request, strict: true): string | null;
export function resolveAuthUser(req: Request, strict?: false): string;
export function resolveAuthUser(req: Request, strict?: boolean): string | null {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1].trim();
      if (token) return token;
    }
  }

  const xUserId = req.headers['x-user-id'] || req.headers['X-User-Id'];
  if (typeof xUserId === 'string' && xUserId.trim()) {
    return xUserId.trim();
  }

  if (strict) return null;
  return 'teacher_default';
}

export const planController = {
  getAllPlans(req: Request, res: Response) {
    const userId = resolveAuthUser(req) || 'teacher_default';
    const plans = planDb.getByUserId(userId);
    res.json(plans);
  },

  getPlanById(req: Request, res: Response) {
    const plan = planDb.getById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(plan);
  },

  async createPlan(req: Request, res: Response) {
    const userId = resolveAuthUser(req) || 'teacher_default';
    const parsed = LessonPlanSchema.safeParse({
      ...req.body,
      userId: req.body.userId || userId,
    });

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid plan schema', details: parsed.error.issues });
    }

    const requestedStatus = normalizePlanStatus(parsed.data.status);
    let planData: LessonPlan = { ...parsed.data, status: 'draft' };
    let savedAsDraftDueToLimit = false;

    // If user explicitly asked to create as active
    if (requestedStatus === 'active') {
      const activePlans = planStatusService.getUserActivePlans(userId);
      if (activePlans.length < planStatusService.maxActivePlans) {
        planData.status = 'active';
        planData.statusChangedAt = new Date().toISOString();
      } else {
        planData.status = 'draft';
        savedAsDraftDueToLimit = true;
      }
    }

    const saved = planDb.save(planData);
    taskDb.syncWithPlans(planDb.getAll());

    res.status(201).json({
      ...saved,
      savedAsDraftDueToLimit,
      limitNotice: savedAsDraftDueToLimit
        ? `Saved as draft because you have ${planStatusService.maxActivePlans} active plans.`
        : undefined,
    });
  },

  async updatePlan(req: Request, res: Response) {
    const userId = resolveAuthUser(req) || 'teacher_default';
    const existing = planDb.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Plan not found to update' });
    }

    // Verify ownership - never leak existence of another user's plan
    const owner = existing.userId || 'teacher_default';
    if (owner !== userId) {
      return res.status(404).json({ error: 'Plan not found to update' });
    }

    const { status: requestedStatus, ...otherFields } = req.body;

    // If status change requested in update payload, route through planStatusService
    if (requestedStatus !== undefined && requestedStatus !== existing.status) {
      try {
        const norm = normalizePlanStatus(requestedStatus);
        await planStatusService.changePlanStatus(userId, req.params.id, norm, 'Plan update with status');
      } catch (err: unknown) {
        if (err instanceof ActiveLimitReachedError) {
          return res.status(err.status).json({
            error: err.message,
            code: err.code,
            limit: err.limit,
            activePlans: err.activePlans,
          });
        }
        if (err instanceof InvalidStatusTransitionError) {
          return res.status(err.status).json({ error: err.message, code: err.code });
        }
        const error = err as Error;
        return res.status(400).json({ error: error.message || 'Status transition rejected' });
      }
    }

    const updated = planDb.update(req.params.id, otherFields);
    if (!updated) {
      return res.status(404).json({ error: 'Plan not found to update' });
    }
    taskDb.syncWithPlans(planDb.getAll());
    res.json(updated);
  },

  async deletePlan(req: Request, res: Response) {
    try {
      const authUser = resolveAuthUser(req, true);
      if (!authUser) {
        return res.status(401).json({
          error: 'Authentication required. Please provide a valid Authorization Bearer token or X-User-Id header.',
        });
      }

      const clientKey = `${authUser}_${req.ip || 'local'}`;
      if (!checkDeleteRateLimit(clientKey)) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Too many deletion requests. Please wait a moment before retrying.',
        });
      }

      const planId = req.params.id;
      if (!planService.isValidPlanId(planId)) {
        return res.status(400).json({
          error: 'Invalid plan ID format. ID must be 3-128 alphanumeric characters, underscores or hyphens.',
        });
      }

      const result = await planService.deletePlan(authUser, planId);
      return res.status(200).json(result);
    } catch (err: unknown) {
      if (err instanceof InvalidPlanIdError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      if (err instanceof PlanNotFoundError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      if (err instanceof UnauthorizedError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      if (err instanceof PlanLockedError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      // Never leak stack traces, SQL, keys or internals in responses
      console.error('Plan deletion failed:', err);
      return res.status(500).json({ error: 'A server error occurred while deleting the lesson plan. Please try again.' });
    }
  },

  duplicatePlan(req: Request, res: Response) {
    const clone = planDb.duplicate(req.params.id);
    if (!clone) {
      return res.status(404).json({ error: 'Plan not found to duplicate' });
    }
    taskDb.syncWithPlans(planDb.getAll());
    res.status(201).json(clone);
  },

  // Active Plans Management Endpoints
  getActiveSummary(req: Request, res: Response) {
    const userId = resolveAuthUser(req);
    const summary = planStatusService.getActiveSummary(userId);
    res.json(summary);
  },

  async activatePlan(req: Request, res: Response) {
    try {
      const userId = resolveAuthUser(req);
      const { reason } = req.body || {};
      const result = await planStatusService.activatePlan(userId, req.params.id, reason);
      const summary = planStatusService.getActiveSummary(userId);
      res.json({
        success: true,
        plan: result.plan,
        isIdempotent: result.isIdempotent,
        summary,
      });
    } catch (err: unknown) {
      if (err instanceof ActiveLimitReachedError) {
        return res.status(err.status).json({
          error: err.message,
          code: err.code,
          limit: err.limit,
          activePlans: err.activePlans,
        });
      }
      if (err instanceof InvalidStatusTransitionError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      const error = err as Error;
      return res.status(400).json({ error: error.message || 'Activation failed' });
    }
  },

  async deactivatePlan(req: Request, res: Response) {
    try {
      const userId = resolveAuthUser(req);
      const { reason } = req.body || {};
      const updated = await planStatusService.changePlanStatus(
        userId,
        req.params.id,
        'cancelled',
        reason || 'Teacher deactivated plan'
      );
      const summary = planStatusService.getActiveSummary(userId);
      res.json({
        success: true,
        plan: updated,
        summary,
      });
    } catch (err: unknown) {
      if (err instanceof InvalidStatusTransitionError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      const error = err as Error;
      return res.status(400).json({ error: error.message || 'Deactivation failed' });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const userId = resolveAuthUser(req);
      const { status, reason } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      const norm = normalizePlanStatus(status);
      const updated = await planStatusService.changePlanStatus(userId, req.params.id, norm, reason);
      const summary = planStatusService.getActiveSummary(userId);
      res.json({
        success: true,
        plan: updated,
        summary,
      });
    } catch (err: unknown) {
      if (err instanceof ActiveLimitReachedError) {
        return res.status(err.status).json({
          error: err.message,
          code: err.code,
          limit: err.limit,
          activePlans: err.activePlans,
        });
      }
      if (err instanceof InvalidStatusTransitionError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      const error = err as Error;
      return res.status(400).json({ error: error.message || 'Status change failed' });
    }
  },

  async swapPlans(req: Request, res: Response) {
    try {
      const userId = resolveAuthUser(req);
      const { deactivatePlanId, activatePlanId, reason } = req.body;
      if (!deactivatePlanId || !activatePlanId) {
        return res.status(400).json({ error: 'Both deactivatePlanId and activatePlanId are required for swap.' });
      }

      const result = await planStatusService.swapActivePlans(userId, deactivatePlanId, activatePlanId, reason);
      res.json({
        success: true,
        deactivatedPlan: result.deactivatedPlan,
        activatedPlan: result.activatedPlan,
        summary: result.summary,
      });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(400).json({ error: error.message || 'Plan swap failed' });
    }
  },

  async resolveOverLimit(req: Request, res: Response) {
    try {
      const userId = resolveAuthUser(req);
      const { keepPlanIds, expectedActivePlanIds, reason } = req.body;
      if (!Array.isArray(keepPlanIds) || !Array.isArray(expectedActivePlanIds)) {
        return res.status(400).json({
          error: 'keepPlanIds and expectedActivePlanIds arrays are required for over-limit resolution.',
        });
      }

      const result = await planStatusService.resolveOverLimit(userId, {
        keepPlanIds,
        expectedActivePlanIds,
        reason,
      });

      res.json({
        success: true,
        keptPlans: result.keptPlans,
        deactivatedPlans: result.deactivatedPlans,
        summary: result.summary,
      });
    } catch (err: unknown) {
      if (err instanceof StaleStateError) {
        return res.status(err.status).json({
          error: err.message,
          code: err.code,
          freshActivePlans: err.freshActivePlans,
        });
      }
      const error = err as Error;
      return res.status(400).json({ error: error.message || 'Over-limit resolution failed' });
    }
  },

  // Reference Materials endpoints
  async fetchReferences(req: Request, res: Response) {
    try {
      const plan = planDb.getById(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const updated = await referenceService.fetchAndAttachReferences(req.params.id);
      res.json({
        ...updated,
        plan: updated,
        references: updated.references,
        referencesStatus: updated.referencesStatus,
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to fetch references:', error);
      res.status(500).json({ error: 'Failed to retrieve references', message: error.message });
    }
  },

  async addCustomReference(req: Request, res: Response) {
    try {
      const { title, url, category, resourceType, description, relatedWeek, relatedLesson } = req.body;
      if (!title || !url) {
        return res.status(400).json({ error: 'Title and URL are required' });
      }

      const updated = await referenceService.addCustomReference(req.params.id, {
        title,
        url,
        category,
        resourceType,
        description,
        relatedWeek: relatedWeek ? Number(relatedWeek) : undefined,
        relatedLesson,
      });

      const newRef = (updated.references || [])[(updated.references || []).length - 1];
      res.status(201).json({
        ...updated,
        plan: updated,
        reference: newRef,
      });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(400).json({ error: 'Failed to add custom reference', message: error.message });
    }
  },

  removeReference(req: Request, res: Response) {
    try {
      const { id, refId } = req.params;
      const updated = referenceService.removeReference(id, refId);
      res.json({
        ...updated,
        plan: updated,
        success: true,
      });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(400).json({ error: 'Failed to remove reference', message: error.message });
    }
  },
};
