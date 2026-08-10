from pathlib import Path
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
import jwt
from config import security_settings

_serializer = URLSafeTimedSerializer(security_settings.JWT_SECRET)
TEMPLATE_DIR = Path(__file__).parent / "templates"
STATIC_DIR = Path(__file__).parent / "static"

# Lifetimes for the signed links that leave the server by email.
#
# decode_url_safe_token() takes an `expiry`, but every caller left it at None —
# and None means max_age=None, i.e. itsdangerous never checks the age at all.
# A password-reset link forwarded, logged by a mail provider or left in an inbox
# stayed valid for the lifetime of the signing key. These are the defaults the
# callers now pass.
EMAIL_VERIFY_EXPIRY = timedelta(days=3)
PASSWORD_RESET_EXPIRY = timedelta(hours=1)
REVIEW_LINK_EXPIRY = timedelta(days=30)


def generate_access_token(data: dict) -> str:
    payload = data.copy()
    payload["jti"] = str(uuid4())
    payload["exp"] = datetime.now(tz=timezone.utc) + timedelta(days=7)
    return jwt.encode(
        payload, security_settings.JWT_SECRET, algorithm=security_settings.JWT_ALGORITHM
    )


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            security_settings.JWT_SECRET,
            algorithms=[security_settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        return None


def generate_url_safe_token(data: dict, salt: str | None = None) -> str:
    return _serializer.dumps(data, salt)


def decode_url_safe_token(
    token: str, salt: str | None = None, expiry: timedelta | None = None
) -> dict | None:
    try:
        return _serializer.loads(
            token,
            salt=salt,
            max_age=expiry.total_seconds() if expiry else None,
        )
    except (BadSignature, SignatureExpired):
        return None
