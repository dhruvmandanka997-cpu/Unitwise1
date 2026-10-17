import { Router } from 'express';
import { planController } from '../controllers/planController';

export const planRoutes = Router();

planRoutes.get('/plans', planController.getAllPlans);
planRoutes.get('/plans/:id', planController.getPlanById);
planRoutes.post('/plans', planController.createPlan);
planRoutes.put('/plans/:id', planController.updatePlan);
planRoutes.delete('/plans/:id', planController.deletePlan);
planRoutes.post('/plans/:id/duplicate', planController.duplicatePlan);

// Reference Materials endpoints
planRoutes.post('/plans/:id/references/fetch', planController.fetchReferences);
planRoutes.post('/plans/:id/references/add', planController.addCustomReference);
planRoutes.delete('/plans/:id/references/:refId', planController.removeReference);
