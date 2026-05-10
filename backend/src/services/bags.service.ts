import axios from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../utils/logger';

const bagsClient = axios.create({
  baseURL: process.env.BAGS_BASE_URL || 'https://public-api-v2.bags.fm/api/v1',
  headers: {
    'x-api-key': process.env.BAGS_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// Retry with exponential backoff: handles 429 + 5xx
axiosRetry(bagsClient, {
  retries: 4,
  retryDelay: (retryCount, error) => {
    const retryAfter = error.response?.headers['retry-after'];
    if (retryAfter) return Number(retryAfter) * 1000;
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error) => {
    const status = error.response?.status;
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      status === 429 ||
      (status !== undefined && status >= 500)
    );
  },
  onRetry: (retryCount, error) => {
    logger.warn(`Bags.fm API retry #${retryCount} — ${error.message}`);
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BagsCreator {
  wallet: string;
  role: string;
  royalty_percentage: number;
  provider?: string;
  display_name?: string;
  avatar_uri?: string;
  twitter_handle?: string;
}

export interface BagsTokenMetadata {
  mint: string;
  name?: string;
  symbol?: string;
  total_supply?: string;
  royalty_percentage?: number;
  logo_uri?: string;
  description?: string;
  launch_date?: string;
  creators?: BagsCreator[];
}

export interface BagsLifetimeFees {
  mint: string;
  fee_lifetime_amount?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch creator + token metadata for a given mint.
 * Endpoint: GET /token-launch/creator/v3?mint=<mint>
 */
export async function getTokenCreators(mint: string): Promise<BagsTokenMetadata | null> {
  try {
    const { data } = await bagsClient.get('/token-launch/creator/v3', {
      params: { mint },
    });
    logger.debug(`Bags getTokenCreators OK: ${mint}`);
    return data;
  } catch (err: any) {
    logger.error(`Bags getTokenCreators failed for ${mint}: ${err.message}`);
    return null;
  }
}

/**
 * Fetch lifetime fee analytics for a given mint.
 * Endpoint: GET /token-launch/lifetime-fees?mint=<mint>
 */
export async function getTokenLifetimeFees(mint: string): Promise<BagsLifetimeFees | null> {
  try {
    const { data } = await bagsClient.get('/token-launch/lifetime-fees', {
      params: { mint },
    });
    logger.debug(`Bags getTokenLifetimeFees OK: ${mint}`);
    return data;
  } catch (err: any) {
    logger.error(`Bags getTokenLifetimeFees failed for ${mint}: ${err.message}`);
    return null;
  }
}

/**
 * Dynamically discover token mints managed on Bags.fm.
 * Endpoint: GET /token-launch/creator/v3 (no mint param → returns list)
 */
export async function discoverTokenMints(limit = 100): Promise<string[]> {
  try {
    const { data } = await bagsClient.get('/token-launch/creator/v3', {
      params: { limit },
    });
    // Handle both array and paginated response shapes
    const items: any[] = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
    const mints = items.map((t: any) => t.mint).filter(Boolean);
    logger.info(`Bags discovered ${mints.length} token mints`);
    return mints;
  } catch (err: any) {
    logger.error(`Bags discoverTokenMints failed: ${err.message}`);
    return [];
  }
}
