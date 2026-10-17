import { Router } from 'express';
import { taskController } from '../controllers/taskController';

export const taskRoutes = Router();

taskRoutes.get('/tasks', taskController.getAllTasks);
taskRoutes.get('/tasks/stats', taskController.getTaskStats);
taskRoutes.get('/tasks/:id', taskController.getTaskById);
taskRoutes.put('/tasks/:id', taskController.updateTask);
taskRoutes.post('/tasks/:id/toggle-checklist', taskController.toggleChecklist);
taskRoutes.delete('/tasks/:id', taskController.deleteTask);
taskRoutes.post('/tasks/sync', taskController.syncTasks);
