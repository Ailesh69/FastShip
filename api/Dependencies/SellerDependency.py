from uuid import UUID
from Database.redis import is_jti_blacklisted
from services.seller import SellerService
from typing import Annotated
from fastapi import Depends
from core.exception import InvalidToken, EntityNotFound
from sqlalchemy.ext.asyncio import AsyncSession
from Database.session import get_session
from core.secuirty import OAuth2_scheme_seller
from utils import decode_access_token
from schemas.seller import Seller

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_seller_service(session: SessionDep,):
    return SellerService(session)


Seller_ServiceDep = Annotated[SellerService, Depends(get_seller_service)]


async def _get_access_token(
    token: Annotated[str, Depends(OAuth2_scheme_seller)],
) -> dict:
    data = decode_access_token(token)
    if data is None or await is_jti_blacklisted(data["jti"]):
        raise InvalidToken("Invalid Token")
    return data


async def logged_in_seller(
    token_data: Annotated[dict, Depends(_get_access_token)], session: SessionDep
) -> Seller:
    seller = await session.get(Seller, UUID(token_data["user"]["id"]))
    if seller is None:
        raise EntityNotFound("Seller not found")
    return seller


CurrSellerDep = Annotated[Seller, Depends(logged_in_seller)]
