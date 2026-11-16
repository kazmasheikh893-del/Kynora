"""
Cryptographic utility for token encryption and decryption.

Provides authenticated symmetric encryption for storing OAuth refresh tokens
and access tokens in the database.
Uses PBKDF2-HMAC-SHA256 with counter-mode keystream and HMAC authentication tag.
Zero external heavy dependencies required, ensuring consistent security.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
from typing import Optional


def _get_master_key() -> bytes:
    """Retrieves or derives the master encryption secret."""
    key = os.getenv("TOKEN_ENCRYPTION_KEY", "").strip()
    if not key:
        # Fallback to secret from env or default app secret
        key = os.getenv("GOOGLE_CLIENT_SECRET", "kynora_default_token_encryption_secret_key_2026")
    return key.encode("utf-8")


def encrypt_token(plain_token: str, key_override: Optional[bytes] = None) -> str:
    """
    Encrypts a token string.
    Returns a self-contained base64 string: 'kyn_v1.<salt>.<iv>.<ciphertext>.<mac>'
    """
    if not plain_token:
        return ""

    master_key = key_override or _get_master_key()
    salt = secrets.token_bytes(16)
    iv = secrets.token_bytes(16)

    # Derive 64 bytes: 32 bytes for encryption, 32 bytes for MAC
    derived = hashlib.pbkdf2_hmac("sha256", master_key, salt, iterations=10000, dklen=64)
    enc_key = derived[:32]
    mac_key = derived[32:]

    # Encrypt using CTR mode keystream derived via HMAC
    data = plain_token.encode("utf-8")
    blocks = (len(data) + 31) // 32
    keystream = b""
    for counter in range(blocks):
        counter_bytes = counter.to_bytes(4, "big")
        keystream += hmac.new(enc_key, iv + counter_bytes, hashlib.sha256).digest()

    ciphertext = bytes(a ^ b for a, b in zip(data, keystream[: len(data)]))

    # Compute HMAC over version + salt + iv + ciphertext
    payload = b"kyn_v1" + salt + iv + ciphertext
    mac = hmac.new(mac_key, payload, hashlib.sha256).digest()

    # Encode components into a single safe string
    encoded = ".".join(
        base64.urlsafe_b64encode(x).decode("ascii")
        for x in (b"kyn_v1", salt, iv, ciphertext, mac)
    )
    return encoded


def decrypt_token(cipher_token: str, key_override: Optional[bytes] = None) -> str:
    """
    Decrypts an encrypted token string.
    Validates HMAC integrity before decrypting.
    """
    if not cipher_token:
        return ""

    parts = cipher_token.split(".")
    if len(parts) != 5:
        raise ValueError("Invalid encrypted token format")

    try:
        version = base64.urlsafe_b64decode(parts[0])
        salt = base64.urlsafe_b64decode(parts[1])
        iv = base64.urlsafe_b64decode(parts[2])
        ciphertext = base64.urlsafe_b64decode(parts[3])
        mac = base64.urlsafe_b64decode(parts[4])
    except Exception as exc:
        raise ValueError("Corrupted encrypted token data") from exc

    if version != b"kyn_v1":
        raise ValueError(f"Unsupported encryption version: {version}")

    master_key = key_override or _get_master_key()
    derived = hashlib.pbkdf2_hmac("sha256", master_key, salt, iterations=10000, dklen=64)
    enc_key = derived[:32]
    mac_key = derived[32:]

    # Verify MAC in constant time
    payload = b"kyn_v1" + salt + iv + ciphertext
    expected_mac = hmac.new(mac_key, payload, hashlib.sha256).digest()
    if not hmac.compare_digest(mac, expected_mac):
        raise ValueError("Token integrity verification failed: MAC mismatch")

    # Decrypt
    blocks = (len(ciphertext) + 31) // 32
    keystream = b""
    for counter in range(blocks):
        counter_bytes = counter.to_bytes(4, "big")
        keystream += hmac.new(enc_key, iv + counter_bytes, hashlib.sha256).digest()

    data = bytes(a ^ b for a, b in zip(ciphertext, keystream[: len(ciphertext)]))
    return data.decode("utf-8")
