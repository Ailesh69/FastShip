from typing import Annotated

from fastapi import APIRouter, Depends, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates

from pydantic import EmailStr
from tag import APITag
from utils import TEMPLATE_DIR
from Database.redis import add_jti_to_blacklist
from schemas.Client import ClientCreate, ClientRead
from schemas.Token import Token
from api.Dependencies.ClientDependency import (
    Client_ServiceDep,
    CurrClientDep,
    _get_client_access_token,
)

router = APIRouter(prefix="/client", tags=[APITag.CLIENT])
templates = Jinja2Templates(directory=TEMPLATE_DIR)


@router.post(
    "/register",
    name="Register Client",
    description="Create a new **client** account. A verification email will be sent upon registration.",
    status_code=201,
    response_model=ClientRead,
    responses={
        201: {
            "description": "Client registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "name": "Jane Doe",
                        "email": "jane@example.com",
                        "email_verified": False,
                    }
                }
            },
        },
        409: {"description": "Email is already registered"},
    },
)
async def register_client(client: ClientCreate, service: Client_ServiceDep):
    return await service.register(client, router.prefix)


@router.get(
    "/verify",
    name="Verify Client Email",
    description="Verify client email address using the token sent in the verification email.",
    responses={
        200: {
            "description": "Email verified successfully",
            "content": {"application/json": {"example": {"detail": "Account is Verified"}}},
        },
        400: {"description": "Token is invalid or expired"},
    },
)
async def verify_client(token: str, service: Client_ServiceDep):
    await service._verify_email(token)
    return {"detail": "Account is Verified"}


@router.post(
    "/token",
    name="Client Login",
    description="Authenticate a **client** and receive a bearer access token.",
    response_model=Token,
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {"access_token": "<jwt_token>", "token_type": "bearer"}
                }
            },
        },
        401: {"description": "Invalid email or password, or email not verified"},
    },
)
async def login_client(
    request_form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: Client_ServiceDep,
):
    token = await service.login(request_form.username, request_form.password)
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    name="Get Client Profile",
    description="Retrieve the authenticated **client's** profile.",
    response_model=ClientRead,
    responses={
        200: {"description": "Client profile retrieved successfully"},
        401: {"description": "Invalid or expired token"},
    },
)
async def get_me(client: CurrClientDep):
    return client


@router.get(
    "/forgot_password",
    name="Client Forgot Password",
    description="Send a **password reset** link to the client's registered email address.",
    responses={
        200: {
            "description": "Reset link sent",
            "content": {
                "application/json": {
                    "example": {"detail": "Password reset link is sent to your email - jane@example.com"}
                }
            },
        },
        404: {"description": "No account found with that email"},
    },
)
async def forgot_password_client(email: EmailStr, service: Client_ServiceDep):
    await service.password_reset(email, router.prefix)
    return {"detail": f"Password reset link is sent to your email - {email}"}


@router.get("/reset_password", include_in_schema=False)
async def reset_password_client(token: str, request: Request, service: Client_ServiceDep):
    service.validate_password_reset_token(token)
    return templates.TemplateResponse(
        request=request,
        name="reset_password.html",
        context={"token": token, "action_url": "/client/reset_password"},
    )


@router.post(
    "/reset_password",
    name="Reset Client Password",
    description="Submit a new **password** using the reset token received via email.",
    responses={
        200: {
            "description": "Password reset successfully",
            "content": {
                "application/json": {"example": {"detail": "Password reset successfully!"}}
            },
        },
        400: {"description": "Passwords do not match"},
        401: {"description": "Reset link is invalid or has expired"},
    },
)
async def reset_password_form_client(
    token: Annotated[str, Form()],
    new_password: Annotated[str, Form()],
    confirm_password: Annotated[str, Form()],
    service: Client_ServiceDep,
):
    await service.password_reset_update(token, new_password, confirm_password)
    return {"detail": "Password reset successfully!"}


@router.get(
    "/logout",
    name="Logout Client",
    description="Invalidate the current client **access token** by blacklisting it.",
    responses={
        200: {
            "description": "Logged out successfully",
            "content": {"application/json": {"example": {"details": "Successful"}}},
        },
        401: {"description": "Invalid or expired token"},
    },
)
async def logout_client(token_data: Annotated[dict, Depends(_get_client_access_token)]):
    await add_jti_to_blacklist(token_data["jti"])
    return {"details": "Successful"}
