from sqlalchemy.ext.asyncio import AsyncSession

from schemas.seller import SellerCreate, Seller
from sqlalchemy.exc import IntegrityError
from core.exception import Conflict
from services.User import UserService


class SellerService(UserService):
    def __init__(self, session: AsyncSession):
        super().__init__(Seller, session)

    async def add(self, seller_create: SellerCreate) -> Seller:
        try:
            return await self._add_user(seller_create.model_dump(),"seller")
        except IntegrityError:
            await self.session.rollback()
            raise Conflict("Email is already registered")

    async def login(self, email, password) -> str:
        return await self._generate_token(email, password)
