import { PrismaClient } from '@prisma/client';
import { BagsTokenMetadata, BagsCreator, BagsLifetimeFees } from '../services/bags.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
export { prisma };

// ─── Token upsert ─────────────────────────────────────────────────────────────

export async function upsertTokenFromBags(
  meta: BagsTokenMetadata,
  fees: BagsLifetimeFees | null
): Promise<void> {
  await prisma.ecosystemToken.upsert({
    where: { mint: meta.mint },
    create: {
      mint: meta.mint,
      name: meta.name ?? null,
      symbol: meta.symbol ?? null,
      totalSupply: meta.total_supply ?? null,
      royaltyPercentage: meta.royalty_percentage ?? null,
      feeLifetimeAmount: fees?.fee_lifetime_amount ?? null,
      launchDate: meta.launch_date ? new Date(meta.launch_date) : null,
      logoUri: meta.logo_uri ?? null,
      description: meta.description ?? null,
    },
    update: {
      name: meta.name ?? undefined,
      symbol: meta.symbol ?? undefined,
      totalSupply: meta.total_supply ?? undefined,
      royaltyPercentage: meta.royalty_percentage ?? undefined,
      feeLifetimeAmount: fees?.fee_lifetime_amount ?? undefined,
      launchDate: meta.launch_date ? new Date(meta.launch_date) : undefined,
      logoUri: meta.logo_uri ?? undefined,
      description: meta.description ?? undefined,
    },
  });
  logger.debug(`Upserted token ${meta.mint}`);
}

// ─── Creator upsert ───────────────────────────────────────────────────────────

export async function upsertTokenCreators(
  mint: string,
  creators: BagsCreator[]
): Promise<void> {
  for (const c of creators) {
    await prisma.tokenCreator.upsert({
      where: { tokenMint_wallet: { tokenMint: mint, wallet: c.wallet } },
      create: {
        tokenMint: mint,
        wallet: c.wallet,
        role: c.role ?? null,
        royaltyPercentage: c.royalty_percentage ?? null,
        provider: c.provider ?? null,
        displayName: c.display_name ?? null,
        avatarUri: c.avatar_uri ?? null,
        twitterHandle: c.twitter_handle ?? null,
      },
      update: {
        role: c.role ?? undefined,
        royaltyPercentage: c.royalty_percentage ?? undefined,
        provider: c.provider ?? undefined,
        displayName: c.display_name ?? undefined,
        avatarUri: c.avatar_uri ?? undefined,
        twitterHandle: c.twitter_handle ?? undefined,
      },
    });
  }
  logger.debug(`Upserted ${creators.length} creators for ${mint}`);
}

// ─── Risk score upsert ────────────────────────────────────────────────────────

export interface RiskPayload {
  tokenMint: string;
  liquidityStress: number;
  whaleConcentration: number;
  rewardEfficiency: number;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export async function upsertRiskScore(payload: RiskPayload): Promise<void> {
  await prisma.riskScore.create({ data: payload });
  logger.debug(`Saved risk score for ${payload.tokenMint} — ${payload.riskLevel}`);
}

// ─── Sync log ─────────────────────────────────────────────────────────────────

export async function writeSyncLog(
  source: string,
  status: 'success' | 'error',
  mint?: string,
  message?: string,
  durationMs?: number
): Promise<void> {
  await prisma.syncLog.create({
    data: { source, status, mint: mint ?? null, message: message ?? null, durationMs: durationMs ?? null },
  });
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function getAllTokenMints(): Promise<string[]> {
  const tokens = await prisma.ecosystemToken.findMany({ select: { mint: true } });
  return tokens.map((t) => t.mint);
}

export async function getTokenWithCreators(mint: string) {
  return prisma.ecosystemToken.findUnique({
    where: { mint },
    include: { creators: true, riskScores: { orderBy: { computedAt: 'desc' }, take: 1 } },
  });
}

export async function getLatestRiskScores(limit = 50) {
  return prisma.riskScore.findMany({
    orderBy: { computedAt: 'desc' },
    take: limit,
    include: { token: { select: { name: true, symbol: true, logoUri: true } } },
  });
}
