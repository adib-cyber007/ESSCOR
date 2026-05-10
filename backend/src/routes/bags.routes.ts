import { Router, Request, Response } from 'express';
import { getTokenCreators, getTokenLifetimeFees } from '../services/bags.service';
import {
  upsertTokenFromBags,
  upsertTokenCreators,
  getTokenWithCreators,
  writeSyncLog,
} from '../db/repository';
import { logger } from '../utils/logger';

export const bagsRouter = Router();

// ─── GET /api/bags/creators?mint=<address> ────────────────────────────────────
bagsRouter.get('/creators', async (req: Request, res: Response) => {
  const mint = req.query.mint as string;
  if (!mint) return res.status(400).json({ error: 'mint query param required' });

  const start = Date.now();
  try {
    const data = await getTokenCreators(mint);
    if (!data) return res.status(404).json({ error: 'Token not found on Bags.fm' });

    // Persist to DB
    await upsertTokenFromBags(data, null);
    if (data.creators?.length) await upsertTokenCreators(mint, data.creators);
    await writeSyncLog('bags', 'success', mint, 'creators fetched', Date.now() - start);

    const enriched = await getTokenWithCreators(mint);
    return res.json(enriched);
  } catch (err: any) {
    logger.error(`/api/bags/creators error: ${err.message}`);
    await writeSyncLog('bags', 'error', mint, err.message, Date.now() - start);
    return res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

// ─── GET /api/bags/fees?mint=<address> ───────────────────────────────────────
bagsRouter.get('/fees', async (req: Request, res: Response) => {
  const mint = req.query.mint as string;
  if (!mint) return res.status(400).json({ error: 'mint query param required' });

  const start = Date.now();
  try {
    const fees = await getTokenLifetimeFees(mint);
    if (!fees) return res.status(404).json({ error: 'Fee data not found for mint' });

    await writeSyncLog('bags', 'success', mint, 'fees fetched', Date.now() - start);
    return res.json(fees);
  } catch (err: any) {
    logger.error(`/api/bags/fees error: ${err.message}`);
    await writeSyncLog('bags', 'error', mint, err.message, Date.now() - start);
    return res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

// ─── GET /api/bags/token?mint=<address> (cached DB read) ─────────────────────
bagsRouter.get('/token', async (req: Request, res: Response) => {
  const mint = req.query.mint as string;
  if (!mint) return res.status(400).json({ error: 'mint query param required' });

  try {
    const token = await getTokenWithCreators(mint);
    if (!token) return res.status(404).json({ error: 'Token not in local DB yet' });
    return res.json(token);
  } catch (err: any) {
    logger.error(`/api/bags/token error: ${err.message}`);
    return res.status(500).json({ error: 'DB query failed' });
  }
});
