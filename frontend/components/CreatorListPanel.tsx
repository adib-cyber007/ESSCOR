"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Creator {
  id: string;
  wallet: string;
  role: string | null;
  royaltyPercentage: number | null;
  displayName: string | null;
  avatarUri: string | null;
  twitterHandle: string | null;
}

interface Token {
  mint: string;
  name: string | null;
  symbol: string | null;
  feeLifetimeAmount: number | null;
  royaltyPercentage: number | null;
  creators: Creator[];
  riskScores: { riskLevel: string; overallScore: number }[];
}

interface Props {
  tokens: Token[];
}

function CreatorRow({ c }: { c: Creator }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {c.avatarUri ? (
        <img src={c.avatarUri} alt={c.displayName ?? "creator"} className="w-8 h-8 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", color: "#000" }}>
          {(c.displayName ?? c.wallet)[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {c.displayName ?? `${c.wallet.slice(0, 8)}…${c.wallet.slice(-4)}`}
        </div>
        <div className="text-[10px] flex items-center gap-2 mt-0.5" style={{ color: "var(--text-dim)" }}>
          <span className="capitalize">{c.role ?? "creator"}</span>
          {c.twitterHandle && <span>@{c.twitterHandle}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-bold" style={{ color: "#00d4ff" }}>
          {c.royaltyPercentage?.toFixed(2) ?? "—"}%
        </div>
        <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>royalty</div>
      </div>
    </div>
  );
}

export default function CreatorListPanel({ tokens }: Props) {
  const [selected, setSelected] = useState<string | null>(tokens[0]?.mint ?? null);
  const token = tokens.find((t) => t.mint === selected);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          Creator Directory
        </span>
      </div>

      {tokens.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: "var(--text-dim)" }}>No tokens synced yet.</p>
      ) : (
        <div className="flex gap-4 h-full">
          {/* Token selector */}
          <div className="w-32 shrink-0 space-y-1 overflow-y-auto max-h-64">
            {tokens.slice(0, 20).map((t) => (
              <button key={t.mint}
                onClick={() => setSelected(t.mint)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 truncate ${
                  selected === t.mint
                    ? "text-[#00d4ff] bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.25)]"
                    : "text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)]"
                }`}>
                {t.symbol ?? t.mint.slice(0, 6)}
              </button>
            ))}
          </div>

          {/* Creator list */}
          <AnimatePresence mode="wait">
            {token && (
              <motion.div key={token.mint} className="flex-1 min-w-0"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-sm">{token.name ?? token.symbol}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                      {token.creators.length} creator{token.creators.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold" style={{ color: "#10b981" }}>
                      ${(token.feeLifetimeAmount ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>lifetime fees</div>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-48">
                  {token.creators.length === 0 ? (
                    <p className="text-xs py-4 text-center" style={{ color: "var(--text-dim)" }}>
                      No creators on record
                    </p>
                  ) : (
                    token.creators.map((c) => <CreatorRow key={c.id} c={c} />)
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
