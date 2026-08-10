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

# A delivery code is only useful between "out for delivery" and the handover.
# Without a TTL the codes sat in Redis forever, so one texted weeks ago still
# opened the shipment it belonged to.
OTP_TTL_SECONDS = 24 * 60 * 60


async def add_otp(id: UUID, code: int):
    await _otp.set(str(id), code, ex=OTP_TTL_SECONDS)


async def verify_otp(id: UUID) -> str | None:
    """The stored code, or None when none was issued (or it has expired).

    This used to be `str(await _otp.get(...))`, which turned a missing code into
    the literal string "None" — a value a caller could simply send back to pass
    the check on a shipment that never had a code issued at all.
    """
    return await _otp.get(str(id))


async def clear_otp(id: UUID):
    """Burn the code once it has been accepted, so it cannot be replayed."""
    await _otp.delete(str(id))