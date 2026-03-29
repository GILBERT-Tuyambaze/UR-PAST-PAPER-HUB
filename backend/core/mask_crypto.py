import base64
import hashlib
import os

from cryptography.fernet import Fernet

secret_key = "UrHud@FunctionSea"
key_prefix = "urhudkey-"


def _derive_fernet_key(key_material: str) -> bytes:
    digest = hashlib.sha256(key_material.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def _get_fernet(key_str: str) -> Fernet:
    return Fernet(_derive_fernet_key(key_str))


def encrypt_text(plain: str) -> str:
    pwd = os.environ.get("MASK_KEY", secret_key)
    encrypted = _get_fernet(pwd).encrypt(plain.encode("utf-8")).decode("utf-8")
    return f"{key_prefix}{encrypted}"


def decrypt_text(token: str) -> str:
    pwd = os.environ.get("MASK_KEY", secret_key)
    raw_token = token.removeprefix(key_prefix)
    return _get_fernet(pwd).decrypt(raw_token.encode("utf-8")).decode("utf-8")
