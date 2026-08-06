from contextlib import asynccontextmanager
from time import perf_counter
from fastapi import FastAPI, Request, Response
from scalar_fastapi import get_scalar_api_reference
from Database.session import create_db_tables
from api.router import master_router
from core.exception import add_exception_handlers
from tag import APITag
from worker.tasks import add_log
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan_handler(app: FastAPI):
    await create_db_tables()
    yield


tags_metadata = [
    {
        "name": APITag.SELLER,
        "description": "Seller registration, login, and account management.",
    },
    {
        "name": APITag.SHIPMENT,
        "description": "Create, track, update, cancel shipments and manage tags and reviews.",
    },
    {
        "name": APITag.PARTNER,
        "description": "Delivery partner registration, login, and shipment delivery operations.",
    },
    {
        "name": APITag.CLIENT,
        "description": "Client registration, login, and account management.",
    },
]

app = FastAPI(
    lifespan=lifespan_handler,
    title="FastShip",
    description="Retro pixel-art shipment tracking and delivery management API.",
    version="6.7",
    contact={
        "email": "REPLACE_WITH_REAL_EMAIL",
    },
    openapi_tags=tags_metadata,
)

add_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(master_router)


@app.middleware("http")
async def custom_middleware(request: Request, call_next):
    start = perf_counter()
    response: Response = await call_next(request)
    end = perf_counter()
    time_taken = round(end - start, 2)
    log = f"{request.method} {request.url} ({response.status_code}) {time_taken}s"
    add_log.delay(log)
    return response


@app.get("/scalar", include_in_schema=False)
def get_scalar_docs():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="Scalar API",
    )

@app.get("/")
def server_check():
    return {"detail":"Server is running"}