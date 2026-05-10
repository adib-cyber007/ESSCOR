import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background scan overlay */}
      <div className="scan-overlay fixed inset-0 z-0" />

      {/* Glow orbs */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-spin-slow"
        style={{ background: "radial-gradient(circle, #00d4ff, transparent 70%)" }} />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] animate-spin-slow"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }} />

      <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-in">
        {/* Logo badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 tracking-widest uppercase"
          style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)", color: "#00d4ff" }}>
          <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
          Bags.fm × Solana Intelligence
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6">
          <span className="gradient-text">ESSCOR</span>
        </h1>

        <p className="text-xl md:text-2xl font-light mb-4" style={{ color: "var(--text-muted)" }}>
          Ecosystem Intelligence Platform
        </p>
        <p className="text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Real-time liquidity stress, whale-concentration risk, and reward-efficiency analytics
          for the Bags.fm creator economy — powered by Helius on-chain data.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #3b82f6)",
              color: "#000",
              boxShadow: "0 0 30px rgba(0,212,255,0.35)",
            }}>
            Launch Dashboard
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <a href="https://bags.fm" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--text-muted)",
              background: "rgba(255,255,255,0.04)",
            }}>
            Bags.fm Platform ↗
          </a>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
          {[
            { icon: "💧", label: "Liquidity Stress", desc: "Real-time inflow/outflow monitoring" },
            { icon: "🐋", label: "Whale Risk", desc: "Top-wallet concentration alerts" },
            { icon: "💰", label: "Reward Efficiency", desc: "Fee-to-royalty sustainability scores" },
            { icon: "🛡️", label: "Ecosystem Health", desc: "Aggregated risk intelligence" },
          ].map((f) => (
            <div key={f.label} className="glass-card p-5 text-left">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{f.label}</div>
              <div className="text-xs" style={{ color: "var(--text-dim)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
