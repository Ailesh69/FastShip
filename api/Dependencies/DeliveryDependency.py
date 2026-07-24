from uuid import UUID
from typing import Annotated

from fastapi import Depends
from core.exception import InvalidToken, EntityNotFound
from sqlalchemy.ext.asyncio import AsyncSession

from core.secuirty import OAuth2_scheme_DP
from Database.session import get_session
from Database.redis import is_jti_blacklisted
from schemas.DeliveryPartner import DeliveryPartner
from services.DeliveryPartner import DeliveryPartnerService
from utils import decode_access_token

SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def _get_partner_access_token(
    token: Annotated[str, Depends(OAuth2_scheme_DP)],
) -> dict:
    data = decode_access_token(token)
    if data is None or await is_jti_blacklisted(data["jti"]):
        raise InvalidToken("Invalid Token")
    return data


async def logged_in_partner(
    token_data: Annotated[dict, Depends(_get_partner_access_token)],
    session: SessionDep,
) -> DeliveryPartner:
    partner = await session.get(DeliveryPartner, UUID(token_data["user"]["id"]))
    if partner is None:
        raise EntityNotFound("Delivery partner not found")
    return partner


CurrPartnerDep = Annotated[DeliveryPartner, Depends(logged_in_partner)]


def get_delivery_partner_service(session: SessionDep,):
    return DeliveryPartnerService(DeliveryPartner, session)


DeliveryPartnerServiceDep = Annotated[
    DeliveryPartnerService, Depends(get_delivery_partner_service)
]
