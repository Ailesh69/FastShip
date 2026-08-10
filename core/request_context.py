"""The address the current request actually arrived on.

Every link this server puts in an email — verify, password reset, tracking,
review — has to be openable on the RECIPIENT's device. Building them from a
single hardcoded APP_BASE_URL made that impossible in the common case: a
developer runs the API on their laptop, APP_BASE_URL says "http://localhost:8000",
and the link works on exactly one machine in the world. Opened on a phone,
"localhost" means the phone itself, and nothing answers.

So when APP_BASE_URL is a loopback address (i.e. nobody has pinned a real public
one), links are instead built from the Host the request came in on. Sign up from
your phone at http://192.168.1.42:8000 and the verification link points back at
192.168.1.42 — which that phone can reach.

A request that genuinely arrived on localhost still yields localhost; there is
nothing better to infer, and warn_if_unreachable() flags it at startup.
"""

from contextvars import ContextVar

# Set per-request by BaseURLMiddleware, read by AppSettings.link_base().
_request_base_url: ContextVar[str | None] = ContextVar(
    "request_base_url", default=None
)


def set_request_base_url(url: str | None) -> None:
    _request_base_url.set(url)


def get_request_base_url() -> str | None:
    return _request_base_url.get()


def _first(value: bytes) -> str:
    """A forwarded header may carry a comma-separated chain; the client-facing
    entry is the first one."""
    return value.decode("latin-1").split(",")[0].strip()


class BaseURLMiddleware:
    """Pure ASGI, deliberately.

    Starlette's BaseHTTPMiddleware runs the rest of the app in a separate task,
    and a ContextVar set there is not guaranteed to be visible downstream. A raw
    ASGI middleware runs in the same task as the endpoint, so the value set here
    is the one link_base() reads.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        scheme = scope.get("scheme", "http")
        host = headers.get(b"host", b"").decode("latin-1").strip()

        # Behind a tunnel or reverse proxy (ngrok, cloudflared, nginx) the
        # public scheme and hostname only exist in these headers — the raw
        # connection is still plain http to 127.0.0.1.
        if (proto := headers.get(b"x-forwarded-proto")) is not None:
            scheme = _first(proto)
        if (fwd_host := headers.get(b"x-forwarded-host")) is not None:
            host = _first(fwd_host)

        set_request_base_url(f"{scheme}://{host}" if host else None)
        await self.app(scope, receive, send)
