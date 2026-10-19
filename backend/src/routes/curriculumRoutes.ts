import { Router } from 'express';
import { curriculumController } from '../controllers/curriculumController';

export const curriculumRoutes = Router();

// Catalog
curriculumRoutes.get('/curriculum/catalog', curriculumController.getCatalog);

// Preferences
curriculumRoutes.get('/curriculum/preferences', curriculumController.getPreferences);
curriculumRoutes.put('/curriculum/preferences', curriculumController.savePreferences);
curriculumRoutes.post('/curriculum/preferences', curriculumController.savePreferences);

// Single Plan Snapshot update
curriculumRoutes.post('/curriculum/plans/:id/snapshot', curriculumController.setPlanCurriculum);
curriculumRoutes.put('/curriculum/plans/:id/snapshot', curriculumController.setPlanCurriculum);
