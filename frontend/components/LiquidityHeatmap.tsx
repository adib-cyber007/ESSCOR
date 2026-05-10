"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { HeatmapItem } from "@/lib/api";

interface Props { data: HeatmapItem[] }

const riskColor = (level: string) => {
  if (level === "critical") return "#ef4444";
  if (level === "high")     return "#f59e0b";
  if (level === "medium")   return "#3b82f6";
  return "#10b981";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as HeatmapItem;
  return (
    <div className="glass-card p-3 text-xs" style={{ minWidth: 160 }}>
      <div className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        {d.symbol ?? d.mint.slice(0, 8) + "…"}
      </div>
      <div style={{ color: "var(--text-muted)" }}>Stress: <span style={{ color: riskColor(d.risk_level) }}>{d.liquidity_stress.toFixed(1)}</span></div>
      <div style={{ color: "var(--text-muted)" }}>Overall: {d.overall_score.toFixed(1)}</div>
      <div style={{ color: "var(--text-muted)" }}>Risk: <span className={`badge-${d.risk_level} px-1 rounded`}>{d.risk_level}</span></div>
    </div>
  );
};

export default function LiquidityHeatmap({ data }: Props) {
  const slice = data.slice(0, 20);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
              Liquidity Stress Heatmap
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-dim)" }}>
            Top {slice.length} tokens ranked by stress score
          </p>
        </div>
        <div className="flex gap-3 text-[10px]">
          {[["#10b981","Low"],["#3b82f6","Medium"],["#f59e0b","High"],["#ef4444","Critical"]].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <span className="w-2 h-2 rounded-sm" style={{ background: c }} />{l}
            </span>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--text-dim)" }}>
          No data yet — sync running…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={slice} margin={{ top: 4, right: 4, bottom: 30, left: -10 }}>
            <XAxis
              dataKey="symbol"
              tick={{ fill: "var(--text-dim)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fill: "var(--text-dim)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="liquidity_stress" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {slice.map((entry, i) => (
                <Cell key={i} fill={riskColor(entry.risk_level)}
                  style={{ filter: `drop-shadow(0 0 6px ${riskColor(entry.risk_level)}60)` }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
