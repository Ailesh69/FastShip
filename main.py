from contextlib import asynccontextmanager
from time import perf_counter
from fastapi import FastAPI, Request, Response
from scalar_fastapi import get_scalar_api_reference
from Database.session import create_db_tables
from api.router import master_router
from core.exception import add_exception_handlers
from config import app_settings
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
    # No contact block: OpenAPI validates contact.email as a real address, so
    # the "REPLACE_WITH_REAL_EMAIL" placeholder that was here made /openapi.json
    # — and therefore /docs and /scalar — fail with a 500. Add it back with a
    # genuine address whenever you want it published.
    openapi_tags=tags_metadata,
)

add_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    # Configurable, because the origin the browser used is not always
    # localhost — a phone or a friend's laptop loads the frontend over the LAN
    # IP or a tunnel hostname, and an origin missing from this list gets every
    # request blocked before it reaches a route.
    allow_origins=app_settings.cors_origins,
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