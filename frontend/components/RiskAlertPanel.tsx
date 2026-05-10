"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { RecommendationResult, Recommendation } from "@/lib/api";

interface Props { data: RecommendationResult[] }

const severityConfig = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "🚨", label: "Critical" },
  high:     { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "⚠️", label: "High" },
  medium:   { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "ℹ️", label: "Medium" },
  info:     { color: "#10b981", bg: "rgba(16,185,129,0.10)", icon: "✅", label: "Info" },
} as const;

function RecCard({ rec, token }: { rec: Recommendation; token: RecommendationResult }) {
  const cfg = severityConfig[rec.severity] ?? severityConfig.info;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl p-4 mb-3"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: cfg.color }}>
              {token.symbol ?? token.mint.slice(0, 8) + "…"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
              {cfg.label}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
              {rec.metric}
            </span>
          </div>
          <p className="font-semibold text-xs mb-1" style={{ color: "var(--text-primary)" }}>{rec.action}</p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{rec.reason}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function RiskAlertPanel({ data }: Props) {
  const alerts = data
    .flatMap((token) => token.recommendations.map((rec) => ({ rec, token })))
    .filter((x) => x.rec.severity !== "info")
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, info: 3 };
      return (order[a.rec.severity] ?? 3) - (order[b.rec.severity] ?? 3);
    })
    .slice(0, 15);

  const counts = {
    critical: alerts.filter((a) => a.rec.severity === "critical").length,
    high:     alerts.filter((a) => a.rec.severity === "high").length,
    medium:   alerts.filter((a) => a.rec.severity === "medium").length,
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            Risk Alert Panel
          </span>
        </div>
        <div className="flex gap-2 text-[10px]">
          {counts.critical > 0 && (
            <span className="badge-critical px-2 py-0.5 rounded-full">{counts.critical} Critical</span>
          )}
          {counts.high > 0 && (
            <span className="badge-high px-2 py-0.5 rounded-full">{counts.high} High</span>
          )}
          {counts.medium > 0 && (
            <span className="badge-medium px-2 py-0.5 rounded-full">{counts.medium} Medium</span>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[420px] pr-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-4xl">🟢</div>
            <p className="text-sm font-semibold" style={{ color: "#10b981" }}>All systems nominal</p>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>No active risk alerts</p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map(({ rec, token }, i) => (
              <RecCard key={`${token.mint}-${i}`} rec={rec} token={token} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
