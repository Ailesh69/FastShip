from uuid import UUID
from services.mailer import send_templated_email
from sqlmodel import select
from core.exception import BadRequest, EntityNotFound, BadCredentials, ClientNotAuthorized, InvalidToken
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from config import app_settings
from services.Base import BaseService
from schemas.User import User
from utils import (
    EMAIL_VERIFY_EXPIRY,
    PASSWORD_RESET_EXPIRY,
    generate_access_token,
    generate_url_safe_token,
    decode_url_safe_token,
)


# bcrypt used directly, not via passlib (1.7.4, unmaintained, breaks on bcrypt >= 4.1).
# Stored hash format ($2b$) is unchanged, so old password_hash values still verify.


def _prepare(password: str) -> bytes:
    """bcrypt only reads 72 bytes; truncate explicitly to match old passlib behavior."""
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prepare(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    # A malformed or non-bcrypt hash makes checkpw raise; a stored credential
    # we cannot read is a failed login, not a 500.
    try:
        return bcrypt.checkpw(_prepare(password), password_hash.encode("utf-8"))
    except ValueError:
        return False


class UserService(BaseService):
    def __init__(self, model: User, session: AsyncSession):
        self.model = model
        self.session = session

    async def _add_user(self, data: dict, router_prefix: str):
        user = self.model(**data, password_hash=hash_password(data["password"]))
        user = await self._add(user)
        token = generate_url_safe_token({"email": user.email, "id": str(user.id)})
        send_templated_email(
            recipients=[user.email],
            subject="Verify Your Account With Fastship",
            context={
                "username": user.name,
                "verification_url": f"{app_settings.link_base()}/{router_prefix.lstrip('/')}/verify?token={token}",
            },
            template_name="mail_verify.html",
        )
        return user

    async def _verify_email(self, token: str):
        token_data = decode_url_safe_token(token, expiry=EMAIL_VERIFY_EXPIRY)
        if not token_data:
            raise BadRequest("Verification link is invalid or has expired")
        # Deleted account or wrong-role token: treat as bad link, not a 500.
        user = await self._get(UUID(token_data["id"]))
        if user is None:
            raise BadRequest("Verification link is invalid or has expired")
        user.email_verified = True
        await self._update(user)

    async def _get_by_email(self, email) -> User | None:
        return await self.session.scalar(
            select(self.model).where(self.model.email == email)
        )

    async def _generate_token(self, email, password) -> str:
        user = await self._get_by_email(email)

        if user is None or not verify_password(password, user.password_hash):
            raise BadCredentials("PASSWORD OR EMAIL IS INVALID")
        if not user.email_verified:
            raise ClientNotAuthorized("Email is not verified")
        return generate_access_token(
            data={
                "user": {
                    "name": user.name,
                    "id": str(user.id),
                },
            }
        )

    async def password_reset(self, email, router_prefix):
        user = await self._get_by_email(email)
        if user is None:
            raise EntityNotFound("No account found with that email")
        token = generate_url_safe_token({"id": str(user.id)}, salt="password_reset")
        send_templated_email(
            recipients=[user.email],
            subject="Fastship Password Reset",
            context={
                "username": user.name,
                "reset_url": f"{app_settings.link_base()}/{router_prefix.lstrip('/')}/reset_password?token={token}",
            },
            template_name="mail_reset_password.html",
        )

    def validate_password_reset_token(self, token: str) -> dict:
        token_data = decode_url_safe_token(
            token, salt="password_reset", expiry=PASSWORD_RESET_EXPIRY
        )
        if token_data is None:
            raise InvalidToken("Reset link is invalid or has expired")
        return token_data

    async def password_reset_update(
        self, token: str, new_password: str, confirm_password: str
    ):
        if new_password != confirm_password:
            raise BadRequest("Passwords do not match")
        token_data = self.validate_password_reset_token(token)
        user = await self._get(UUID(token_data["id"]))
        if user is None:
            raise InvalidToken("Reset link is invalid or has expired")
        user.password_hash = hash_password(new_password)
        await self._update(user)
