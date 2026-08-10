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
    """Say plainly, at boot, when emailed links will only work on this machine.

    This is the single most common way the app appears broken to someone else:
    the email arrives, the button is there, and it opens to nothing because
    "localhost" on their phone means their phone.
    """
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

# Must wrap the routes so every handler can see which host the caller used when
# it builds a link for an email. Added before include_router only for reading
# order; ASGI middleware order is set by add_middleware regardless.
app.add_middleware(BaseURLMiddleware)

app.include_router(master_router)

# The server-rendered pages (tracking, review, password reset) are opened
# straight from an email, on devices that may never load the React app — so the
# pixel typeface has to come from this server, not from the Vite dev server on
# :5173 and not from fonts.googleapis.com. STATIC_DIR/fonts holds the same two
# woff2 files the frontend ships.
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.middleware("http")
async def custom_middleware(request: Request, call_next):
    start = perf_counter()
    response: Response = await call_next(request)
    end = perf_counter()
    time_taken = round(end - start, 2)
    log = f"{request.method} {request.url} ({response.status_code}) {time_taken}s"
    # Handing the log line to Celery talks to the Redis broker over the network.
    # That call is not optional plumbing the request can rely on: when Redis is
    # down (or just slow to refuse the connection) .delay() raises, and because
    # this runs on the way OUT it used to turn every single response — including
    # plain GET / — into a failure. Access logging is best-effort; losing a line
    # must never cost the caller their response.
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