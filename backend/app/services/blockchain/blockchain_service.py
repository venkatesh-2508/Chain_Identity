import hashlib
import json
import secrets
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

class BlockchainService:
    def __init__(self, provider: str = "local"):
        self.provider = provider # 'local' or 'fabric'

    @staticmethod
    def generate_tx_id() -> str:
        return "0x" + secrets.token_hex(32)

    @staticmethod
    def compute_hash(
        index: int,
        timestamp: str,
        event_id: str,
        event_type: str,
        actor_did: str,
        asset_id: Optional[str],
        transaction_id: str,
        payload: Dict[str, Any],
        previous_hash: str
    ) -> str:
        canonical = json.dumps({
            "index": index,
            "timestamp": timestamp,
            "eventId": event_id,
            "eventType": event_type,
            "actorDid": actor_did,
            "assetId": asset_id or "",
            "transactionId": transaction_id,
            "payload": payload,
            "previousHash": previous_hash,
        }, sort_keys=True)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def verify_chain(self, ledger: List[Dict[str, Any]]) -> Tuple[bool, int, str]:
        for i, block in enumerate(ledger):
            if i == 0:
                if block.get("previousHash") != "0000000000000000000000000000000000000000000000000000000000000000":
                    return False, 0, "Genesis previousHash invalid"
            else:
                prev = ledger[i - 1]
                if block.get("previousHash") != prev.get("currentHash"):
                    return False, i, f"Hash link broken between #{i - 1} and #{i}"

            computed = self.compute_hash(
                index=block["index"],
                timestamp=block["timestamp"],
                event_id=block["eventId"],
                event_type=block["eventType"],
                actor_did=block["actorDid"],
                asset_id=block.get("assetId"),
                transaction_id=block["transactionId"],
                payload=block["payload"],
                previous_hash=block["previousHash"]
            )
            if computed != block.get("currentHash"):
                return False, i, f"Block #{i} data mismatch! Computed {computed[:16]}... vs Stored {block.get('currentHash')[:16]}..."

        return True, -1, "All blocks cryptographically verified"
