import { Router } from 'express';
import { directoryController } from '../controllers/directoryController';

export const directoryRoutes = Router();

// Country & region directory
directoryRoutes.get('/directory/countries', directoryController.getCountries);
directoryRoutes.get('/directory/countries/:iso2/regions', directoryController.getRegions);

// Curricula directory & lookup
directoryRoutes.get('/directory/curricula', directoryController.getCurricula);
directoryRoutes.get('/directory/curricula/:id', directoryController.getCurriculumById);

// Community suggestion & admin review
directoryRoutes.post('/directory/suggest', directoryController.suggestCurriculum);
directoryRoutes.get('/directory/suggestions', directoryController.getSuggestions);
directoryRoutes.put('/directory/suggestions/:id/review', directoryController.reviewSuggestion);

// Real coverage & gap analysis
directoryRoutes.get('/directory/coverage', directoryController.getCoverageReport);
