import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from typing import Tuple, Dict, Any

class EncryptedStorageService:
    """
    Off-chain Encrypted Storage Service:
    - Encrypts sensitive raw files/data using AES-256-GCM
    - Generates SHA-256 hash of original plaintext
    - Verifies SHA-256 against on-chain anchor on read
    - Blocks and flags tampering if hashes mismatch
    """
    def __init__(self, secret_key: str):
        # 256-bit key from secret
        self.key = hashlib.sha256(secret_key.encode("utf-8")).digest()
        self.aesgcm = AESGCM(self.key)

    def encrypt_data(self, plaintext: bytes) -> Tuple[bytes, bytes, str]:
        """Returns (ciphertext_with_tag, nonce, sha256_hash)"""
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, plaintext, None)
        sha256_hash = hashlib.sha256(plaintext).hexdigest()
        return ciphertext, nonce, sha256_hash

    def decrypt_data(self, ciphertext: bytes, nonce: bytes, expected_sha256: str) -> Tuple[bool, bytes, str]:
        """
        Decrypts data and cryptographically asserts plaintext SHA-256 against expected on-chain hash.
        """
        try:
            plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)
            computed_hash = hashlib.sha256(plaintext).hexdigest()
            if computed_hash != expected_sha256:
                return False, b"", f"Integrity Failure: computed {computed_hash} != expected {expected_sha256}"
            return True, plaintext, computed_hash
        except Exception as e:
            return False, b"", f"Decryption exception: {str(e)}"
