from uuid import UUID
from typing import Annotated

from fastapi import Depends
from core.exception import ClientNotAuthorized, EntityNotFound, InvalidToken
from sqlalchemy.ext.asyncio import AsyncSession

from Database.session import get_session
from Database.redis import is_jti_blacklisted
from core.secuirty import OAuth2_scheme_client
from schemas.Client import Client
from services.client import ClientService
from utils import decode_access_token

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_client_service(session: SessionDep):
    return ClientService(session)


Client_ServiceDep = Annotated[ClientService, Depends(get_client_service)]


async def _get_client_access_token(
    token: Annotated[str, Depends(OAuth2_scheme_client)],
) -> dict:
    data = decode_access_token(token)
    if data is None or await is_jti_blacklisted(data["jti"]):
        raise InvalidToken("Invalid Token")
    return data


async def logged_in_client(
    token_data: Annotated[dict, Depends(_get_client_access_token)],
    session: SessionDep,
) -> Client:
    client = await session.get(Client, UUID(token_data["user"]["id"]))
    if client is None:
        raise EntityNotFound("Client not found")
    if not client.email_verified:
        raise ClientNotAuthorized("Email is not verified")
    return client


CurrClientDep = Annotated[Client, Depends(logged_in_client)]
