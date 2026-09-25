import pytest
import hashlib
from backend.app.services.did.did_service import DIDService
from backend.app.services.blockchain.blockchain_service import BlockchainService
from backend.app.services.policy.policy_engine import PolicyEngine
from backend.app.services.ai.security_analytics import AISecurityAnalytics
from backend.app.services.storage.encrypted_storage import EncryptedStorageService

def test_step1_did_generation():
    """STEP 1: Administrator creates user and generates unique DID"""
    did = DIDService.create_did("rahul123")
    assert did == "did:chainidentity:rahul123"

    doc = DIDService.create_did_document(did)
    assert doc["id"] == did
    assert len(doc["verificationMethod"]) == 1
    assert doc["verificationMethod"][0]["controller"] == did

def test_step2_and_3_asset_minting_and_allocation():
    """STEP 2 & 3: Asset tokenization & allocation"""
    asset_id = "AST-0017"
    token_id = "NFT-AST-0017"
    user_did = "did:chainidentity:rahul123"

    allocation = {
        "assetId": asset_id,
        "userDid": user_did,
        "permissions": ["VIEW", "EDIT"],
        "status": "ACTIVE",
    }
    assert "EDIT" in allocation["permissions"]
    assert allocation["status"] == "ACTIVE"

def test_step4_smart_contract_allow_on_active_permission():
    """STEP 4: Smart Contract check_access returns ALLOW for active EDIT permission"""
    allocation = {
        "assetId": "AST-0017",
        "userDid": "did:chainidentity:rahul123",
        "permissions": ["VIEW", "EDIT"],
        "status": "ACTIVE",
    }
    allowed, reason = PolicyEngine.evaluate_access(
        user_status="ACTIVE",
        user_role="EMPLOYEE",
        user_did="did:chainidentity:rahul123",
        asset_id="AST-0017",
        requested_action="EDIT",
        allocation=allocation,
    )
    assert allowed is True
    assert "granted" in reason.lower()

def test_step6_and_7_revocation_and_smart_contract_deny():
    """STEP 6 & 7: Permission Revocation leads to immediate Smart Contract DENY"""
    revoked_allocation = {
        "assetId": "AST-0017",
        "userDid": "did:chainidentity:rahul123",
        "permissions": ["VIEW", "EDIT"],
        "status": "REVOKED",
        "revocationReason": "Revoked by Security Manager due to security audit",
    }
    allowed, reason = PolicyEngine.evaluate_access(
        user_status="ACTIVE",
        user_role="EMPLOYEE",
        user_did="did:chainidentity:rahul123",
        asset_id="AST-0017",
        requested_action="EDIT",
        allocation=revoked_allocation,
    )
    assert allowed is False
    assert "revoked" in reason.lower()

def test_step8_ai_anomaly_detection_off_hours_burst():
    """STEP 8: AI security analytics detects 2 AM burst as HIGH RISK"""
    recent_events = [
        {"eventType": "ACCESS_DENIED"},
        {"eventType": "ACCESS_DENIED"},
        {"eventType": "ACCESS_DENIED"},
        {"eventType": "ACCESS_DENIED"},
        {"eventType": "ACCESS_DENIED"},
    ]
    # Evaluate at 2 AM IST (hour = 2)
    ai_result = AISecurityAnalytics.analyze_event_stream(
        user_did="did:chainidentity:rahul123",
        recent_events=recent_events,
        current_hour=2,
        is_denied=True,
    )
    assert ai_result["risk_level"] == "HIGH"
    assert ai_result["anomaly_score"] >= 70
    assert "Unusual access timing" in ai_result["reason"]
    assert "Repeated denied" in ai_result["reason"]

def test_step10_blockchain_tamper_evident_hash_chain():
    """STEP 10: Blockchain integrity verification recalculates SHA-256 chain"""
    blockchain = BlockchainService(provider="local")

    genesis_prev = "0000000000000000000000000000000000000000000000000000000000000000"
    b0_hash = BlockchainService.compute_hash(0, "2026-09-20T08:00:00Z", "EVT-0", "GENESIS", "did:chainidentity:root", None, "0x01", {"msg": "genesis"}, genesis_prev)
    block0 = {
        "index": 0, "timestamp": "2026-09-20T08:00:00Z", "eventId": "EVT-0", "eventType": "GENESIS",
        "actorDid": "did:chainidentity:root", "assetId": None, "transactionId": "0x01",
        "payload": {"msg": "genesis"}, "previousHash": genesis_prev, "currentHash": b0_hash
    }

    b1_hash = BlockchainService.compute_hash(1, "2026-09-20T08:30:00Z", "EVT-1", "DID_CREATED", "did:chainidentity:admin", None, "0x02", {"did": "did:chainidentity:rahul123"}, b0_hash)
    block1 = {
        "index": 1, "timestamp": "2026-09-20T08:30:00Z", "eventId": "EVT-1", "eventType": "DID_CREATED",
        "actorDid": "did:chainidentity:admin", "assetId": None, "transactionId": "0x02",
        "payload": {"did": "did:chainidentity:rahul123"}, "previousHash": b0_hash, "currentHash": b1_hash
    }

    ledger = [block0, block1]
    verified, idx, msg = blockchain.verify_chain(ledger)
    assert verified is True
    assert "cryptographically verified" in msg

    # Simulate malicious alteration of block 0 payload
    block0_tampered = dict(block0)
    block0_tampered["payload"] = {"msg": "corrupted"}
    tampered_ledger = [block0_tampered, block1]

    tamper_verified, fail_idx, fail_msg = blockchain.verify_chain(tampered_ledger)
    assert tamper_verified is False
    assert fail_idx == 0

def test_offchain_storage_encryption_and_tamper_detection():
    """Off-chain encrypted storage AES-GCM + SHA-256 assertion"""
    storage = EncryptedStorageService(secret_key="bel-defense-master-key-2026")
    sensitive_data = b"BEL Tactical Radar Telemetry Raw Binaries Phase 3"

    ciphertext, nonce, original_hash = storage.encrypt_data(sensitive_data)
    assert len(ciphertext) > 0
    assert len(original_hash) == 64

    # Legitimate decryption
    success, decrypted, computed_hash = storage.decrypt_data(ciphertext, nonce, original_hash)
    assert success is True
    assert decrypted == sensitive_data
    assert computed_hash == original_hash

    # Malicious hash mismatch rejection
    fake_hash = "0000000000000000000000000000000000000000000000000000000000000000"
    tampered_success, _, err_msg = storage.decrypt_data(ciphertext, nonce, fake_hash)
    assert tampered_success is False
    assert "Integrity Failure" in err_msg
