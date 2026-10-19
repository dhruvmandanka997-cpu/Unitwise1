import { describe, it, expect, beforeEach } from 'vitest';
import { planDb } from '../src/services/storage/db';
import {
  planStatusService,
  ActiveLimitReachedError,
  InvalidStatusTransitionError,
  StaleStateError,
} from '../src/services/plan/planStatusService';
import { statusAuditDb } from '../src/services/storage/statusAuditDb';
import { PedagogicalFallbackGenerator } from '../src/services/ai/pedagogicalFallback';
import { LessonPlan, normalizePlanStatus } from '../src/models/plan';

describe('Active-Plan Management & Concurrency Safety', () => {
  const generator = new PedagogicalFallbackGenerator();

  const createTestPlan = (id: string, userId: string, status: 'draft' | 'active' | 'completed' | 'cancelled' = 'draft'): LessonPlan => {
    const plan = generator.generate({
      title: `Test Plan ${id}`,
      subject: 'Mathematics',
      gradeLevel: 'Grade 9',
      curriculumFramework: 'Common Core',
      durationWeeks: 2,
      sessionsPerWeek: 5,
      classDurationMinutes: 50,
      format: 'session_sequence',
      overallGoals: `Goals for ${id}`,
      preferredTeachingMethods: ['Direct Instruction'],
      enableHomework: false,
    });
    plan.id = id;
    plan.userId = userId;
    plan.status = status;
    return planDb.save(plan);
  };

  beforeEach(() => {
    // Clear and re-initialize test data
    const all = planDb.getAll();
    for (const p of all) {
      planDb.delete(p.id);
    }
    statusAuditDb.clear();
  });

  describe('1. Status Mapping & Normalization', () => {
    it('normalizes legacy and unknown statuses safely without counting as active', () => {
      expect(normalizePlanStatus(undefined)).toBe('draft');
      expect(normalizePlanStatus(null)).toBe('draft');
      expect(normalizePlanStatus('unknown_status')).toBe('draft');
      expect(normalizePlanStatus('archived')).toBe('cancelled');
      expect(normalizePlanStatus('draft')).toBe('draft');
      expect(normalizePlanStatus('completed')).toBe('completed');
      expect(normalizePlanStatus('cancelled')).toBe('cancelled');
      expect(normalizePlanStatus('active')).toBe('active');
    });

    it('legacy plans with missing userId default safely to teacher_default', () => {
      const plan = createTestPlan('plan_legacy_1', 'teacher_default', 'draft');
      delete (plan as any).userId;
      planDb.save(plan);

      const summary = planStatusService.getActiveSummary('teacher_default');
      expect(summary.activeCount).toBe(0);
    });
  });

  describe('2. State Machine & Transition Rules', () => {
    it('allows valid transitions: draft -> active, active -> completed, active -> cancelled', async () => {
      const plan = createTestPlan('p_valid_1', 'user_trans', 'draft');

      // draft -> active
      const res1 = await planStatusService.activatePlan('user_trans', plan.id);
      expect(res1.plan.status).toBe('active');
      expect(res1.plan.previousStatus).toBe('draft');
      expect(res1.plan.statusChangedAt).toBeDefined();

      // active -> completed
      const res2 = await planStatusService.changePlanStatus('user_trans', plan.id, 'completed');
      expect(res2.status).toBe('completed');
      expect(res2.previousStatus).toBe('active');

      // completed -> active (reopen)
      const res3 = await planStatusService.activatePlan('user_trans', plan.id, 'Reopening completed plan');
      expect(res3.plan.status).toBe('active');

      // active -> cancelled (deactivate)
      const res4 = await planStatusService.changePlanStatus('user_trans', plan.id, 'cancelled');
      expect(res4.status).toBe('cancelled');

      // cancelled -> active (reactivate)
      const res5 = await planStatusService.activatePlan('user_trans', plan.id);
      expect(res5.plan.status).toBe('active');
    });

    it('rejects disallowed transitions with InvalidStatusTransitionError', async () => {
      const planDraft = createTestPlan('p_disallow_1', 'user_disallow', 'draft');

      // draft -> completed directly is disallowed
      await expect(
        planStatusService.changePlanStatus('user_disallow', planDraft.id, 'completed')
      ).rejects.toThrow(InvalidStatusTransitionError);

      // draft -> cancelled directly is disallowed
      await expect(
        planStatusService.changePlanStatus('user_disallow', planDraft.id, 'cancelled')
      ).rejects.toThrow(InvalidStatusTransitionError);

      // activate first
      await planStatusService.activatePlan('user_disallow', planDraft.id);

      // active -> draft directly is disallowed
      await expect(
        planStatusService.changePlanStatus('user_disallow', planDraft.id, 'draft')
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('activation is idempotent: activating an active plan succeeds with no change', async () => {
      const plan = createTestPlan('p_idem_1', 'user_idem', 'draft');
      const first = await planStatusService.activatePlan('user_idem', plan.id);
      expect(first.isIdempotent).toBe(false);
      expect(first.plan.status).toBe('active');

      const second = await planStatusService.activatePlan('user_idem', plan.id);
      expect(second.isIdempotent).toBe(true);
      expect(second.plan.status).toBe('active');

      const summary = planStatusService.getActiveSummary('user_idem');
      expect(summary.activeCount).toBe(1);
    });
  });

  describe('3. Single Source of Truth & Limit Enforcement (MAX_ACTIVE_PLANS = 3)', () => {
    it('blocks activating a 4th plan and throws ActiveLimitReachedError with active plans list', async () => {
      createTestPlan('p_lim_1', 'user_limit', 'active');
      createTestPlan('p_lim_2', 'user_limit', 'active');
      createTestPlan('p_lim_3', 'user_limit', 'active');
      const plan4 = createTestPlan('p_lim_4', 'user_limit', 'draft');

      let thrownError: ActiveLimitReachedError | null = null;
      try {
        await planStatusService.activatePlan('user_limit', plan4.id);
      } catch (err: any) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(ActiveLimitReachedError);
      expect(thrownError?.code).toBe('ACTIVE_LIMIT_REACHED');
      expect(thrownError?.limit).toBe(3);
      expect(thrownError?.activePlans.length).toBe(3);
      expect(thrownError?.activePlans.map((p) => p.id).sort()).toEqual(['p_lim_1', 'p_lim_2', 'p_lim_3']);

      // Assert plan4 remained draft
      const fetched4 = planDb.getById(plan4.id);
      expect(fetched4?.status).toBe('draft');

      // Assert summary count is still 3
      const summary = planStatusService.getActiveSummary('user_limit');
      expect(summary.activeCount).toBe(3);
      expect(summary.isAtLimit).toBe(true);
    });

    it('cancelling an active plan frees a slot allowing another activation', async () => {
      const p1 = createTestPlan('p_free_1', 'user_free', 'active');
      createTestPlan('p_free_2', 'user_free', 'active');
      createTestPlan('p_free_3', 'user_free', 'active');
      const p4 = createTestPlan('p_free_4', 'user_free', 'draft');

      // Verify at limit
      expect(planStatusService.getActiveSummary('user_free').activeCount).toBe(3);

      // Deactivate p1 (frees a slot)
      await planStatusService.changePlanStatus('user_free', p1.id, 'cancelled');
      expect(planStatusService.getActiveSummary('user_free').activeCount).toBe(2);

      // Now activate p4
      const res = await planStatusService.activatePlan('user_free', p4.id);
      expect(res.plan.status).toBe('active');
      expect(planStatusService.getActiveSummary('user_free').activeCount).toBe(3);
    });

    it('completing an active plan frees a slot allowing another activation', async () => {
      const p1 = createTestPlan('p_comp_1', 'user_comp', 'active');
      createTestPlan('p_comp_2', 'user_comp', 'active');
      createTestPlan('p_comp_3', 'user_comp', 'active');
      const p4 = createTestPlan('p_comp_4', 'user_comp', 'draft');

      // Complete p1
      await planStatusService.changePlanStatus('user_comp', p1.id, 'completed');
      expect(planStatusService.getActiveSummary('user_comp').activeCount).toBe(2);

      // Activate p4
      const res = await planStatusService.activatePlan('user_comp', p4.id);
      expect(res.plan.status).toBe('active');
      expect(planStatusService.getActiveSummary('user_comp').activeCount).toBe(3);
    });
  });

  describe('4. Atomic Swap', () => {
    it('atomically deactivates one plan and activates another', async () => {
      const pActive = createTestPlan('p_swap_active', 'user_swap', 'active');
      createTestPlan('p_swap_2', 'user_swap', 'active');
      createTestPlan('p_swap_3', 'user_swap', 'active');
      const pDraft = createTestPlan('p_swap_draft', 'user_swap', 'draft');

      const result = await planStatusService.swapActivePlans('user_swap', pActive.id, pDraft.id);
      expect(result.deactivatedPlan.status).toBe('cancelled');
      expect(result.activatedPlan.status).toBe('active');
      expect(result.summary.activeCount).toBe(3);

      const dbActive = planDb.getById(pActive.id);
      const dbDraft = planDb.getById(pDraft.id);
      expect(dbActive?.status).toBe('cancelled');
      expect(dbDraft?.status).toBe('active');
    });

    it('rejects invalid swap without altering any plan (all-or-nothing atomicity)', async () => {
      const pActive = createTestPlan('p_swap_act_fail', 'user_swap_fail', 'active');
      const pInvalid = createTestPlan('p_swap_other_user', 'different_user', 'draft');

      await expect(
        planStatusService.swapActivePlans('user_swap_fail', pActive.id, pInvalid.id)
      ).rejects.toThrow();

      // Ensure pActive remained active
      expect(planDb.getById(pActive.id)?.status).toBe('active');
      expect(planDb.getById(pInvalid.id)?.status).toBe('draft');
    });
  });

  describe('5. High-Concurrency Safety Under Simultaneous Requests', () => {
    it('simultaneous activations from a user at 2 active plans leaves exactly 3 active', async () => {
      createTestPlan('p_conc_1', 'user_conc', 'active');
      createTestPlan('p_conc_2', 'user_conc', 'active');

      // Create 10 draft plans
      const draftPlans: LessonPlan[] = [];
      for (let i = 0; i < 10; i++) {
        draftPlans.push(createTestPlan(`p_conc_draft_${i}`, 'user_conc', 'draft'));
      }

      // Fire 10 simultaneous activation requests
      const promises = draftPlans.map((p) =>
        planStatusService
          .activatePlan('user_conc', p.id)
          .then((res) => ({ success: true, id: p.id, res }))
          .catch((err) => ({ success: false, id: p.id, error: err }))
      );

      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      // Exactly 1 must have succeeded (bringing 2 -> 3), and exactly 9 must have failed with ACTIVE_LIMIT_REACHED
      expect(successCount).toBe(1);
      expect(failedCount).toBe(9);

      for (const f of results.filter((r) => !r.success)) {
        expect((f as any).error).toBeInstanceOf(ActiveLimitReachedError);
      }

      const summary = planStatusService.getActiveSummary('user_conc');
      expect(summary.activeCount).toBe(3);
    });

    it('parallel mix of activations and cancellations maintains consistent limit state', async () => {
      createTestPlan('p_mix_1', 'user_mix', 'active');
      createTestPlan('p_mix_2', 'user_mix', 'active');
      const pCancel = createTestPlan('p_mix_cancel', 'user_mix', 'active');

      const d1 = createTestPlan('p_mix_d1', 'user_mix', 'draft');
      const d2 = createTestPlan('p_mix_d2', 'user_mix', 'draft');

      // Run parallel cancel of pCancel, and activations of d1, d2
      const promises = [
        planStatusService.changePlanStatus('user_mix', pCancel.id, 'cancelled'),
        planStatusService.activatePlan('user_mix', d1.id),
        planStatusService.activatePlan('user_mix', d2.id),
      ].map((p) => p.catch((err) => err));

      await Promise.all(promises);

      const summary = planStatusService.getActiveSummary('user_mix');
      expect(summary.activeCount).toBeLessThanOrEqual(3);
    });
  });

  describe('6. Over-Limit Resolution & Stale Check', () => {
    it('successfully resolves an over-limit account down to selected kept plans', async () => {
      // Simulate an account with 5 active plans
      const p1 = createTestPlan('p_over_1', 'user_over', 'active');
      const p2 = createTestPlan('p_over_2', 'user_over', 'active');
      const p3 = createTestPlan('p_over_3', 'user_over', 'active');
      const p4 = createTestPlan('p_over_4', 'user_over', 'active');
      const p5 = createTestPlan('p_over_5', 'user_over', 'active');

      const initialSummary = planStatusService.getActiveSummary('user_over');
      expect(initialSummary.activeCount).toBe(5);
      expect(initialSummary.isOverLimit).toBe(true);

      const expectedIds = [p1.id, p2.id, p3.id, p4.id, p5.id];
      const keepIds = [p1.id, p3.id, p5.id];

      const result = await planStatusService.resolveOverLimit('user_over', {
        keepPlanIds: keepIds,
        expectedActivePlanIds: expectedIds,
        reason: 'Teacher kept top 3 instructional units',
      });

      expect(result.summary.activeCount).toBe(3);
      expect(result.summary.isOverLimit).toBe(false);
      expect(result.keptPlans.length).toBe(3);
      expect(result.deactivatedPlans.length).toBe(2);

      expect(planDb.getById(p2.id)?.status).toBe('cancelled');
      expect(planDb.getById(p4.id)?.status).toBe('cancelled');
      expect(planDb.getById(p1.id)?.status).toBe('active');
    });

    it('rejects stale over-limit resolution with StaleStateError', async () => {
      const p1 = createTestPlan('p_stale_1', 'user_stale', 'active');
      const p2 = createTestPlan('p_stale_2', 'user_stale', 'active');
      const p3 = createTestPlan('p_stale_3', 'user_stale', 'active');
      const p4 = createTestPlan('p_stale_4', 'user_stale', 'active');

      // Stale expectedActivePlanIds does not match current state
      const staleExpected = [p1.id, p2.id];

      await expect(
        planStatusService.resolveOverLimit('user_stale', {
          keepPlanIds: [p1.id, p2.id],
          expectedActivePlanIds: staleExpected,
        })
      ).rejects.toThrow(StaleStateError);
    });
  });

  describe('7. Per-User Isolation', () => {
    it("user A's active count does not restrict user B", async () => {
      createTestPlan('p_userA_1', 'user_A', 'active');
      createTestPlan('p_userA_2', 'user_A', 'active');
      createTestPlan('p_userA_3', 'user_A', 'active');

      const planB = createTestPlan('p_userB_1', 'user_B', 'draft');

      // User A is at 3, User B has 0. User B must be able to activate
      const resB = await planStatusService.activatePlan('user_B', planB.id);
      expect(resB.plan.status).toBe('active');

      expect(planStatusService.getActiveSummary('user_A').activeCount).toBe(3);
      expect(planStatusService.getActiveSummary('user_B').activeCount).toBe(1);
    });
  });

  describe('8. Zero Data Loss & Audit Logging', () => {
    it('status transitions modify only status and audit fields without altering lesson content', async () => {
      const plan = createTestPlan('p_dataloss_1', 'user_data', 'draft');
      const originalLessons = JSON.stringify(plan.weeklyPlans);
      const originalAssessment = JSON.stringify(plan.finalAssessment);

      await planStatusService.activatePlan('user_data', plan.id);
      const updated = planDb.getById(plan.id);

      expect(JSON.stringify(updated?.weeklyPlans)).toBe(originalLessons);
      expect(JSON.stringify(updated?.finalAssessment)).toBe(originalAssessment);

      // Verify audit entry was written
      const audits = statusAuditDb.getByPlanId(plan.id);
      expect(audits.length).toBe(1);
      expect(audits[0].fromStatus).toBe('draft');
      expect(audits[0].toStatus).toBe('active');
      expect(audits[0].userId).toBe('user_data');
    });
  });
});
