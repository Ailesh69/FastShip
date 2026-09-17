from contextlib import asynccontextmanager
from time import perf_counter
from fastapi import FastAPI, Request, Response
from scalar_fastapi import get_scalar_api_reference
from Database.session import create_db_tables
from api.router import master_router
from core.exception import add_exception_handlers
from config import app_settings, is_loopback
from rich import print
from rich.panel import Panel
from tag import APITag
from worker.tasks import add_log
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.request_context import BaseURLMiddleware
from utils import STATIC_DIR


def _warn_if_links_are_local() -> None:
    """Warn at boot if emailed links will only resolve on this machine."""
    if not is_loopback(app_settings.base_url):
        print(
            Panel(
                f"Email links will point at {app_settings.base_url}",
                title="Links",
                border_style="green",
            )
        )
        return
    print(
        Panel(
            "APP_BASE_URL is a loopback address, so links are built from the "
            "host each request arrives on.\n\n"
            "  · Same machine .......... works\n"
            "  · Same Wi-Fi ............ works if you open the app on this "
            "machine's LAN IP\n"
            "    (run: uvicorn main:app --host 0.0.0.0 --port 8000)\n"
            "  · Any other network ..... WILL NOT WORK\n\n"
            "For a device on another network, expose this server and set "
            "APP_BASE_URL to that public address:\n"
            "  cloudflared tunnel --url http://localhost:8000\n"
            "  ngrok http 8000",
            title="Links may be unreachable",
            border_style="yellow",
        )
    )


@asynccontextmanager
async def lifespan_handler(app: FastAPI):
    await create_db_tables()
    _warn_if_links_are_local()
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
    description="Shipment tracking and delivery management API.",
    version="6.7",
    # No contact block: a fake placeholder email fails OpenAPI validation and 500s /docs.
    openapi_tags=tags_metadata,
)

add_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    # Configurable since the frontend may be loaded via LAN IP or tunnel, not just localhost.
    allow_origins=app_settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Needed before routes build email links from the request host.
app.add_middleware(BaseURLMiddleware)

app.include_router(master_router)

# Serves fonts for email-opened pages (tracking/review/reset) that never load the React app.
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.middleware("http")
async def custom_middleware(request: Request, call_next):
    start = perf_counter()
    response: Response = await call_next(request)
    end = perf_counter()
    time_taken = round(end - start, 2)
    log = f"{request.method} {request.url} ({response.status_code}) {time_taken}s"
    # Best-effort: don't let a down Redis broker fail the response.
    try:
        add_log.delay(log)
    except Exception as exc:  # noqa: BLE001 - broker errors must not reach the client
        print(f"[log] could not queue access log: {type(exc).__name__}: {exc}")
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