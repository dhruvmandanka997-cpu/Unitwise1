import { Request, Response } from 'express';
import { planDb } from '../services/storage/db';
import { taskDb } from '../services/storage/taskDb';
import { LessonPlanSchema } from '../models/plan';
import { referenceService } from '../services/references/referenceService';

export const planController = {
  getAllPlans(req: Request, res: Response) {
    const plans = planDb.getAll();
    res.json(plans);
  },

  getPlanById(req: Request, res: Response) {
    const plan = planDb.getById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(plan);
  },

  createPlan(req: Request, res: Response) {
    const parsed = LessonPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid plan schema', details: parsed.error.issues });
    }
    const saved = planDb.save(parsed.data);
    taskDb.syncWithPlans(planDb.getAll());
    res.status(201).json(saved);
  },

  updatePlan(req: Request, res: Response) {
    const updated = planDb.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Plan not found to update' });
    }
    taskDb.syncWithPlans(planDb.getAll());
    res.json(updated);
  },

  deletePlan(req: Request, res: Response) {
    const deleted = planDb.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Plan not found to delete' });
    }
    taskDb.deleteByPlanId(req.params.id);
    res.json({ success: true, id: req.params.id });
  },

  duplicatePlan(req: Request, res: Response) {
    const clone = planDb.duplicate(req.params.id);
    if (!clone) {
      return res.status(404).json({ error: 'Plan not found to duplicate' });
    }
    taskDb.syncWithPlans(planDb.getAll());
    res.status(201).json(clone);
  },

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
