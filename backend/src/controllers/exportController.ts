import { Request, Response } from 'express';
import { planDb } from '../services/storage/db';
import { generateDocx } from '../services/export/docxExport';
import { generatePdfBuffer } from '../services/export/pdfExport';
import { generateCsv } from '../services/export/csvExport';
import { generatePrintHtml } from '../services/export/htmlPrintExport';
import { BRAND } from '../config/brand';

export const exportController = {
  async exportDocx(req: Request, res: Response) {
    try {
      const plan = planDb.getById(req.params.id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      const buffer = await generateDocx(plan);
      const safeTitle = plan.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${BRAND.name}-${safeTitle}-Plan.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('DOCX export failed:', error);
      res.status(500).json({ error: 'DOCX generation failed', message: error?.message });
    }
  },

  exportPdf(req: Request, res: Response) {
    try {
      const plan = planDb.getById(req.params.id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      const buffer = generatePdfBuffer(plan);
      const safeTitle = plan.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${BRAND.name}-${safeTitle}-Plan.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('PDF export failed:', error);
      res.status(500).json({ error: 'PDF generation failed', message: error?.message });
    }
  },

  exportCsv(req: Request, res: Response) {
    try {
      const plan = planDb.getById(req.params.id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      const csvContent = generateCsv(plan);
      const safeTitle = plan.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${BRAND.name}-${safeTitle}-Schedule.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('CSV export failed:', error);
      res.status(500).json({ error: 'CSV generation failed', message: error?.message });
    }
  },

  exportPrint(req: Request, res: Response) {
    try {
      const plan = planDb.getById(req.params.id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      const html = generatePrintHtml(plan);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Print view generation failed:', error);
      res.status(500).json({ error: 'Print view failed', message: error?.message });
    }
  },
};
