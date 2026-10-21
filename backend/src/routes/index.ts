import { Router } from 'express';
import { planRoutes } from './planRoutes';
import { aiRoutes } from './aiRoutes';
import { exportRoutes } from './exportRoutes';
import { settingsRoutes } from './settingsRoutes';
import { taskRoutes } from './taskRoutes';
import { curriculumRoutes } from './curriculumRoutes';
import { directoryRoutes } from './directoryRoutes';
import { searchRoutes } from './searchRoutes';
import { profileRoutes } from './profileRoutes';
import { authRoutes } from './authRoutes';

export const apiRoutes = Router();

apiRoutes.use(authRoutes);
apiRoutes.use(profileRoutes);
apiRoutes.use(settingsRoutes);
apiRoutes.use(curriculumRoutes);
apiRoutes.use(directoryRoutes);
apiRoutes.use(searchRoutes);
apiRoutes.use(planRoutes);
apiRoutes.use(taskRoutes);
apiRoutes.use(aiRoutes);
apiRoutes.use(exportRoutes);

