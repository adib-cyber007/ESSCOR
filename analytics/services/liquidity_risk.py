"""
Liquidity stress analysis module.

Liquidity stress is computed by examining:
 - fee_lifetime_amount vs holder count (reward-per-holder proxy)
 - Recent trade velocity (from risk_scores table trends)
 - Absence of data is treated as maximum stress
"""
import pandas as pd
from database import fetch_all


def compute_liquidity_stress(mint: str) -> dict:
    """
    Returns a liquidity stress report for a given token mint.
    """
    rows = fetch_all(
        """
        SELECT
            et.mint,
            et.name,
            et.symbol,
            et.fee_lifetime_amount,
            et.royalty_percentage,
            COUNT(tc.id) AS creator_count
        FROM ecosystem_tokens et
        LEFT JOIN token_creators tc ON tc.token_mint = et.mint
        WHERE et.mint = :mint
        GROUP BY et.mint, et.name, et.symbol, et.fee_lifetime_amount, et.royalty_percentage
        """,
        {"mint": mint},
    )

    if not rows:
        return {"mint": mint, "stress_score": 100, "level": "critical", "reason": "no_data"}

    row = rows[0]
    fee = float(row["fee_lifetime_amount"] or 0)
    creator_count = int(row["creator_count"] or 0)

    # Fee-per-creator as proxy for reward distribution health
    fee_per_creator = fee / creator_count if creator_count > 0 else 0

    # Stress scoring thresholds
    if fee_per_creator > 10_000:
        stress = 5.0
        level = "low"
    elif fee_per_creator > 1_000:
        stress = 20.0
        level = "low"
    elif fee_per_creator > 100:
        stress = 45.0
        level = "medium"
    elif fee_per_creator > 10:
        stress = 65.0
        level = "high"
    else:
        stress = 90.0
        level = "critical"

    return {
        "mint": mint,
        "name": row["name"],
        "symbol": row["symbol"],
        "fee_lifetime_amount": fee,
        "creator_count": creator_count,
        "fee_per_creator": round(fee_per_creator, 4),
        "stress_score": stress,
        "level": level,
    }


def get_ecosystem_liquidity_heatmap() -> list[dict]:
    """
    Returns liquidity stress data for all tokens — used for the dashboard heatmap.
    """
    rows = fetch_all(
        """
        SELECT
            et.mint,
            et.name,
            et.symbol,
            et.fee_lifetime_amount,
            COALESCE(rs.liquidity_stress, 100) AS liquidity_stress,
            COALESCE(rs.overall_score, 100) AS overall_score,
            COALESCE(rs.risk_level, 'unknown') AS risk_level,
            rs.computed_at
        FROM ecosystem_tokens et
        LEFT JOIN LATERAL (
            SELECT liquidity_stress, overall_score, risk_level, computed_at
            FROM risk_scores
            WHERE token_mint = et.mint
            ORDER BY computed_at DESC
            LIMIT 1
        ) rs ON true
        ORDER BY COALESCE(rs.liquidity_stress, 100) DESC
        """
    )
    return rows
