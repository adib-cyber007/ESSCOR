import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { bagsRouter } from './routes/bags.routes';
import { ecosystemRouter } from './routes/ecosystem.routes';
import { runFullSync } from './jobs/sync.job';
import { logger } from './utils/logger';
import { prisma } from './db/repository';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  logger.debug(`→ ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/bags', bagsRouter);
app.use('/api/ecosystem', ecosystemRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Cron: sync every 20 minutes ─────────────────────────────────────────────
cron.schedule('*/20 * * * *', async () => {
  logger.info('⏰ Cron: triggering sync…');
  await runFullSync();
});

// ─── Startup ──────────────────────────────────────────────────────────────────
async function main() {
  // Verify DB connection
  await prisma.$connect();
  logger.info('📦 PostgreSQL connected');

  app.listen(PORT, () => {
    logger.info(`🚀 ESSCOR backend running on http://localhost:${PORT}`);
  });

  // Run initial sync on startup (non-blocking)
  runFullSync().catch((err) => logger.error(`Initial sync error: ${err.message}`));
}

main().catch((err) => {
  logger.error(`Fatal startup error: ${err.message}`);
  process.exit(1);
});
