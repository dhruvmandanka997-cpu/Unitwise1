import { Request, Response } from 'express';
import { taskDb } from '../services/storage/taskDb';
import { planDb } from '../services/storage/db';
import { TaskStatus } from '../models/task';

export const taskController = {
  getAllTasks(req: Request, res: Response) {
    const planId = req.query.planId as string | undefined;
    const status = req.query.status as TaskStatus | undefined;
    const search = req.query.search as string | undefined;

    const tasks = taskDb.getAll({ planId, status, search });
    res.json(tasks);
  },

  getTaskStats(req: Request, res: Response) {
    const planId = req.query.planId as string | undefined;
    const stats = taskDb.getStats(planId);
    res.json(stats);
  },

  getTaskById(req: Request, res: Response) {
    const task = taskDb.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  },

  updateTask(req: Request, res: Response) {
    const updated = taskDb.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found to update' });
    }
    res.json(updated);
  },

  toggleChecklist(req: Request, res: Response) {
    const { itemId, completed } = req.body;
    if (typeof itemId !== 'string' || typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'itemId (string) and completed (boolean) are required' });
    }

    const updated = taskDb.toggleChecklist(req.params.id, itemId, completed);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found to toggle checklist' });
    }
    res.json(updated);
  },

  deleteTask(req: Request, res: Response) {
    const deleted = taskDb.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found to delete' });
    }
    res.json({ success: true, id: req.params.id });
  },

  syncTasks(_req: Request, res: Response) {
    const plans = planDb.getAll();
    taskDb.syncWithPlans(plans);
    res.json({ success: true, count: taskDb.getAll().length });
  },
};
