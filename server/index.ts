import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { planDb } from './storage/db';
import { aiEngine } from './ai';
import { getSeedPlans } from './seeds';
import { generateDocx } from './export/docxExport';
import { generatePdfBuffer } from './export/pdfExport';
import { generateCsv } from './export/csvExport';
import { generatePrintHtml } from './export/htmlPrintExport';
import { LessonPlanSchema } from '../src/types/plan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Seed initial database if empty
planDb.seedIfEmpty(getSeedPlans());

// --- Health & System Info ---
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiProvider: aiEngine.getProviderName(),
    liveAiAvailable: aiEngine.isLiveAiAvailable(),
    totalPlans: planDb.getAll().length,
  });
});

// --- Settings ---
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(planDb.getSettings());
});

app.post('/api/settings', (req: Request, res: Response) => {
  const updated = planDb.saveSettings(req.body);
  res.json(updated);
});

// --- Plans CRUD ---
app.get('/api/plans', (req: Request, res: Response) => {
  const plans = planDb.getAll();
  res.json(plans);
});

app.get('/api/plans/:id', (req: Request, res: Response) => {
  const plan = planDb.getById(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  res.json(plan);
});

app.post('/api/plans', (req: Request, res: Response) => {
  const parsed = LessonPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid plan schema', details: parsed.error.issues });
  }
  const saved = planDb.save(parsed.data);
  res.status(201).json(saved);
});

app.put('/api/plans/:id', (req: Request, res: Response) => {
  const updated = planDb.update(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Plan not found to update' });
  }
  res.json(updated);
});

app.delete('/api/plans/:id', (req: Request, res: Response) => {
  const deleted = planDb.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Plan not found to delete' });
  }
  res.json({ success: true, id: req.params.id });
});

app.post('/api/plans/:id/duplicate', (req: Request, res: Response) => {
  const clone = planDb.duplicate(req.params.id);
  if (!clone) {
    return res.status(404).json({ error: 'Plan not found to duplicate' });
  }
  res.status(201).json(clone);
});

// --- Plan Generation & AI ---
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const plan = await aiEngine.generatePlan(req.body);
    // Persist to database automatically
    planDb.save(plan);
    res.status(201).json(plan);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Generation failed:', error);
    res.status(400).json({
      error: 'Failed to generate curriculum plan',
      message: error?.message || 'Unknown generation error',
    });
  }
});

// Regenerate single session
app.post('/api/plans/:id/regenerate-session', async (req: Request, res: Response) => {
  try {
    const plan = planDb.getById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { weekNumber, sessionNumber, instruction } = req.body;
    const newSession = await aiEngine.regenerateSession(plan, Number(weekNumber), Number(sessionNumber), instruction);

    // Update in plan and persist
    const targetWeek = plan.weeklyPlans.find(w => w.weekNumber === Number(weekNumber));
    if (targetWeek) {
      const sessIdx = targetWeek.sessions.findIndex(s => s.sessionNumber === Number(sessionNumber));
      if (sessIdx !== -1) {
        targetWeek.sessions[sessIdx] = newSession;
        planDb.save(plan);
      }
    }

    res.json({ plan, session: newSession });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Session regeneration failed:', error);
    res.status(500).json({ error: 'Failed to regenerate session', message: error?.message });
  }
});

// Adapt session (simplify, interactive, differentiation, shorten)
app.post('/api/plans/:id/adapt-session', async (req: Request, res: Response) => {
  try {
    const plan = planDb.getById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { weekNumber, sessionNumber, adaptationType } = req.body;
    const adaptedSession = await aiEngine.adaptSession(
      plan,
      Number(weekNumber),
      Number(sessionNumber),
      adaptationType
    );

    const targetWeek = plan.weeklyPlans.find(w => w.weekNumber === Number(weekNumber));
    if (targetWeek) {
      const sessIdx = targetWeek.sessions.findIndex(s => s.sessionNumber === Number(sessionNumber));
      if (sessIdx !== -1) {
        targetWeek.sessions[sessIdx] = adaptedSession;
        planDb.save(plan);
      }
    }

    res.json({ plan, session: adaptedSession });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Session adaptation failed:', error);
    res.status(500).json({ error: 'Failed to adapt session', message: error?.message });
  }
});

// Regenerate single week
app.post('/api/plans/:id/regenerate-week', async (req: Request, res: Response) => {
  try {
    const plan = planDb.getById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { weekNumber, instruction } = req.body;
    const updatedWeek = await aiEngine.regenerateWeek(plan, Number(weekNumber), instruction);

    const weekIdx = plan.weeklyPlans.findIndex(w => w.weekNumber === Number(weekNumber));
    if (weekIdx !== -1) {
      plan.weeklyPlans[weekIdx] = updatedWeek;
      planDb.save(plan);
    }

    res.json({ plan, week: updatedWeek });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Week regeneration failed:', error);
    res.status(500).json({ error: 'Failed to regenerate week', message: error?.message });
  }
});

// --- Exports ---
app.get('/api/plans/:id/export/docx', async (req: Request, res: Response) => {
  try {
    const plan = planDb.getById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const buffer = await generateDocx(plan);
    const filename = `${plan.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Plan.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('DOCX export failed:', error);
    res.status(500).json({ error: 'DOCX generation failed', message: error?.message });
  }
});

app.get('/api/plans/:id/export/pdf', (req: Request, res: Response) => {
  try {
    const plan = planDb.getById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const buffer = generatePdfBuffer(plan);
    const filename = `${plan.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Plan.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('PDF export failed:', error);
    res.status(500).json({ error: 'PDF generation failed', message: error?.message });
  }
});

app.get('/api/plans/:id/export/csv', (req: Request, res: Response) => {
  try {
    const plan = planDb.getById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const csvContent = generateCsv(plan);
    const filename = `${plan.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Schedule.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('CSV export failed:', error);
    res.status(500).json({ error: 'CSV generation failed', message: error?.message });
  }
});

app.get('/api/plans/:id/export/print', (req: Request, res: Response) => {
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
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`[LessonCraft AI Server] Listening on http://localhost:${PORT}`);
});
