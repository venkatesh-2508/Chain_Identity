from datetime import datetime
from typing import Dict, Any, List, Optional

class AISecurityAnalytics:
    """
    AI Security Daemon:
    Analyzes access frequency, timing (off-hours), repeated denies, and patterns.
    Produces risk scores and human-in-the-loop investigation alerts.
    NEVER overrides or enforces smart contract authorization.
    """
    @staticmethod
    def analyze_event_stream(
        user_did: str,
        recent_events: List[Dict[str, Any]],
        current_hour: int,
        is_denied: bool = False
    ) -> Dict[str, Any]:
        denied_count = sum(1 for e in recent_events if e.get("eventType") == "ACCESS_DENIED") + (1 if is_denied else 0)
        total_recent = len(recent_events) + 1

        score = 15
        reasons = []

        # Check off-hours (between 11 PM and 5 AM)
        if current_hour >= 23 or current_hour < 5:
            score += 45
            reasons.append(f"Unusual access timing ({current_hour:02d}:00 IST - Outside standard 08:00-18:00 operational window)")

        # Frequency spike
        if total_recent >= 5:
            score += 40
            reasons.append(f"Unusually high request burst ({total_recent} operations within observation window)")
        elif total_recent >= 3:
            score += 15

        # Repeated denials
        if denied_count >= 2:
            score += 35
            reasons.append(f"Repeated denied authorization attempts ({denied_count} failures)")

        score = min(100, max(5, score))

        if score >= 70:
            risk = "HIGH"
        elif score >= 40:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return {
            "anomaly_score": score,
            "risk_level": risk,
            "reason": "; ".join(reasons) or "Normal baseline activity",
            "evaluated_at": datetime.utcnow().isoformat() + "Z",
            "total_events": total_recent,
            "denied_count": denied_count
        }
