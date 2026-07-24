from fastapi import APIRouter, Depends, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
from typing import Annotated

from pydantic import EmailStr
from tag import APITag
from utils import TEMPLATE_DIR
from Database.redis import add_jti_to_blacklist
from schemas.seller import SellerCreate, SellerRead
from schemas.Token import Token
from api.Dependencies.SellerDependency import Seller_ServiceDep, _get_access_token

router = APIRouter(prefix="/seller", tags=[APITag.SELLER])
templates = Jinja2Templates(directory=TEMPLATE_DIR)


@router.post(
    "/signup",
    name="Register Seller",
    description="Create a new **seller** account. A verification email will be sent upon registration.",
    status_code=201,
    response_model=SellerRead,
    responses={
        201: {
            "description": "Seller registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "name": "John Doe",
                        "email": "john@example.com",
                        "email_verified": False,
                    }
                }
            },
        },
        409: {"description": "Email is already registered"},
    },
)
async def register_seller(seller: SellerCreate, service: Seller_ServiceDep):
    return await service.add(seller)


@router.post(
    "/login",
    name="Seller Login",
    description="Authenticate a **seller** and receive a bearer access token.",
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
async def login_seller(
    request_form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: Seller_ServiceDep,
):
    token = await service.login(request_form.username, request_form.password)
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/verify",
    name="Verify Seller Email",
    description="Verify seller email address using the token sent in the verification email.",
    responses={
        200: {
            "description": "Email verified successfully",
            "content": {"application/json": {"example": {"detail": "Account is Verified"}}},
        },
        400: {"description": "Token is invalid or expired"},
    },
)
async def verify_seller(token: str, service: Seller_ServiceDep):
    await service._verify_email(token)
    return {"detail": "Account is Verified"}


@router.get(
    "/forgot_password",
    name="Forgot Password",
    description="Send a **password reset** link to the seller's registered email address.",
    responses={
        200: {
            "description": "Reset link sent",
            "content": {
                "application/json": {
                    "example": {"detail": "Password reset link is sent to your email - john@example.com"}
                }
            },
        },
        404: {"description": "No account found with that email"},
    },
)
async def forgot_password(email: EmailStr, service: Seller_ServiceDep):
    await service.password_reset(email, router.prefix)
    return {"detail": f"Password reset link is sent to your email - {email}"}


@router.get("/reset_password", include_in_schema=False)
async def reset_password(token: str, request: Request, service: Seller_ServiceDep):
    service.validate_password_reset_token(token)
    return templates.TemplateResponse(
        request=request,
        name="reset_password.html",
        context={"token": token, "action_url": "/seller/reset_password_form"},
    )


@router.post(
    "/reset_password_form",
    name="Reset Password",
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
async def password_form(
    token: Annotated[str, Form()],
    new_password: Annotated[str, Form()],
    confirm_password: Annotated[str, Form()],
    service: Seller_ServiceDep,
):
    await service.password_reset_update(token, new_password, confirm_password)
    return {"detail": "Password reset successfully!"}


@router.get(
    "/logout",
    name="Logout Seller",
    description="Invalidate the current seller **access token** by blacklisting it.",
    responses={
        200: {
            "description": "Logged out successfully",
            "content": {"application/json": {"example": {"details": "Successful"}}},
        },
        401: {"description": "Invalid or expired token"},
    },
)
async def logout_seller(token_data: Annotated[dict, Depends(_get_access_token)]):
    await add_jti_to_blacklist(token_data["jti"])
    return {"details": "Successful"}
