import { Router } from 'express';
import { planController } from '../controllers/planController';

export const planRoutes = Router();

// Active Plan Management Endpoints (specific routes before :id)
planRoutes.get('/plans/active-summary', planController.getActiveSummary);
planRoutes.post('/plans/swap', planController.swapPlans);
planRoutes.post('/plans/active/resolve', planController.resolveOverLimit);

// General Plans CRUD
planRoutes.get('/plans', planController.getAllPlans);
planRoutes.get('/plans/:id', planController.getPlanById);
planRoutes.post('/plans', planController.createPlan);
planRoutes.put('/plans/:id', planController.updatePlan);
planRoutes.delete('/plans/:id', planController.deletePlan);
planRoutes.post('/plans/:id/duplicate', planController.duplicatePlan);

// Plan Status Transition Endpoints
planRoutes.post('/plans/:id/status', planController.updateStatus);
planRoutes.post('/plans/:id/activate', planController.activatePlan);
planRoutes.post('/plans/:id/deactivate', planController.deactivatePlan);

// Reference Materials endpoints
planRoutes.post('/plans/:id/references/fetch', planController.fetchReferences);
planRoutes.post('/plans/:id/references/add', planController.addCustomReference);
planRoutes.delete('/plans/:id/references/:refId', planController.removeReference);
