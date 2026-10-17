import { Request, Response } from 'express';
import { planDb } from '../services/storage/db';
import { aiEngine } from '../services/ai';

export const settingsController = {
  getHealth(req: Request, res: Response) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      aiProvider: aiEngine.getProviderName(),
      liveAiAvailable: aiEngine.isLiveAiAvailable(),
      totalPlans: planDb.getAll().length,
    });
  },

  getSettings(req: Request, res: Response) {
    res.json(planDb.getSettings());
  },

  saveSettings(req: Request, res: Response) {
    const updated = planDb.saveSettings(req.body);
    res.json(updated);
  },
};
