import { Router } from 'express';
import { aiController } from '../controllers/aiController';

export const aiRoutes = Router();

aiRoutes.post('/generate', aiController.generatePlan);
aiRoutes.post('/plans/:id/regenerate-session', aiController.regenerateSession);
aiRoutes.post('/plans/:id/adapt-session', aiController.adaptSession);
aiRoutes.post('/plans/:id/regenerate-week', aiController.regenerateWeek);
