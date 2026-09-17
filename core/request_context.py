"""The host/scheme the current request actually arrived on.

Used to build email links (verify, reset, tracking) when APP_BASE_URL is loopback,
so they resolve on the recipient's device instead of just localhost.
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
    """Forwarded headers may be comma-separated chains; take the first entry."""
    return value.decode("latin-1").split(",")[0].strip()


class BaseURLMiddleware:
    """Pure ASGI (not BaseHTTPMiddleware) so the ContextVar set here stays visible
    to the endpoint's task."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        scheme = scope.get("scheme", "http")
        host = headers.get(b"host", b"").decode("latin-1").strip()

        # Behind a tunnel/proxy, the real scheme+host only exist in these headers.
        if (proto := headers.get(b"x-forwarded-proto")) is not None:
            scheme = _first(proto)
        if (fwd_host := headers.get(b"x-forwarded-host")) is not None:
            host = _first(fwd_host)

        set_request_base_url(f"{scheme}://{host}" if host else None)
        await self.app(scope, receive, send)
