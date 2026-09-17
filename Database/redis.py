from uuid import UUID

from redis.asyncio import Redis
from config import db_settings

_token_blacklist = Redis(
    host=db_settings.REDIS_HOST,
    port=db_settings.REDIS_PORT,
    db=0,
    protocol=2,
)

_otp = Redis(
    host=db_settings.REDIS_HOST,
    port=db_settings.REDIS_PORT,
    db=1,
    decode_responses=True,
    
)


async def add_jti_to_blacklist(jti: str):
    await _token_blacklist.set(jti, "blacklisted")


async def is_jti_blacklisted(jti: str) -> bool:
    return await _token_blacklist.exists(jti)

# TTL so a stale texted code can't still open the shipment weeks later.
OTP_TTL_SECONDS = 24 * 60 * 60


async def add_otp(id: UUID, code: int):
    await _otp.set(str(id), code, ex=OTP_TTL_SECONDS)


async def verify_otp(id: UUID) -> str | None:
    """Stored code, or None if unissued/expired. Don't wrap in str() — that turns
    a missing code into the literal string "None"."""
    return await _otp.get(str(id))


async def clear_otp(id: UUID):
    """Burn the code once it has been accepted, so it cannot be replayed."""
    await _otp.delete(str(id))