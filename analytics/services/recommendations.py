"""
Recommendation engine — read-only, non-autonomous.

Produces structured action objects per token based on risk scores.
All output is advisory; no automated changes are made.
"""
from database import fetch_all


def _make_recommendation(action: str, reason: str, severity: str, metric: str) -> dict:
    return {"action": action, "reason": reason, "severity": severity, "metric": metric}


def get_recommendations(mint: str) -> dict:
    rows = fetch_all(
        """
        SELECT
            et.mint, et.name, et.symbol,
            COALESCE(rs.liquidity_stress, 100)   AS liquidity_stress,
            COALESCE(rs.whale_concentration, 0)  AS whale_concentration,
            COALESCE(rs.reward_efficiency, 0)    AS reward_efficiency,
            COALESCE(rs.overall_score, 100)      AS overall_score,
            COALESCE(rs.risk_level, 'unknown')   AS risk_level
        FROM ecosystem_tokens et
        LEFT JOIN LATERAL (
            SELECT liquidity_stress, whale_concentration, reward_efficiency,
                   overall_score, risk_level
            FROM risk_scores WHERE token_mint = et.mint
            ORDER BY computed_at DESC LIMIT 1
        ) rs ON true
        WHERE et.mint = :mint
        """,
        {"mint": mint},
    )
    if not rows:
        return {"mint": mint, "error": "not_found", "recommendations": []}

    row = rows[0]
    recs = []

    ls = float(row["liquidity_stress"])
    wc = float(row["whale_concentration"])
    re = float(row["reward_efficiency"])

    # ── Liquidity stress recommendations ─────────────────────────────────────
    if ls >= 80:
        recs.append(_make_recommendation(
            action="Investigate liquidity depth immediately",
            reason=f"Liquidity stress score is critically high ({ls:.1f}/100). Token may face sell-side pressure.",
            severity="critical",
            metric="liquidity_stress",
        ))
    elif ls >= 55:
        recs.append(_make_recommendation(
            action="Monitor liquidity pool activity closely",
            reason=f"Moderate-high liquidity stress ({ls:.1f}/100). Consider incentivising LP participation.",
            severity="high",
            metric="liquidity_stress",
        ))
    elif ls >= 30:
        recs.append(_make_recommendation(
            action="Review reward distribution to LPs",
            reason=f"Liquidity stress is elevated ({ls:.1f}/100). Redistributing fees to LPs could help.",
            severity="medium",
            metric="liquidity_stress",
        ))

    # ── Whale concentration recommendations ───────────────────────────────────
    if wc >= 80:
        recs.append(_make_recommendation(
            action="Flag top wallets for monitoring",
            reason=f"Top-10 wallets control {wc:.1f}% of supply — extreme dump risk.",
            severity="critical",
            metric="whale_concentration",
        ))
    elif wc >= 60:
        recs.append(_make_recommendation(
            action="Monitor wallet X for large transfers",
            reason=f"Whale concentration at {wc:.1f}% — coordinated sell-off possible.",
            severity="high",
            metric="whale_concentration",
        ))
    elif wc >= 40:
        recs.append(_make_recommendation(
            action="Encourage broader token distribution",
            reason=f"Concentration at {wc:.1f}% — community incentives may reduce risk.",
            severity="medium",
            metric="whale_concentration",
        ))

    # ── Reward efficiency recommendations ─────────────────────────────────────
    if re < 10:
        recs.append(_make_recommendation(
            action="Reduce reward emissions or increase royalty utilisation",
            reason=f"Reward efficiency is very low ({re:.1f}/100) — emissions appear unsustainable.",
            severity="high",
            metric="reward_efficiency",
        ))
    elif re < 30:
        recs.append(_make_recommendation(
            action="Review royalty percentage and fee routing",
            reason=f"Reward efficiency could be improved ({re:.1f}/100).",
            severity="medium",
            metric="reward_efficiency",
        ))
    elif re >= 75:
        recs.append(_make_recommendation(
            action="Maintain current reward structure",
            reason=f"Reward efficiency is healthy ({re:.1f}/100) — no action required.",
            severity="info",
            metric="reward_efficiency",
        ))

    if not recs:
        recs.append(_make_recommendation(
            action="No immediate action required",
            reason="All metrics are within healthy thresholds.",
            severity="info",
            metric="overall",
        ))

    return {
        "mint": row["mint"],
        "name": row["name"],
        "symbol": row["symbol"],
        "risk_level": row["risk_level"],
        "overall_score": row["overall_score"],
        "recommendation_count": len(recs),
        "recommendations": recs,
    }


def get_all_recommendations(limit: int = 50) -> list[dict]:
    """Batch recommendations for the risk-alert panel — highest risk first."""
    rows = fetch_all(
        """
        SELECT et.mint
        FROM ecosystem_tokens et
        LEFT JOIN LATERAL (
            SELECT overall_score FROM risk_scores
            WHERE token_mint = et.mint
            ORDER BY computed_at DESC LIMIT 1
        ) rs ON true
        ORDER BY COALESCE(rs.overall_score, 100) DESC
        LIMIT :limit
        """,
        {"limit": limit},
    )
    return [get_recommendations(r["mint"]) for r in rows]
