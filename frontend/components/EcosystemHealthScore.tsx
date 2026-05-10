"use client";
import { motion } from "framer-motion";

interface Props {
  score: number;           // 0–100
  totalTokens: number;
  avgRisk: number;
  totalFees: number;
}

function Arc({ score }: { score: number }) {
  const r = 80;
  const circ = Math.PI * r;               // half-circle circumference
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 75 ? "#10b981" :
    score >= 50 ? "#00d4ff" :
    score >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="200" height="110" viewBox="0 0 200 110" className="mx-auto">
      {/* Track */}
      <path
        d="M 10 100 A 90 90 0 0 1 190 100"
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round"
      />
      {/* Value arc */}
      <motion.path
        d="M 10 100 A 90 90 0 0 1 190 100"
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
      {/* Center score */}
      <text x="100" y="88" textAnchor="middle" fill={color}
        fontSize="32" fontWeight="800" fontFamily="Inter, sans-serif">
        {score}
      </text>
      <text x="100" y="104" textAnchor="middle" fill="rgba(255,255,255,0.4)"
        fontSize="10" fontFamily="Inter, sans-serif">
        HEALTH SCORE
      </text>
    </svg>
  );
}

export default function EcosystemHealthScore({ score, totalTokens, avgRisk, totalFees }: Props) {
  const label = score >= 75 ? "Healthy" : score >= 50 ? "Moderate" : score >= 25 ? "Stressed" : "Critical";

  return (
    <div className="glass-card p-6 flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 self-start mb-2">
        <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          Ecosystem Health
        </span>
      </div>

      <Arc score={Math.round(score)} />

      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
        score >= 75 ? "badge-low" : score >= 50 ? "badge-medium" : score >= 25 ? "badge-high" : "badge-critical"
      }`}>
        {label}
      </span>

      <div className="grid grid-cols-3 gap-3 w-full mt-4 text-center">
        <div>
          <div className="text-lg font-bold gradient-text">{totalTokens}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Tokens</div>
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: "#ef4444" }}>{avgRisk.toFixed(1)}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Avg Risk</div>
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: "#10b981" }}>
            ${totalFees > 1_000_000 ? (totalFees / 1_000_000).toFixed(1) + "M" :
               totalFees > 1_000 ? (totalFees / 1_000).toFixed(1) + "K" :
               totalFees.toFixed(0)}
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Lifetime Fees</div>
        </div>
      </div>
    </div>
  );
}
