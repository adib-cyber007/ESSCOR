from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from services.liquidity_risk import compute_liquidity_stress, get_ecosystem_liquidity_heatmap
from services.whale_analysis import get_whale_analysis, get_top_whale_tokens
from services.reward_efficiency import compute_reward_efficiency, get_ecosystem_reward_summary
from services.recommendations import get_recommendations, get_all_recommendations
from config import get_settings

settings = get_settings()

app = FastAPI(
    title="ESSCOR Analytics API",
    description="Ecosystem intelligence analytics for the ESSCOR × Bags.fm platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "esscor-analytics"}


# ─── Risk endpoint ────────────────────────────────────────────────────────────
@app.get("/analytics/risk")
def risk(mint: str = Query(..., description="Solana token mint address")):
    liquidity = compute_liquidity_stress(mint)
    whale = get_whale_analysis(mint)
    reward = compute_reward_efficiency(mint)

    if "error" in liquidity or "error" in whale or "error" in reward:
        raise HTTPException(status_code=404, detail=f"Token {mint} not found in DB")

    return {
        "mint": mint,
        "liquidity": liquidity,
        "whale": whale,
        "reward": reward,
        "overall_score": reward.get("overall_score"),
        "risk_level": reward.get("risk_level"),
    }


# ─── Recommendations ──────────────────────────────────────────────────────────
@app.get("/analytics/recommendations")
def recommendations(
    mint: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    if mint:
        result = get_recommendations(mint)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    return {"items": get_all_recommendations(limit)}


# ─── Dashboard data endpoints ─────────────────────────────────────────────────
@app.get("/analytics/heatmap")
def heatmap():
    return {"items": get_ecosystem_liquidity_heatmap()}


@app.get("/analytics/whales")
def whales(limit: int = Query(20, ge=1, le=100)):
    return {"items": get_top_whale_tokens(limit)}


@app.get("/analytics/rewards")
def rewards():
    return {"items": get_ecosystem_reward_summary()}


@app.get("/analytics/ecosystem-health")
def ecosystem_health():
    """Aggregated ecosystem health score for the dashboard hero widget."""
    from database import fetch_all
    rows = fetch_all(
        """
        SELECT
            COUNT(DISTINCT et.mint) AS total_tokens,
            AVG(rs.overall_score)   AS avg_risk_score,
            AVG(rs.liquidity_stress) AS avg_liquidity_stress,
            AVG(rs.whale_concentration) AS avg_whale_concentration,
            AVG(rs.reward_efficiency)   AS avg_reward_efficiency,
            SUM(et.fee_lifetime_amount) AS total_fees_lifetime
        FROM ecosystem_tokens et
        LEFT JOIN LATERAL (
            SELECT overall_score, liquidity_stress, whale_concentration, reward_efficiency
            FROM risk_scores WHERE token_mint = et.mint
            ORDER BY computed_at DESC LIMIT 1
        ) rs ON true
        """
    )
    if not rows:
        return {"health_score": 0, "total_tokens": 0}

    r = rows[0]
    avg_risk = float(r["avg_risk_score"] or 100)
    health_score = round(max(0, 100 - avg_risk), 1)

    return {
        "health_score": health_score,
        "total_tokens": int(r["total_tokens"] or 0),
        "avg_risk_score": round(avg_risk, 1),
        "avg_liquidity_stress": round(float(r["avg_liquidity_stress"] or 0), 1),
        "avg_whale_concentration": round(float(r["avg_whale_concentration"] or 0), 1),
        "avg_reward_efficiency": round(float(r["avg_reward_efficiency"] or 0), 1),
        "total_fees_lifetime": round(float(r["total_fees_lifetime"] or 0), 2),
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.analytics_port, reload=True)
