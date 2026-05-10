import express from 'express';
import cors from 'cors';
import { bagsRouter } from './routes/bags.routes';
import { ecosystemRouter } from './routes/ecosystem.routes';
import { logger } from './utils/logger';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use((req, _res, next) => {
  logger.debug(`→ ${req.method} ${req.path}`);
  next();
});

app.use('/api/bags', bagsRouter);
app.use('/api/ecosystem', ecosystemRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;
