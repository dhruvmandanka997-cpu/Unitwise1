import { Request, Response } from 'express';
import { planDb } from '../services/storage/db';
import { taskDb } from '../services/storage/taskDb';
import { aiEngine } from '../services/ai';
import { referenceService } from '../services/references/referenceService';
import { planStatusService } from '../services/plan/planStatusService';
import { resolveAuthUser } from './planController';

export const aiController = {
  async generatePlan(req: Request, res: Response) {
    try {
      const plan = await aiEngine.generatePlan(req.body);
      const userId = resolveAuthUser(req);
      plan.userId = userId;
      plan.referencesStatus = 'pending';

      const activePlans = planStatusService.getUserActivePlans(userId);
      let savedAsDraftDueToLimit = false;

      if (req.body.createAsActive || req.body.activateOnCreate) {
        if (activePlans.length < planStatusService.maxActivePlans) {
          plan.status = 'active';
          plan.statusChangedAt = new Date().toISOString();
        } else {
          plan.status = 'draft';
          savedAsDraftDueToLimit = true;
        }
      } else {
        plan.status = 'draft';
      }

      try {
        planDb.save(plan);
        taskDb.syncWithPlans(planDb.getAll());
      } catch (saveErr) {
        console.warn('Notice: Plan persistence encountered warning in storage layer:', saveErr);
      }

      res.status(201).json({
        ...plan,
        savedAsDraftDueToLimit,
        limitNotice: savedAsDraftDueToLimit
          ? `Saved as draft because you have ${planStatusService.maxActivePlans} active plans.`
          : undefined,
      });

      // Trigger server-side reference retrieval asynchronously in background
      referenceService.fetchAndAttachReferences(plan.id).catch((refErr) => {
        console.warn(`Asynchronous reference retrieval for ${plan.id} warning:`, refErr?.message || refErr);
      });
    } catch (err: unknown) {
      const error = err as Error;
      const correlationId = 'gen_' + Math.random().toString(36).substring(2, 8);
      console.error(`[AI Controller ${correlationId}] Generation failed:`, error);

      let userFriendlyMessage = error?.message || 'Plan generation could not complete. The AI service is temporarily unavailable. Please try again.';
      if (userFriendlyMessage.includes('API_KEY_INVALID') || userFriendlyMessage.includes('API key not valid')) {
        userFriendlyMessage = 'Invalid AI provider API key. Please check your GEMINI_API_KEY configuration.';
      } else if (userFriendlyMessage.includes('404') && userFriendlyMessage.includes('models/')) {
        userFriendlyMessage = 'Configured AI model was not found. Please verify GEMINI_MODEL (recommended: gemini-1.5-flash).';
      } else if (userFriendlyMessage.includes('quota') || userFriendlyMessage.includes('RESOURCE_EXHAUSTED')) {
        userFriendlyMessage = 'AI provider rate limit or quota exceeded. Please try again in a few moments.';
      }

      res.status(400).json({
        error: 'Failed to generate curriculum plan',
        message: userFriendlyMessage,
        correlationId,
      });
    }
  },

  async regenerateSession(req: Request, res: Response) {
    try {
      const plan = planDb.getById(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const { weekNumber, sessionNumber, instruction } = req.body;
      const newSession = await aiEngine.regenerateSession(
        plan,
        Number(weekNumber),
        Number(sessionNumber),
        instruction
      );

      const targetWeek = plan.weeklyPlans.find((w) => w.weekNumber === Number(weekNumber));
      if (targetWeek) {
        const sessIdx = targetWeek.sessions.findIndex((s) => s.sessionNumber === Number(sessionNumber));
        if (sessIdx !== -1) {
          targetWeek.sessions[sessIdx] = newSession;
          if (!planDb.getById(plan.id)) {
            return res.status(404).json({ error: 'Plan was deleted during generation.' });
          }
          planDb.update(plan.id, { weeklyPlans: plan.weeklyPlans });
          taskDb.syncWithPlans(planDb.getAll());
        }
      }

      res.json({ plan, session: newSession });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Session regeneration failed:', error);
      res.status(500).json({ error: 'Failed to regenerate session', message: error?.message });
    }
  },

  async adaptSession(req: Request, res: Response) {
    try {
      const plan = planDb.getById(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const { weekNumber, sessionNumber, adaptationType } = req.body;
      const adaptedSession = await aiEngine.adaptSession(
        plan,
        Number(weekNumber),
        Number(sessionNumber),
        adaptationType
      );

      const targetWeek = plan.weeklyPlans.find((w) => w.weekNumber === Number(weekNumber));
      if (targetWeek) {
        const sessIdx = targetWeek.sessions.findIndex((s) => s.sessionNumber === Number(sessionNumber));
        if (sessIdx !== -1) {
          targetWeek.sessions[sessIdx] = adaptedSession;
          if (!planDb.getById(plan.id)) {
            return res.status(404).json({ error: 'Plan was deleted during adaptation.' });
          }
          planDb.update(plan.id, { weeklyPlans: plan.weeklyPlans });
          taskDb.syncWithPlans(planDb.getAll());
        }
      }

      res.json({ plan, session: adaptedSession });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Session adaptation failed:', error);
      res.status(500).json({ error: 'Failed to adapt session', message: error?.message });
    }
  },

  async regenerateWeek(req: Request, res: Response) {
    try {
      const plan = planDb.getById(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const { weekNumber, instruction } = req.body;
      const updatedWeek = await aiEngine.regenerateWeek(plan, Number(weekNumber), instruction);

      const weekIdx = plan.weeklyPlans.findIndex((w) => w.weekNumber === Number(weekNumber));
      if (weekIdx !== -1) {
        plan.weeklyPlans[weekIdx] = updatedWeek;
        if (!planDb.getById(plan.id)) {
          return res.status(404).json({ error: 'Plan was deleted during generation.' });
        }
        planDb.update(plan.id, { weeklyPlans: plan.weeklyPlans });
        taskDb.syncWithPlans(planDb.getAll());
      }

      res.json({ plan, week: updatedWeek });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Week regeneration failed:', error);
      res.status(500).json({ error: 'Failed to regenerate week', message: error?.message });
    }
  },
};
