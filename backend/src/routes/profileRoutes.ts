import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { authMiddleware } from '../middlewares/authMiddleware';

export const profileRoutes = Router();

profileRoutes.get('/profile', authMiddleware, profileController.getProfile);
profileRoutes.put('/profile', authMiddleware, profileController.saveProfile);
profileRoutes.patch('/profile', authMiddleware, profileController.saveProfile);
profileRoutes.post('/profile/photo', authMiddleware, profileController.uploadPhoto);
profileRoutes.delete('/profile/photo', authMiddleware, profileController.deletePhoto);
