from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from core.exception import Conflict, EntityNotFound
from schemas.Client import Client, ClientCreate
from services.User import UserService


class ClientService(UserService):
    def __init__(self, session: AsyncSession):
        super().__init__(Client, session)

    async def register(self, data: ClientCreate, router_prefix: str) -> Client:
        try:
            return await self._add_user(data.model_dump(), router_prefix)
        except IntegrityError:
            await self.session.rollback()
            raise Conflict("Email is already registered")

    async def login(self, email: str, password: str) -> str:
        return await self._generate_token(email, password)

    async def get_profile(self, client_id: UUID) -> Client:
        client = await self._get(client_id)
        if client is None:
            raise EntityNotFound("Client not found")
        return client
