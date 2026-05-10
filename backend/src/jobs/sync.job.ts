import { logger } from '../utils/logger';
import {
  discoverTokenMints,
  getTokenCreators,
  getTokenLifetimeFees,
} from '../services/bags.service';
import { getTokenHolders } from '../services/helius.service';
import {
  upsertTokenFromBags,
  upsertTokenCreators,
  upsertRiskScore,
  writeSyncLog,
  RiskPayload,
} from '../db/repository';

// ─── Risk computation ─────────────────────────────────────────────────────────

function computeWhaleConcentration(
  holders: { wallet: string; uiAmount: number }[]
): number {
  if (!holders.length) return 0;
  const total = holders.reduce((s, h) => s + h.uiAmount, 0);
  if (total === 0) return 0;
  const top10 = holders
    .slice()
    .sort((a, b) => b.uiAmount - a.uiAmount)
    .slice(0, 10)
    .reduce((s, h) => s + h.uiAmount, 0);
  return parseFloat(((top10 / total) * 100).toFixed(2));
}

function computeLiquidityStress(feeLifetime: number, holderCount: number): number {
  // Heuristic: low fees + low holder diversity = high stress
  if (holderCount === 0) return 100;
  const feePerHolder = feeLifetime / holderCount;
  // Normalize to 0-100 (higher = more stress)
  if (feePerHolder > 1000) return 5;
  if (feePerHolder > 100) return 25;
  if (feePerHolder > 10) return 50;
  if (feePerHolder > 1) return 75;
  return 95;
}

function computeRewardEfficiency(
  feeLifetime: number,
  royaltyPct: number
): number {
  if (royaltyPct <= 0) return 0;
  // reward efficiency = fee_lifetime / royalty_pct — higher = better
  const raw = feeLifetime / royaltyPct;
  return Math.min(parseFloat((raw / 100).toFixed(2)), 100);
}

function deriveRiskLevel(overall: number): 'low' | 'medium' | 'high' | 'critical' {
  if (overall < 25) return 'low';
  if (overall < 50) return 'medium';
  if (overall < 75) return 'high';
  return 'critical';
}

// ─── Sync one token ───────────────────────────────────────────────────────────

async function syncToken(mint: string): Promise<void> {
  const start = Date.now();
  try {
    // 1. Fetch Bags data
    const [meta, fees] = await Promise.all([
      getTokenCreators(mint),
      getTokenLifetimeFees(mint),
    ]);

    if (!meta) {
      await writeSyncLog('bags', 'error', mint, 'No metadata returned', Date.now() - start);
      return;
    }

    // 2. Persist token + creators
    await upsertTokenFromBags(meta, fees);
    if (meta.creators?.length) await upsertTokenCreators(mint, meta.creators);

    // 3. Fetch Helius on-chain holder data
    const holders = await getTokenHolders(mint, 200);

    // 4. Compute risk metrics
    const feeAmt = fees?.fee_lifetime_amount ?? 0;
    const royaltyPct = meta.royalty_percentage ?? 0;
    const whaleConcentration = computeWhaleConcentration(holders);
    const liquidityStress = computeLiquidityStress(feeAmt, holders.length);
    const rewardEfficiency = computeRewardEfficiency(feeAmt, royaltyPct);
    const overallScore = parseFloat(
      (
        (liquidityStress * 0.4 + whaleConcentration * 0.4 + (100 - rewardEfficiency) * 0.2) /
        100
      ).toFixed(4)
    ) * 100;

    const riskPayload: RiskPayload = {
      tokenMint: mint,
      liquidityStress,
      whaleConcentration,
      rewardEfficiency,
      overallScore: parseFloat(overallScore.toFixed(2)),
      riskLevel: deriveRiskLevel(overallScore),
    };
    await upsertRiskScore(riskPayload);

    const ms = Date.now() - start;
    await writeSyncLog('bags', 'success', mint, `synced in ${ms}ms`, ms);
    logger.info(`✅ Synced ${meta.symbol ?? mint} — risk: ${riskPayload.riskLevel} (${riskPayload.overallScore})`);
  } catch (err: any) {
    logger.error(`syncToken failed for ${mint}: ${err.message}`);
    await writeSyncLog('bags', 'error', mint, err.message, Date.now() - start);
  }
}

// ─── Full sync pipeline ───────────────────────────────────────────────────────

export async function runFullSync(): Promise<void> {
  logger.info('🔄 Starting full Bags.fm sync…');
  const mints = await discoverTokenMints(200);

  if (!mints.length) {
    logger.warn('No mints discovered — check BAGS_API_KEY or Bags.fm endpoint shape');
    return;
  }

  // Process in batches of 5 to avoid hammering APIs
  const BATCH = 5;
  for (let i = 0; i < mints.length; i += BATCH) {
    const batch = mints.slice(i, i + BATCH);
    await Promise.allSettled(batch.map(syncToken));
    if (i + BATCH < mints.length) {
      // Small pause between batches
      await new Promise((r) => setTimeout(r, 1_000));
    }
  }

  logger.info(`✅ Full sync complete — ${mints.length} tokens processed`);
}
