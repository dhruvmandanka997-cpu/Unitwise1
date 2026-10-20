import express from 'express';
import cors from 'cors';
import { config } from './config';
import { planDb } from './services/storage/db';
import { taskDb } from './services/storage/taskDb';
import { getSeedPlans } from './seeds';
import { apiRoutes } from './routes';
import { seedDirectoryDatabase } from './services/directory/seedDirectory';

import { BRAND } from './config/brand';

const app = express();

const allowedOrigins = config.corsOrigin === '*' 
  ? true 
  : config.corsOrigin.split(',').map((s) => s.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'Accept', 'Origin'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Seed initial database if empty
planDb.seedIfEmpty(getSeedPlans());

// Seed directory database with ISO standards & verified curricula
seedDirectoryDatabase();

// Initialize and sync task tracker with all plans
taskDb.syncWithPlans(planDb.getAll());

// Root health & status endpoints for diagnostic convenience
const rootHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    name: BRAND.serverName,
    status: 'running',
    version: BRAND.version,
    endpoints: {
      health: '/api/health',
      plans: '/api/plans',
      generate: '/api/generate',
      settings: '/api/settings',
      directory: '/api/directory/countries',
      search: '/api/search',
      tasks: '/api/tasks',
    },
  });
};

app.get('/', rootHandler);
app.get('/api', rootHandler);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Mount API routes under both /api and / so all hosting setups and rewrites match
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Start Express Server (only when not running inside a test or serverless environment like Vercel)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[${BRAND.name} Server] Listening on http://localhost:${config.port} (0.0.0.0)`);
  });
}

export { app };
export default app;
