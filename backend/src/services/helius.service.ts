import axios from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../utils/logger';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const HELIUS_BASE = `https://api.helius.xyz/v0`;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const heliusClient = axios.create({
  baseURL: HELIUS_BASE,
  timeout: 20_000,
});

axiosRetry(heliusClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    err.response?.status === 429 ||
    (err.response?.status !== undefined && err.response.status >= 500),
  onRetry: (count, err) => { logger.warn(`Helius retry #${count} — ${err.message}`); },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export interface WalletTokenAccount {
  wallet: string;
  balances: TokenBalance[];
}

export interface DexTrade {
  signature: string;
  timestamp: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  wallet: string;
  source: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function rpcCall(method: string, params: any[]): Promise<any> {
  const { data } = await axios.post(HELIUS_RPC, {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  });
  if (data.error) throw new Error(`RPC ${method} error: ${JSON.stringify(data.error)}`);
  return data.result;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Get all token accounts holding a given mint (for whale analysis).
 * Uses Helius getTokenAccounts enhanced API.
 */
export async function getTokenHolders(
  mint: string,
  limit = 100
): Promise<{ wallet: string; uiAmount: number }[]> {
  try {
    const result = await rpcCall('getTokenAccounts', [
      { mint, limit, displayOptions: { showZeroBalance: false } },
    ]);
    const accounts = result?.token_accounts ?? [];
    return accounts.map((a: any) => ({
      wallet: a.owner,
      uiAmount: a.token_data?.uiAmount ?? 0,
    }));
  } catch (err: any) {
    logger.error(`Helius getTokenHolders failed for ${mint}: ${err.message}`);
    return [];
  }
}

/**
 * Get recent DEX swap transactions for a token mint via Helius parsed transactions.
 */
export async function getTokenTransactions(
  mint: string,
  limit = 100
): Promise<DexTrade[]> {
  try {
    const { data } = await heliusClient.get(`/addresses/${mint}/transactions`, {
      params: {
        'api-key': HELIUS_API_KEY,
        limit,
        type: 'SWAP',
      },
    });
    const trades: DexTrade[] = (data ?? []).map((tx: any) => {
      const swap = tx.events?.swap;
      return {
        signature: tx.signature,
        timestamp: tx.timestamp,
        tokenIn: swap?.tokenIn?.mint ?? '',
        tokenOut: swap?.tokenOut?.mint ?? '',
        amountIn: swap?.tokenIn?.rawTokenAmount?.tokenAmount ?? 0,
        amountOut: swap?.tokenOut?.rawTokenAmount?.tokenAmount ?? 0,
        wallet: tx.feePayer,
        source: tx.source ?? 'unknown',
      };
    });
    logger.debug(`Helius getTokenTransactions OK: ${mint} → ${trades.length} trades`);
    return trades;
  } catch (err: any) {
    logger.error(`Helius getTokenTransactions failed for ${mint}: ${err.message}`);
    return [];
  }
}

/**
 * Get token supply info via Solana RPC.
 */
export async function getTokenSupply(mint: string): Promise<number> {
  try {
    const result = await rpcCall('getTokenSupply', [mint]);
    return Number(result?.value?.uiAmount ?? 0);
  } catch (err: any) {
    logger.error(`Helius getTokenSupply failed for ${mint}: ${err.message}`);
    return 0;
  }
}
