"""
Whale concentration analysis module.

Uses the latest risk_scores.whale_concentration value (computed by the
Node.js sync job from Helius holder data) and derives actionable insights.
"""
from database import fetch_all


WHALE_THRESHOLD_HIGH = 60.0    # top-10 hold >60% = high risk
WHALE_THRESHOLD_CRITICAL = 80.0


def get_whale_analysis(mint: str) -> dict:
    """
    Returns whale concentration analysis for a single token.
    """
    rows = fetch_all(
        """
        SELECT
            et.mint,
            et.name,
            et.symbol,
            COALESCE(rs.whale_concentration, 0) AS whale_concentration,
            COALESCE(rs.overall_score, 0) AS overall_score,
            COALESCE(rs.risk_level, 'unknown') AS risk_level,
            rs.computed_at
        FROM ecosystem_tokens et
        LEFT JOIN LATERAL (
            SELECT whale_concentration, overall_score, risk_level, computed_at
            FROM risk_scores
            WHERE token_mint = et.mint
            ORDER BY computed_at DESC
            LIMIT 1
        ) rs ON true
        WHERE et.mint = :mint
        """,
        {"mint": mint},
    )

    if not rows:
        return {"mint": mint, "error": "not_found"}

    row = rows[0]
    wc = float(row["whale_concentration"] or 0)

    if wc >= WHALE_THRESHOLD_CRITICAL:
        alert = "critical"
        message = f"Top-10 wallets hold {wc:.1f}% of supply — extreme concentration risk."
    elif wc >= WHALE_THRESHOLD_HIGH:
        alert = "high"
        message = f"Top-10 wallets hold {wc:.1f}% of supply — elevated dump risk."
    elif wc >= 40:
        alert = "medium"
        message = f"Top-10 wallets hold {wc:.1f}% of supply — moderate concentration."
    else:
        alert = "low"
        message = f"Top-10 wallets hold {wc:.1f}% of supply — healthy distribution."

    return {
        "mint": row["mint"],
        "name": row["name"],
        "symbol": row["symbol"],
        "whale_concentration_pct": wc,
        "alert_level": alert,
        "message": message,
        "overall_score": row["overall_score"],
        "risk_level": row["risk_level"],
        "computed_at": str(row["computed_at"]) if row["computed_at"] else None,
    }


def get_top_whale_tokens(limit: int = 20) -> list[dict]:
    """
    Returns the top-N tokens ranked by whale concentration for dashboard charts.
    """
    rows = fetch_all(
        """
        SELECT
            et.mint,
            et.name,
            et.symbol,
            et.logo_uri,
            COALESCE(rs.whale_concentration, 0) AS whale_concentration,
            COALESCE(rs.risk_level, 'unknown') AS risk_level
        FROM ecosystem_tokens et
        LEFT JOIN LATERAL (
            SELECT whale_concentration, risk_level
            FROM risk_scores
            WHERE token_mint = et.mint
            ORDER BY computed_at DESC
            LIMIT 1
        ) rs ON true
        ORDER BY whale_concentration DESC
        LIMIT :limit
        """,
        {"limit": limit},
    )
    return rows
