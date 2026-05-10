import { Router, Request, Response } from 'express';
import { getLatestRiskScores, getAllTokenMints, getTokenWithCreators } from '../db/repository';
import { logger } from '../utils/logger';

export const ecosystemRouter = Router();

// ─── GET /api/ecosystem/tokens ────────────────────────────────────────────────
ecosystemRouter.get('/tokens', async (_req: Request, res: Response) => {
  try {
    const mints = await getAllTokenMints();
    return res.json({ count: mints.length, mints });
  } catch (err: any) {
    logger.error(`/api/ecosystem/tokens error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to list tokens' });
  }
});

// ─── GET /api/ecosystem/risk ──────────────────────────────────────────────────
ecosystemRouter.get('/risk', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const scores = await getLatestRiskScores(limit);
    return res.json(scores);
  } catch (err: any) {
    logger.error(`/api/ecosystem/risk error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to fetch risk scores' });
  }
});

// ─── GET /api/ecosystem/token/:mint ──────────────────────────────────────────
ecosystemRouter.get('/token/:mint', async (req: Request, res: Response) => {
  try {
    const { mint } = req.params;
    const token = await getTokenWithCreators(mint);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    return res.json(token);
  } catch (err: any) {
    logger.error(`/api/ecosystem/token error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to fetch token' });
  }
});
