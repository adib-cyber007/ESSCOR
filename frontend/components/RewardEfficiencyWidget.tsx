"use client";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis, Cell,
} from "recharts";
import type { RewardItem } from "@/lib/api";

interface Props { data: RewardItem[] }

const gradeColor = (score: number) =>
  score >= 75 ? "#10b981" : score >= 50 ? "#00d4ff" : score >= 25 ? "#f59e0b" : "#ef4444";

const grade = (score: number) =>
  score >= 75 ? "A" : score >= 50 ? "B" : score >= 25 ? "C" : "D";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as RewardItem & { x: number; y: number; z: number };
  return (
    <div className="glass-card p-3 text-xs" style={{ minWidth: 170 }}>
      <div className="font-bold mb-2">{d.symbol ?? d.mint?.slice(0, 8) + "…"}</div>
      <div className="space-y-1" style={{ color: "var(--text-muted)" }}>
        <div>Efficiency: <span style={{ color: gradeColor(d.reward_efficiency) }}>{d.reward_efficiency.toFixed(1)} ({grade(d.reward_efficiency)})</span></div>
        <div>Royalty: {d.royalty_percentage?.toFixed(2) ?? "—"}%</div>
        <div>Lifetime fees: ${(d.fee_lifetime_amount ?? 0).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default function RewardEfficiencyWidget({ data }: Props) {
  const top = data.slice(0, 20);
  const scatterData = top.map((d) => ({
    ...d,
    x: d.royalty_percentage ?? 0,
    y: d.reward_efficiency,
    z: Math.max(20, Math.min(d.fee_lifetime_amount ?? 0, 5000) / 50),
  }));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
              Reward Efficiency
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-dim)" }}>
            Royalty % vs efficiency score — bubble size = lifetime fees
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--text-dim)" }}>
          No data yet — sync running…
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <XAxis
                dataKey="x" name="Royalty %"
                tick={{ fill: "var(--text-dim)", fontSize: 9 }}
                tickLine={false} axisLine={false}
                label={{ value: "Royalty %", position: "insideBottom", offset: -2, fill: "var(--text-dim)", fontSize: 9 }}
              />
              <YAxis
                dataKey="y" name="Efficiency"
                tick={{ fill: "var(--text-dim)", fontSize: 9 }}
                tickLine={false} axisLine={false}
                domain={[0, 100]}
              />
              <ZAxis dataKey="z" range={[30, 200]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }} />
              <Scatter data={scatterData} shape="circle">
                {scatterData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={gradeColor(d.reward_efficiency)}
                    fillOpacity={0.75}
                    stroke={gradeColor(d.reward_efficiency)}
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Grade summary row */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {(["A","B","C","D"] as const).map((g, i) => {
              const count = top.filter((d) => grade(d.reward_efficiency) === g).length;
              const colors = ["#10b981","#00d4ff","#f59e0b","#ef4444"];
              return (
                <div key={g} className="text-center py-2 rounded-lg"
                  style={{ background: `${colors[i]}15`, border: `1px solid ${colors[i]}25` }}>
                  <div className="text-lg font-black" style={{ color: colors[i] }}>{g}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>{count} token{count !== 1 ? "s" : ""}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
