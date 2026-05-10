const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ANALYTICS = process.env.NEXT_PUBLIC_ANALYTICS_URL || "http://localhost:8000";

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

// ─── Ecosystem health (analytics) ─────────────────────────────────────────────
export interface EcosystemHealth {
  health_score: number;
  total_tokens: number;
  avg_risk_score: number;
  avg_liquidity_stress: number;
  avg_whale_concentration: number;
  avg_reward_efficiency: number;
  total_fees_lifetime: number;
}
export const fetchEcosystemHealth = () =>
  apiFetch<EcosystemHealth>(`${ANALYTICS}/analytics/ecosystem-health`);

// ─── Heatmap ──────────────────────────────────────────────────────────────────
export interface HeatmapItem {
  mint: string;
  name: string | null;
  symbol: string | null;
  fee_lifetime_amount: number | null;
  liquidity_stress: number;
  overall_score: number;
  risk_level: string;
  computed_at: string | null;
}
export const fetchHeatmap = () =>
  apiFetch<{ items: HeatmapItem[] }>(`${ANALYTICS}/analytics/heatmap`);

// ─── Whale data ───────────────────────────────────────────────────────────────
export interface WhaleToken {
  mint: string;
  name: string | null;
  symbol: string | null;
  logo_uri: string | null;
  whale_concentration: number;
  risk_level: string;
}
export const fetchWhales = (limit = 20) =>
  apiFetch<{ items: WhaleToken[] }>(`${ANALYTICS}/analytics/whales?limit=${limit}`);

// ─── Rewards ──────────────────────────────────────────────────────────────────
export interface RewardItem {
  mint: string;
  name: string | null;
  symbol: string | null;
  logo_uri: string | null;
  fee_lifetime_amount: number | null;
  royalty_percentage: number | null;
  reward_efficiency: number;
  risk_level: string;
}
export const fetchRewards = () =>
  apiFetch<{ items: RewardItem[] }>(`${ANALYTICS}/analytics/rewards`);

// ─── Recommendations ──────────────────────────────────────────────────────────
export interface Recommendation {
  action: string;
  reason: string;
  severity: "info" | "medium" | "high" | "critical";
  metric: string;
}
export interface RecommendationResult {
  mint: string;
  name: string | null;
  symbol: string | null;
  risk_level: string;
  overall_score: number;
  recommendation_count: number;
  recommendations: Recommendation[];
}
export const fetchRecommendations = (limit = 50) =>
  apiFetch<{ items: RecommendationResult[] }>(
    `${ANALYTICS}/analytics/recommendations?limit=${limit}`
  );
export const fetchRecommendationsForMint = (mint: string) =>
  apiFetch<RecommendationResult>(
    `${ANALYTICS}/analytics/recommendations?mint=${mint}`
  );

// ─── Bags creators / fees (via backend proxy) ─────────────────────────────────
export const fetchCreators = (mint: string) =>
  apiFetch<unknown>(`${API}/api/bags/creators?mint=${mint}`);

export const fetchFees = (mint: string) =>
  apiFetch<unknown>(`${API}/api/bags/fees?mint=${mint}`);

export const fetchTokenList = () =>
  apiFetch<{ count: number; mints: string[] }>(`${API}/api/ecosystem/tokens`);
