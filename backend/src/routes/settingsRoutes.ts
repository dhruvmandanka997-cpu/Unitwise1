import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';

export const settingsRoutes = Router();

settingsRoutes.get('/health', settingsController.getHealth);
settingsRoutes.get('/settings', settingsController.getSettings);
settingsRoutes.post('/settings', settingsController.saveSettings);
