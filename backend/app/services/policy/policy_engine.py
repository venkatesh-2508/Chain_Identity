from typing import Dict, Any, List, Optional, Tuple

class PolicyEngine:
    """
    Core authorization engine enforcing RBAC + asset classification + allocation status.
    AI NEVER makes authorization decisions; this deterministic policy engine / smart contract layer does.
    """
    @staticmethod
    def evaluate_access(
        user_status: str,
        user_role: str,
        user_did: str,
        asset_id: str,
        requested_action: str,
        allocation: Optional[Dict[str, Any]] = None,
        emergency_grant: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, str]:
        # 1. User active check
        if user_status != "ACTIVE":
            return False, "User account is suspended or inactive"

        # 2. Administrator role override
        if user_role == "ADMINISTRATOR":
            return True, "Administrator global oversight authorization"

        # 3. Emergency break-glass check
        if emergency_grant and emergency_grant.get("status") == "ACTIVE":
            return True, f"Emergency Break-Glass active (Reason: {emergency_grant.get('reason')})"

        # 4. Allocation verification
        if not allocation:
            return False, "No asset allocation or authorization grant found for this DID"

        if allocation.get("status") == "REVOKED":
            reason = allocation.get("revocationReason") or "Permission revoked by Security Manager"
            return False, f"Permission revoked. Reason: {reason}"

        if allocation.get("status") == "EXPIRED":
            return False, "Asset allocation grant has expired"

        permissions = allocation.get("permissions", [])
        if requested_action.upper() not in [p.upper() for p in permissions]:
            return False, f"Action '{requested_action}' not in granted permissions {permissions}"

        return True, "Authorization granted under Smart Contract policy"
