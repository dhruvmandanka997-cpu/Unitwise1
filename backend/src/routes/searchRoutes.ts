import { Router } from 'express';
import { searchController } from '../controllers/searchController';

export const searchRoutes = Router();

// GET /api/search?q=...&limit=...&types=...
searchRoutes.get('/search', searchController.search);
