import traceback

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_404_NOT_FOUND,
    HTTP_406_NOT_ACCEPTABLE,
    HTTP_409_CONFLICT,
    HTTP_500_INTERNAL_SERVER_ERROR,
)
from rich import print
from rich.panel import Panel


class FastShipErrors(Exception):
    status = HTTP_400_BAD_REQUEST

    def __init__(self, detail: str = ""):
        self.detail = detail
        super().__init__(detail)


class EntityNotFound(FastShipErrors):
    """Entity not found in database"""
    status = HTTP_404_NOT_FOUND


class ClientNotAuthorized(FastShipErrors):
    """Client is not authorized"""
    status = HTTP_401_UNAUTHORIZED


class BadCredentials(FastShipErrors):
    """Invalid email or password"""
    status = HTTP_401_UNAUTHORIZED


class InvalidToken(FastShipErrors):
    """Invalid or expired token"""
    status = HTTP_401_UNAUTHORIZED


class DeliveryPartnerNotAvailable(FastShipErrors):
    """No delivery partner available"""
    status = HTTP_406_NOT_ACCEPTABLE


class BadRequest(FastShipErrors):
    """Bad request"""
    status = HTTP_400_BAD_REQUEST


class Conflict(FastShipErrors):
    """Resource already exists"""
    status = HTTP_409_CONFLICT


def _get_handler(status_code: int, detail: str):
    async def handler(_request: Request, exc: FastShipErrors) -> JSONResponse:
        print(Panel(f"Handled exception: {type(exc).__name__}"))
        return JSONResponse(status_code=status_code, content={"detail": exc.detail or detail})
    return handler


async def _internal_server_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    # The traceback goes to the server log, never to the client. It used to be
    # returned in an "x-error" header, which broke twice over: exception text
    # routinely contains newlines and non-latin-1 characters, and a header value
    # holding either makes the ASGI server raise "Invalid HTTP header value" and
    # drop the connection — so the caller got no response at all instead of a
    # 500. It also handed internal details (SQL, file paths) to the browser.
    print(Panel(f"Handled exception: {type(exc).__name__}"))
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    return JSONResponse(
        status_code=HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Something went wrong"},
    )


def add_exception_handlers(app: FastAPI) -> None:
    for subclass in FastShipErrors.__subclasses__():
        app.add_exception_handler(subclass, _get_handler(subclass.status, subclass.__doc__))
    app.add_exception_handler(HTTP_500_INTERNAL_SERVER_ERROR, _internal_server_error_handler)
