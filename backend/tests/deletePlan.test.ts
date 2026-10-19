import { describe, it, expect, beforeEach } from 'vitest';
import { planDb } from '../src/services/storage/db';
import { taskDb } from '../src/services/storage/taskDb';
import { statusAuditDb } from '../src/services/storage/statusAuditDb';
import { directoryDb } from '../src/services/directory/directoryDb';
import { planService } from '../src/services/plan/planService';
import { planStatusService } from '../src/services/plan/planStatusService';
import { planController } from '../src/controllers/planController';
import { searchService } from '../src/services/search/searchService';
import { referenceService } from '../src/services/references/referenceService';
import { PedagogicalFallbackGenerator } from '../src/services/ai/pedagogicalFallback';
import { LessonPlan } from '../src/models/plan';

function createMockHttp(options: {
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
  ip?: string;
}) {
  const normHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(options.headers || {})) {
    normHeaders[k.toLowerCase()] = v;
  }

  const req: any = {
    params: options.params || {},
    headers: normHeaders,
    body: options.body || {},
    ip: options.ip || '127.0.0.1',
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseData,
  };
}

describe('Permanent Plan Deletion Architecture & Security', () => {
  const generator = new PedagogicalFallbackGenerator();

  const createPlan = (
    id: string,
    userId: string,
    status: 'draft' | 'active' | 'completed' | 'cancelled' = 'draft'
  ): LessonPlan => {
    const raw = generator.generate({
      title: `Plan ${id}`,
      subject: 'Science',
      gradeLevel: 'Grade 9',
      durationWeeks: 2,
      sessionsPerWeek: 3,
      classDurationMinutes: 50,
      format: 'session_sequence',
      overallGoals: `Unit goals for plan ${id}`,
      preferredTeachingMethods: ['Inquiry-based learning'],
      enableHomework: true,
    });
    raw.id = id;
    raw.userId = userId;
    raw.status = status;
    const saved = planDb.save(raw);
    taskDb.syncWithPlans(planDb.getAll());
    return saved;
  };

  beforeEach(() => {
    planService._injectedFailure = false;
    // Clear all plans, tasks, and audit logs
    const allPlans = planDb.getAll();
    for (const p of allPlans) {
      planDb.delete(p.id);
    }
    const allTasks = taskDb.getAll();
    for (const t of allTasks) {
      taskDb.delete(t.id);
    }
    statusAuditDb.clear();
  });

  describe('1. Owner Deletion & Plan-Owned Records Removal', () => {
    it('deletes the plan and all plan-owned records leaving zero orphan tasks', async () => {
      const plan = createPlan('plan_owner_1', 'teacher_a', 'draft');

      const tasksBefore = taskDb.getByPlanId('plan_owner_1');
      expect(tasksBefore.length).toBeGreaterThan(0);

      const result = await planService.deletePlan('teacher_a', 'plan_owner_1');
      expect(result.success).toBe(true);
      expect(result.id).toBe('plan_owner_1');

      // Plan must no longer exist in storage
      expect(planDb.getById('plan_owner_1')).toBeUndefined();

      // Zero orphan tasks
      const tasksAfter = taskDb.getByPlanId('plan_owner_1');
      expect(tasksAfter.length).toBe(0);

      // Status history for this plan must be purged, with only a minimal deletion audit record retained
      const auditEntries = statusAuditDb.getByPlanId('plan_owner_1');
      expect(auditEntries.length).toBe(1);
      expect(auditEntries[0].toStatus).toBe('deleted');
      expect(auditEntries[0].userId).toBe('teacher_a');
      expect(auditEntries[0].planTitle).toBe(''); // no plan title/content retained
    });
  });

  describe('2. Preservation of Shared Data & Other Plans', () => {
    it('preserves shared curriculum directory, global standards, and other plans byte-for-byte', async () => {
      const planA = createPlan('plan_preserved_a', 'teacher_a', 'draft');
      const planB = createPlan('plan_preserved_b', 'teacher_b', 'draft');

      const planBSnapshot = JSON.stringify(planDb.getById('plan_preserved_b'));
      const planBTasksSnapshot = JSON.stringify(taskDb.getByPlanId('plan_preserved_b'));

      // Check directory standards count before
      const stdBefore = directoryDb.searchStandards('science', 10);

      // Teacher A deletes their plan
      await planService.deletePlan('teacher_a', 'plan_preserved_a');

      // Plan B must be byte-for-byte identical
      const planBAfter = JSON.stringify(planDb.getById('plan_preserved_b'));
      const planBTasksAfter = JSON.stringify(taskDb.getByPlanId('plan_preserved_b'));
      expect(planBAfter).toBe(planBSnapshot);
      expect(planBTasksAfter).toBe(planBTasksSnapshot);

      // Directory standards must be completely unchanged
      const stdAfter = directoryDb.searchStandards('science', 10);
      expect(stdAfter.total).toBe(stdBefore.total);
    });
  });

  describe('3. Authorization, Privacy & Existence Leaking', () => {
    it('returns 404 for another users plan without leaking existence', async () => {
      createPlan('plan_secret_owner', 'teacher_secret', 'draft');

      const mock = createMockHttp({
        params: { id: 'plan_secret_owner' },
        headers: { 'Authorization': 'Bearer teacher_other' },
      });

      await planController.deletePlan(mock.req, mock.res);
      expect(mock.getStatus()).toBe(404);
      expect(mock.getBody().error).toMatch(/Plan not found or already deleted/);

      // Plan must still exist for the real owner
      expect(planDb.getById('plan_secret_owner')).toBeDefined();
    });

    it('returns 404 for non-existent plan ID', async () => {
      const mock = createMockHttp({
        params: { id: 'plan_does_not_exist_xyz' },
        headers: { 'Authorization': 'Bearer teacher_a' },
      });

      await planController.deletePlan(mock.req, mock.res);
      expect(mock.getStatus()).toBe(404);
    });

    it('returns 400 for invalid ID format', async () => {
      const mock = createMockHttp({
        params: { id: 'bad id with spaces!' },
        headers: { 'Authorization': 'Bearer teacher_a' },
      });

      await planController.deletePlan(mock.req, mock.res);
      expect(mock.getStatus()).toBe(400);
      expect(mock.getBody().error).toMatch(/Invalid plan ID format/);
    });

    it('returns 401 when request is unauthenticated', async () => {
      createPlan('plan_unauth_test', 'teacher_a', 'draft');

      const mock = createMockHttp({
        params: { id: 'plan_unauth_test' },
        headers: {}, // No Authorization or X-User-Id
      });

      await planController.deletePlan(mock.req, mock.res);
      expect(mock.getStatus()).toBe(401);
      expect(mock.getBody().error).toMatch(/Authentication required/);

      // Plan must remain intact
      expect(planDb.getById('plan_unauth_test')).toBeDefined();
    });
  });

  describe('4. Idempotency & Parallel Deletes', () => {
    it('handles duplicate and parallel deletion requests safely returning clean 404 on second call', async () => {
      createPlan('plan_idempotent_1', 'teacher_a', 'draft');

      // First delete succeeds
      const firstResult = await planService.deletePlan('teacher_a', 'plan_idempotent_1');
      expect(firstResult.success).toBe(true);

      // Second delete returns clean 404 error rather than crashing
      await expect(planService.deletePlan('teacher_a', 'plan_idempotent_1')).rejects.toThrow(
        /Plan not found or already deleted/
      );
    });

    it('handles parallel delete calls gracefully via controller', async () => {
      createPlan('plan_parallel_1', 'teacher_a', 'draft');

      const mock1 = createMockHttp({
        params: { id: 'plan_parallel_1' },
        headers: { 'Authorization': 'Bearer teacher_a' },
      });
      const mock2 = createMockHttp({
        params: { id: 'plan_parallel_1' },
        headers: { 'Authorization': 'Bearer teacher_a' },
      });

      await Promise.all([
        planController.deletePlan(mock1.req, mock1.res),
        planController.deletePlan(mock2.req, mock2.res),
      ]);

      const statuses = [mock1.getStatus(), mock2.getStatus()].sort();
      expect(statuses).toEqual([200, 404]);
    });
  });

  describe('5. Transaction Atomicity & Rollback', () => {
    it('rolls back completely if a failure occurs mid-transaction, leaving plan intact', async () => {
      createPlan('plan_atomic_fail', 'teacher_a', 'draft');
      const planSnapshot = JSON.stringify(planDb.getById('plan_atomic_fail'));
      const tasksSnapshot = JSON.stringify(taskDb.getByPlanId('plan_atomic_fail'));

      // Inject simulated mid-transaction failure
      planService._injectedFailure = true;

      await expect(planService.deletePlan('teacher_a', 'plan_atomic_fail')).rejects.toThrow(
        /Simulated transaction failure/
      );

      // Plan and tasks must be restored completely
      const planAfter = JSON.stringify(planDb.getById('plan_atomic_fail'));
      const tasksAfter = JSON.stringify(taskDb.getByPlanId('plan_atomic_fail'));
      expect(planAfter).toBe(planSnapshot);
      expect(tasksAfter).toBe(tasksSnapshot);
    });
  });

  describe('6. Active Plan Slot Accounting & Limit Enforcement', () => {
    it('reduces active count by one and frees slot when active plan is deleted', async () => {
      const p1 = createPlan('plan_act_1', 'teacher_a', 'active');
      const p2 = createPlan('plan_act_2', 'teacher_a', 'active');
      const p3 = createPlan('plan_act_3', 'teacher_a', 'active');
      const draft = createPlan('plan_draft_1', 'teacher_a', 'draft');

      let summary = planStatusService.getActiveSummary('teacher_a');
      expect(summary.activeCount).toBe(3);
      expect(summary.isAtLimit).toBe(true);

      // Activating draft should fail because limit is 3/3
      await expect(planStatusService.activatePlan('teacher_a', draft.id)).rejects.toThrow(
        /already have 3 active plans/
      );

      // Delete one of the active plans
      await planService.deletePlan('teacher_a', p1.id);

      summary = planStatusService.getActiveSummary('teacher_a');
      expect(summary.activeCount).toBe(2);
      expect(summary.isAtLimit).toBe(false);

      // Activating the draft now succeeds
      const activated = await planStatusService.activatePlan('teacher_a', draft.id);
      expect(activated.plan.status).toBe('active');

      summary = planStatusService.getActiveSummary('teacher_a');
      expect(summary.activeCount).toBe(3);
    });

    it('does not alter active count when deleting draft or completed plan', async () => {
      createPlan('plan_active_stay', 'teacher_a', 'active');
      const draft = createPlan('plan_draft_del', 'teacher_a', 'draft');

      expect(planStatusService.getActiveSummary('teacher_a').activeCount).toBe(1);

      await planService.deletePlan('teacher_a', draft.id);

      expect(planStatusService.getActiveSummary('teacher_a').activeCount).toBe(1);
    });
  });

  describe('7. Concurrency Races, Saves & Background Jobs', () => {
    it('rejects late save with 404 and does not recreate deleted plan', async () => {
      const plan = createPlan('plan_late_save', 'teacher_a', 'draft');

      // Delete plan
      await planService.deletePlan('teacher_a', plan.id);

      // Attempt late save (e.g. from editor tab or autosave)
      const mock = createMockHttp({
        params: { id: plan.id },
        headers: { 'Authorization': 'Bearer teacher_a' },
        body: { title: 'Recreated Plan Title Attempt' },
      });

      await planController.updatePlan(mock.req, mock.res);
      expect(mock.getStatus()).toBe(404);

      // Plan must NOT be inserted or recreated
      expect(planDb.getById(plan.id)).toBeUndefined();
    });

    it('skips background reference attachment if plan was deleted in the interim', async () => {
      const plan = createPlan('plan_ref_del', 'teacher_a', 'draft');

      // Delete plan
      await planService.deletePlan('teacher_a', plan.id);

      // Asynchronous reference retrieval completes
      await referenceService.fetchAndAttachReferences(plan.id);

      // Plan must still not exist
      expect(planDb.getById(plan.id)).toBeUndefined();
    });
  });

  describe('8. Search Invalidation', () => {
    it('immediately excludes deleted plan from search results', async () => {
      const plan = createPlan('plan_search_test', 'teacher_a', 'draft');

      // Search finds it
      const before = searchService.search({ query: plan.title, userId: 'teacher_a' });
      expect(before.counts.plan).toBeGreaterThan(0);

      // Delete plan
      await planService.deletePlan('teacher_a', plan.id);

      // Search immediately has 0 results for this plan
      const after = searchService.search({ query: plan.title, userId: 'teacher_a' });
      expect(after.counts.plan).toBe(0);
      expect(after.results.plan.some((p) => p.id === plan.id)).toBe(false);
    });
  });
});
