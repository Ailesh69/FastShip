from fastapi import APIRouter, Depends, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
from typing import Annotated

from pydantic import EmailStr
from tag import APITag
from utils import TEMPLATE_DIR
from Database.redis import add_jti_to_blacklist
from schemas.DeliveryPartner import DPCreate, DPRead, DPUpdate
from schemas.Token import Token
from api.Dependencies.DeliveryDependency import (
    CurrPartnerDep,
    _get_partner_access_token,
    DeliveryPartnerServiceDep,
)

router = APIRouter(prefix="/partner", tags=[APITag.PARTNER])
templates = Jinja2Templates(directory=TEMPLATE_DIR)


@router.post(
    "/register",
    name="Register Delivery Partner",
    description="Create a new **delivery partner** account. A verification email will be sent upon registration.",
    status_code=201,
    response_model=DPRead,
    responses={
        201: {
            "description": "Delivery partner registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "name": "Jane Smith",
                        "email": "jane@deliveries.com",
                        "email_verified": False,
                    }
                }
            },
        },
        409: {"description": "Email is already registered"},
    },
)
async def register_partner(dp: DPCreate, service: DeliveryPartnerServiceDep):
    return await service.add(dp)


@router.post(
    "/token",
    name="Partner Login",
    description="Authenticate a **delivery partner** and receive a bearer access token.",
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
async def login_partner(
    request_form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: DeliveryPartnerServiceDep,
):
    token = await service.login(request_form.username, request_form.password)
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/verify",
    name="Verify Partner Email",
    description="Verify delivery partner email address using the token sent in the verification email.",
    responses={
        200: {
            "description": "Email verified successfully",
            "content": {"application/json": {"example": {"detail": "Account is verified"}}},
        },
        400: {"description": "Token is invalid or expired"},
    },
)
async def verify_partner(token: str, service: DeliveryPartnerServiceDep):
    await service._verify_email(token)
    return {"detail": "Account is verified"}


@router.get(
    "/forgot_password",
    name="Partner Forgot Password",
    description="Send a **password reset** link to the delivery partner's registered email address.",
    responses={
        200: {
            "description": "Reset link sent",
            "content": {
                "application/json": {
                    "example": {"detail": "Password reset link is sent to your email - jane@deliveries.com"}
                }
            },
        },
        404: {"description": "No account found with that email"},
    },
)
async def forgot_password_partner(email: EmailStr, service: DeliveryPartnerServiceDep):
    await service.password_reset(email, router.prefix)
    return {"detail": f"Password reset link is sent to your email - {email}"}


@router.get("/reset_password", include_in_schema=False)
async def reset_password_partner(token: str, request: Request, service: DeliveryPartnerServiceDep):
    service.validate_password_reset_token(token)
    return templates.TemplateResponse(
        request=request,
        name="reset_password.html",
        context={"token": token, "action_url": "/partner/reset_password_form"},
    )


@router.post(
    "/reset_password_form",
    name="Partner Reset Password",
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
async def password_form_partner(
    token: Annotated[str, Form()],
    new_password: Annotated[str, Form()],
    confirm_password: Annotated[str, Form()],
    service: DeliveryPartnerServiceDep,
):
    await service.password_reset_update(token, new_password, confirm_password)
    return {"detail": "Password reset successfully!"}


@router.get(
    "/logout",
    name="Logout Partner",
    description="Invalidate the current delivery partner **access token** by blacklisting it.",
    responses={
        200: {
            "description": "Logged out successfully",
            "content": {"application/json": {"example": {"details": "Successful"}}},
        },
        401: {"description": "Invalid or expired token"},
    },
)
async def logout_partner(
    token_data: Annotated[dict, Depends(_get_partner_access_token)],
):
    await add_jti_to_blacklist(token_data["jti"])
    return {"details": "Successful"}


@router.post(
    "/",
    name="Update Partner Profile",
    description="Update the authenticated delivery partner's **profile** information.",
    response_model=DPRead,
    responses={
        200: {"description": "Profile updated successfully"},
        401: {"description": "Invalid or expired token"},
    },
)
async def update_partner(
    update_data: DPUpdate, partner: CurrPartnerDep, service: DeliveryPartnerServiceDep
):
    return await service.update(partner.sqlmodel_update(update_data))

@router.get(
    "/me",
    name="Get Partner Profile",
    description="Retrieve the authenticated **delivery partner's** profile.",
    response_model=DPRead,
    responses={
        200: {"description": "Partner profile retrieved successfully"},
        401: {"description": "Invalid or expired token"},
    },
)
async def get_partner_me(partner: CurrPartnerDep):
    return partner