import hashlib
import json
from datetime import datetime
from typing import Dict, Any

class DIDService:
    @staticmethod
    def create_did(suffix: str) -> str:
        clean = "".join(c for c in suffix.lower() if c.isalnum())[:20]
        return f"did:chainidentity:{clean}"

    @staticmethod
    def create_did_document(did: str) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat() + "Z"
        key_hash = hashlib.sha256((did + now).encode("utf-8")).hexdigest()[:44]
        return {
            "id": did,
            "controller": "did:chainidentity:bel-root-authority",
            "verificationMethod": [
                {
                    "id": f"{did}#key-1",
                    "type": "Ed25519VerificationKey2020",
                    "controller": did,
                    "publicKeyMultibase": f"z{key_hash}",
                }
            ],
            "authentication": [f"{did}#key-1"],
            "service": [
                {
                    "id": f"{did}#chainidentity-agent",
                    "type": "ChainIdentityDecentralizedAgent",
                    "serviceEndpoint": "https://chainidentity.bel.in/did-resolver/v1",
                }
            ],
            "created": now,
            "updated": now,
        }

    @staticmethod
    def resolve_did(did: str, store: Dict[str, Any]) -> Dict[str, Any] | None:
        return store.get(did)
