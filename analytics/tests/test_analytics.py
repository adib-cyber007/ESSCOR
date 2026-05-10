"""Pytest tests for analytics services (no DB required — uses mocked fetch_all)."""
import pytest
from unittest.mock import patch


MOCK_TOKEN = {
    "mint": "TEST123",
    "name": "TestToken",
    "symbol": "TTK",
    "fee_lifetime_amount": 5000,
    "royalty_percentage": 2.5,
    "creator_count": 3,
    "reward_efficiency": 60,
    "liquidity_stress": 30,
    "whale_concentration": 45,
    "overall_score": 40,
    "risk_level": "medium",
    "computed_at": None,
    "logo_uri": None,
}


# ─── Liquidity risk tests ─────────────────────────────────────────────────────
class TestLiquidityStress:
    def test_no_data_returns_critical(self):
        with patch("services.liquidity_risk.fetch_all", return_value=[]):
            from services.liquidity_risk import compute_liquidity_stress
            result = compute_liquidity_stress("MISSING")
        assert result["stress_score"] == 100
        assert result["level"] == "critical"

    def test_high_fee_per_creator_is_low_stress(self):
        row = {**MOCK_TOKEN, "fee_lifetime_amount": 100_000, "creator_count": 5}
        with patch("services.liquidity_risk.fetch_all", return_value=[row]):
            from services.liquidity_risk import compute_liquidity_stress
            result = compute_liquidity_stress("TEST123")
        assert result["level"] == "low"
        assert result["stress_score"] <= 20

    def test_zero_fee_is_critical_stress(self):
        row = {**MOCK_TOKEN, "fee_lifetime_amount": 0, "creator_count": 1}
        with patch("services.liquidity_risk.fetch_all", return_value=[row]):
            from services.liquidity_risk import compute_liquidity_stress
            result = compute_liquidity_stress("TEST123")
        assert result["level"] == "critical"


# ─── Whale analysis tests ─────────────────────────────────────────────────────
class TestWhaleAnalysis:
    def test_missing_token_returns_error(self):
        with patch("services.whale_analysis.fetch_all", return_value=[]):
            from services.whale_analysis import get_whale_analysis
            result = get_whale_analysis("MISSING")
        assert "error" in result

    def test_critical_concentration(self):
        row = {**MOCK_TOKEN, "whale_concentration": 85}
        with patch("services.whale_analysis.fetch_all", return_value=[row]):
            from services.whale_analysis import get_whale_analysis
            result = get_whale_analysis("TEST123")
        assert result["alert_level"] == "critical"

    def test_healthy_concentration(self):
        row = {**MOCK_TOKEN, "whale_concentration": 20}
        with patch("services.whale_analysis.fetch_all", return_value=[row]):
            from services.whale_analysis import get_whale_analysis
            result = get_whale_analysis("TEST123")
        assert result["alert_level"] == "low"


# ─── Reward efficiency tests ──────────────────────────────────────────────────
class TestRewardEfficiency:
    def test_grade_A_for_high_efficiency(self):
        row = {**MOCK_TOKEN, "reward_efficiency": 80}
        with patch("services.reward_efficiency.fetch_all", return_value=[row]):
            from services.reward_efficiency import compute_reward_efficiency
            result = compute_reward_efficiency("TEST123")
        assert result["grade"] == "A"

    def test_grade_D_for_zero_efficiency(self):
        row = {**MOCK_TOKEN, "reward_efficiency": 0, "fee_lifetime_amount": 0}
        with patch("services.reward_efficiency.fetch_all", return_value=[row]):
            from services.reward_efficiency import compute_reward_efficiency
            result = compute_reward_efficiency("TEST123")
        assert result["grade"] == "D"


# ─── Recommendations tests ────────────────────────────────────────────────────
class TestRecommendations:
    def test_critical_risk_generates_recommendations(self):
        row = {
            **MOCK_TOKEN,
            "liquidity_stress": 90,
            "whale_concentration": 85,
            "reward_efficiency": 5,
            "overall_score": 88,
            "risk_level": "critical",
        }
        with patch("services.recommendations.fetch_all", return_value=[row]):
            from services.recommendations import get_recommendations
            result = get_recommendations("TEST123")
        assert result["recommendation_count"] >= 2
        severities = [r["severity"] for r in result["recommendations"]]
        assert "critical" in severities

    def test_healthy_token_suggests_no_action(self):
        row = {
            **MOCK_TOKEN,
            "liquidity_stress": 10,
            "whale_concentration": 15,
            "reward_efficiency": 80,
            "overall_score": 12,
            "risk_level": "low",
        }
        with patch("services.recommendations.fetch_all", return_value=[row]):
            from services.recommendations import get_recommendations
            result = get_recommendations("TEST123")
        assert result["recommendations"][0]["severity"] == "info"
