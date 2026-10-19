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

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Seed initial database if empty
planDb.seedIfEmpty(getSeedPlans());

// Seed directory database with ISO standards & verified curricula
seedDirectoryDatabase();

// Initialize and sync task tracker with all plans
taskDb.syncWithPlans(planDb.getAll());

// Root health & status endpoints for diagnostic convenience
app.get('/', (_req, res) => {
  res.json({
    name: BRAND.serverName,
    status: 'running',
    version: BRAND.version,
    endpoints: {
      health: '/api/health',
      plans: '/api/plans',
      generate: '/api/generate',
      settings: '/api/settings',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Mount API routes
app.use('/api', apiRoutes);

// Start Express Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[${BRAND.name} Server] Listening on http://localhost:${config.port} (0.0.0.0)`);
  });
}

export { app };
export default app;
