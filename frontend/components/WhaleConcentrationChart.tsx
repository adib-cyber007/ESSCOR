"use client";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip, PolarRadiusAxis,
} from "recharts";
import type { WhaleToken } from "@/lib/api";

interface Props { data: WhaleToken[] }

const riskColor = (l: string) =>
  l === "critical" ? "#ef4444" : l === "high" ? "#f59e0b" : l === "medium" ? "#3b82f6" : "#10b981";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as WhaleToken;
  return (
    <div className="glass-card p-3 text-xs">
      <div className="font-bold mb-1">{d.symbol ?? d.mint.slice(0, 8) + "…"}</div>
      <div style={{ color: "var(--text-muted)" }}>
        Top-10 hold: <span style={{ color: riskColor(d.risk_level) }}>{d.whale_concentration.toFixed(1)}%</span>
      </div>
    </div>
  );
};

function ConcentrationBar({ token }: { token: WhaleToken }) {
  const pct = Math.min(token.whale_concentration, 100);
  const color = riskColor(token.risk_level);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[11px] w-12 text-right shrink-0" style={{ color: "var(--text-muted)" }}>
        {token.symbol ?? token.mint.slice(0, 6)}
      </span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>
      <span className="text-[11px] w-10 shrink-0 font-semibold" style={{ color }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function WhaleConcentrationChart({ data }: Props) {
  const top = data.slice(0, 10);
  const radarData = top.map((t) => ({
    ...t,
    subject: t.symbol ?? t.mint.slice(0, 6),
    value: t.whale_concentration,
  }));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          Whale Concentration
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--text-dim)" }}>
          No data yet — sync running…
        </div>
      ) : (
        <div className="space-y-4">
          {/* Radar chart for visual impact */}
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-dim)", fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Whale %"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.2}
                strokeWidth={1.5}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          {/* Horizontal bar breakdown */}
          <div className="space-y-0.5 mt-2">
            {top.map((t) => <ConcentrationBar key={t.mint} token={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}
