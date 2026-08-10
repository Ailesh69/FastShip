from uuid import UUID
from typing import Annotated
from fastapi import APIRouter, Form, Request
from core.exception import BadRequest, EntityNotFound
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from jinja2 import Environment, FileSystemLoader
from schemas.Tag import TagName
from schemas.shipment import ShipmentCreate, ShipmentUpdate, ShipmentRead
from api.Dependencies.ShipmentDependency import SessionDep, Shipment_ServiceDep
from api.Dependencies.SellerDependency import CurrSellerDep
from api.Dependencies.DeliveryDependency import CurrPartnerDep
from config import app_settings
from tag import APITag
from utils import TEMPLATE_DIR

_jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
templates = Jinja2Templates(directory=str(TEMPLATE_DIR))

router = APIRouter(
    prefix="/shipment",
    tags=[APITag.SHIPMENT],
)


@router.get(
    "/",
    name="Get Shipment",
    description="Retrieve a **shipment** by its ID including timeline and delivery partner details.",
    response_model=ShipmentRead,
    responses={
        200: {"description": "Shipment retrieved successfully"},
        404: {"description": "Shipment not found"},
    },
)
async def get_shipment(id: UUID, service: Shipment_ServiceDep, partner: CurrPartnerDep):
    # Authenticated: the payload carries the recipient's email and phone, the
    # seller id and the full scan history. Unprotected, anyone holding a
    # shipment id — which travels in emailed tracking links — could read the
    # buyer's contact details straight out of the API.
    #
    # The public view of a shipment is GET /shipment/track, which renders only
    # what belongs on a tracking page and is what those emailed links point at.
    # This JSON route has one caller, the partner's Update Shipment screen.
    return await service.get(id)


@router.get("/track", response_class=HTMLResponse, include_in_schema=False)
async def get_tracking(id: UUID, service: Shipment_ServiceDep):
    shipment = await service.get(id)
    if shipment is None:
        raise EntityNotFound("Shipment not found")
    timeline = sorted(shipment.timeline, key=lambda e: e.created_at)
    # Both sides of this used to be dereferenced unguarded: a shipment with no
    # events falls back to the column, and that column is nullable, so
    # `.status.value` on it raised AttributeError and turned the tracking page
    # into a 500.
    if timeline:
        current_status = timeline[-1].status.value
    else:
        current_status = shipment.status.value if shipment.status else "placed"
    html = _jinja_env.get_template("tracking.html").render(
        shipment_id=str(shipment.id),
        content=shipment.content,
        current_status=current_status,
        partner_name=(
            shipment.delivery_partner.name if shipment.delivery_partner else "N/A"
        ),
        estimated_delivery=shipment.estimated_delivery.strftime("%d %B %Y"),
        timeline=[
            {
                "status": e.status.value,
                "description": e.Description,
                "created_at": e.created_at.strftime("%d %b %Y, %I:%M %p"),
                "location": e.location,
            }
            for e in timeline
        ],
    )
    return HTMLResponse(content=html)


@router.post(
    "/",
    name="Create Shipment",
    description="Submit a new **shipment** for delivery. A delivery partner will be automatically assigned.",
    status_code=201,
    response_model=ShipmentRead,
    responses={
        201: {
            "description": "Shipment created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "content": "Electronics",
                        "status": "placed",
                        "destination": 10001,
                        "estimated_delivery": "2026-07-03",
                    }
                }
            },
        },
        406: {"description": "No delivery partner is available for the destination"},
    },
)
async def submit_shipment(
    shipment: ShipmentCreate, service: Shipment_ServiceDep, seller: CurrSellerDep
):
    return await service.add(shipment, seller)


@router.patch(
    "/",
    name="Update Shipment",
    description="Update a **shipment's** status or estimated delivery. Only the assigned delivery partner can update.",
    response_model=ShipmentRead,
    responses={
        200: {"description": "Shipment updated successfully"},
        400: {"description": "No data provided to update"},
        401: {"description": "Not authorized to update this shipment"},
    },
)
async def update_shipment(
    id: UUID,
    shipment_update: ShipmentUpdate,
    partner: CurrPartnerDep,
    service: Shipment_ServiceDep,
):
    update = shipment_update.model_dump(exclude_none=True)
    if not update:
        raise BadRequest("No data provided to update")
    return await service.update(id, shipment_update, partner)


@router.post(
    "/cancel",
    name="Cancel Shipment",
    description="Cancel a **shipment** by ID. Only the seller who created it can cancel.",
    response_model=ShipmentRead,
    responses={
        200: {"description": "Shipment cancelled successfully"},
        401: {"description": "Not authorized to cancel this shipment"},
        404: {"description": "Shipment not found"},
    },
)
async def cancel_shipment(
    id: UUID, seller: CurrSellerDep, service: Shipment_ServiceDep
):
    return await service.cancel(id, seller)


@router.get("/review", include_in_schema=False)
async def review_page(token: str, request: Request, service: Shipment_ServiceDep):
    service.validate_review_token(token)
    return templates.TemplateResponse(
        request=request,
        name="review.html",
        context={
            "review_url": f"{app_settings.link_base()}/shipment/review?token={token}"
        },
    )


@router.post(
    "/review",
    name="Submit Review",
    description="Submit a **rating and optional comment** for a delivered shipment using the review token.",
    responses={
        200: {
            "description": "Review submitted successfully",
            "content": {
                "application/json": {"example": {"detail": "Review submitted successfully!"}}
            },
        },
        401: {"description": "Review link is invalid or expired"},
        404: {"description": "Shipment not found"},
    },
)
async def submit_review(
    token: str,
    service: Shipment_ServiceDep,
    rating: Annotated[int, Form(ge=1, le=5)],
    comment: Annotated[str | None, Form()] = None,
):
    await service.rate(token, rating, comment)
    return {"detail": "Review submitted successfully!"}


@router.post(
    "/tag",
    name="Add Tag",
    description="Add a **tag** to an existing shipment for categorization.",
    response_model=ShipmentRead,
    responses={
        200: {"description": "Tag added successfully"},
        404: {"description": "Shipment not found"},
    },
)
async def add_tag(
    id: UUID, tag: TagName, service: Shipment_ServiceDep, seller: CurrSellerDep
):
    # Seller-only, and only on their own shipments. This was open to the
    # internet: anyone could retag any shipment, and tags drive handling
    # instructions (FRAGILE, HEAVY, EXPRESS).
    return await service.add_tag(id, tag, seller)


@router.delete(
    "/tag",
    name="Remove Tag",
    description="Remove a **tag** from an existing shipment.",
    response_model=ShipmentRead,
    responses={
        200: {"description": "Tag removed successfully"},
        404: {"description": "Tag does not exist on this shipment"},
    },
)
async def remove_tag(
    id: UUID, tag: TagName, service: Shipment_ServiceDep, seller: CurrSellerDep
):
    return await service.delete_tag(id, tag, seller)


@router.get(
    "/all_tags",
    name="Get Shipments by Tag",
    description="Retrieve all **shipments** associated with a specific tag.",
    # A list of shipments, not one. Declared as a bare ShipmentRead, FastAPI
    # tried to validate the list against a single object and raised
    # ResponseValidationError — a 500 on every successful call.
    response_model=list[ShipmentRead],
    responses={
        200: {"description": "Shipments retrieved successfully"},
        404: {"description": "Tag not found"},
    },
)
async def get_all_tags(tag_name: TagName, Session: SessionDep, seller: CurrSellerDep):
    tag = await tag_name.tag(Session)
    if tag is None:
        raise EntityNotFound(f"Tag {tag_name.value} does not exist")
    # Scoped to the caller. Returning tag.shipments wholesale handed every
    # seller's shipments, with recipient contact details, to any caller at all.
    return [s for s in tag.shipments if s.seller_id == seller.id]
