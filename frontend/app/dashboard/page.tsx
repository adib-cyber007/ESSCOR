import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  fetchEcosystemHealth,
  fetchHeatmap,
  fetchWhales,
  fetchRewards,
  fetchRecommendations,
} from "@/lib/api";
import { fetchTokenList } from "@/lib/api";
import EcosystemHealthScore from "@/components/EcosystemHealthScore";
import LiquidityHeatmap from "@/components/LiquidityHeatmap";
import WhaleConcentrationChart from "@/components/WhaleConcentrationChart";
import RiskAlertPanel from "@/components/RiskAlertPanel";
import RewardEfficiencyWidget from "@/components/RewardEfficiencyWidget";
import CreatorListPanel from "@/components/CreatorListPanel";

export const metadata: Metadata = {
  title: "Dashboard — ESSCOR Intelligence",
  description: "Real-time ecosystem health, liquidity stress, whale risk and reward analytics dashboard for Bags.fm tokens.",
};

export const revalidate = 60; // ISR: refresh every 60 seconds

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ h = "h-64" }: { h?: string }) {
  return (
    <div className={`glass-card ${h} animate-pulse`}
      style={{ background: "rgba(13,21,38,0.4)" }} />
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card px-5 py-3 flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  // Parallel fetch — all server-side
  const [health, heatmapData, whaleData, rewardData, recData] = await Promise.allSettled([
    fetchEcosystemHealth(),
    fetchHeatmap(),
    fetchWhales(20),
    fetchRewards(),
    fetchRecommendations(50),
    fetchTokenList(),
  ]);

  const health_   = health.status      === "fulfilled" ? health.value        : null;
  const heatmap   = heatmapData.status === "fulfilled" ? heatmapData.value.items  : [];
  const whales    = whaleData.status   === "fulfilled" ? whaleData.value.items    : [];
  const rewards   = rewardData.status  === "fulfilled" ? rewardData.value.items   : [];
  const recs      = recData.status     === "fulfilled" ? recData.value.items      : [];

  // Build minimal token list for CreatorListPanel from heatmap data
  const tokens = heatmap.slice(0, 20).map((t) => ({
    mint: t.mint,
    name: t.name,
    symbol: t.symbol,
    feeLifetimeAmount: t.fee_lifetime_amount,
    royaltyPercentage: null,
    creators: [],
    riskScores: [{ riskLevel: t.risk_level, overallScore: t.overall_score }],
  }));

  const isLive = health_ !== null;

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="scan-overlay fixed inset-0 z-0 pointer-events-none" />
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle,#00d4ff,transparent 70%)" }} />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-8 blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle,#8b5cf6,transparent 70%)" }} />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-8">
        {/* ── Nav ── */}
        <nav className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl font-black gradient-text">ESSCOR</span>
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>
              INTELLIGENCE
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isLive ? "badge-low" : "badge-high"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              {isLive ? "Live Data" : "Offline — start services"}
            </div>
            <span>Updated every 60s</span>
          </div>
        </nav>

        {/* ── Stat pills ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <StatPill label="Health Score"  value={health_ ? `${Math.round(health_.health_score)}/100` : "—"} color="#00d4ff" />
          <StatPill label="Tracked Tokens" value={health_ ? String(health_.total_tokens) : "—"} color="#8b5cf6" />
          <StatPill label="Avg Risk Score" value={health_ ? `${health_.avg_risk_score.toFixed(1)}` : "—"} color="#f59e0b" />
          <StatPill label="Lifetime Fees"
            value={health_
              ? health_.total_fees_lifetime > 1_000_000
                ? `$${(health_.total_fees_lifetime/1_000_000).toFixed(1)}M`
                : `$${(health_.total_fees_lifetime/1_000).toFixed(1)}K`
              : "—"}
            color="#10b981" />
        </div>

        {/* ── Primary row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fade-in">
          {/* Health gauge */}
          <div className="lg:col-span-1">
            {health_ ? (
              <EcosystemHealthScore
                score={health_.health_score}
                totalTokens={health_.total_tokens}
                avgRisk={health_.avg_risk_score}
                totalFees={health_.total_fees_lifetime}
              />
            ) : <Skeleton h="h-72" />}
          </div>

          {/* Liquidity heatmap */}
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton h="h-72" />}>
              <LiquidityHeatmap data={heatmap} />
            </Suspense>
          </div>
        </div>

        {/* ── Secondary row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 animate-fade-in">
          <WhaleConcentrationChart data={whales} />
          <RewardEfficiencyWidget data={rewards} />
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <RiskAlertPanel data={recs} />
          <CreatorListPanel tokens={tokens} />
        </div>

        {/* ── Footer ── */}
        <footer className="mt-12 text-center text-[11px]" style={{ color: "var(--text-dim)" }}>
          ESSCOR × Bags.fm × Helius — Ecosystem Intelligence Platform
          <span className="mx-2">·</span>
          Data refreshes every 60s via ISR
          <span className="mx-2">·</span>
          <a href="https://bags.fm" target="_blank" rel="noopener" className="hover:text-[#00d4ff] transition-colors">bags.fm</a>
        </footer>
      </div>
    </div>
  );
}
