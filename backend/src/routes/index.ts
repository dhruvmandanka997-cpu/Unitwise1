import { Router } from 'express';
import { planRoutes } from './planRoutes';
import { aiRoutes } from './aiRoutes';
import { exportRoutes } from './exportRoutes';
import { settingsRoutes } from './settingsRoutes';
import { taskRoutes } from './taskRoutes';

export const apiRoutes = Router();

apiRoutes.use(settingsRoutes);
apiRoutes.use(planRoutes);
apiRoutes.use(taskRoutes);
apiRoutes.use(aiRoutes);
apiRoutes.use(exportRoutes);

