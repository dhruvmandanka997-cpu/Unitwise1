import { Router } from 'express';
import { exportController } from '../controllers/exportController';

export const exportRoutes = Router();

exportRoutes.get('/plans/:id/export/docx', exportController.exportDocx);
exportRoutes.get('/plans/:id/export/pdf', exportController.exportPdf);
exportRoutes.get('/plans/:id/export/csv', exportController.exportCsv);
exportRoutes.get('/plans/:id/export/print', exportController.exportPrint);
