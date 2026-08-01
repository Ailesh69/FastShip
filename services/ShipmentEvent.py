from random import randint
from datetime import datetime, timezone
from config import app_settings
from Database.redis import add_otp
from schemas.ShipmentEvent import ShipmentEvent
from schemas.shipment import Shipment
from Database.models import ShipmentStatus
from services.Base import BaseService
from worker.tasks import send_sms, send_email_with_template
from schemas.DeliveryPartner import DeliveryPartner
from utils import generate_url_safe_token


class ShipmentEventService(BaseService):
    def __init__(self, session):
        super().__init__(ShipmentEvent, session)

    def _generate_description(self, status: ShipmentStatus, location: int) -> str:
        match status:
            case ShipmentStatus.placed:
                return "Assigned delivery partner"
            case ShipmentStatus.delivered:
                return "Successfully delivered"
            case ShipmentStatus.out_for_delivery:
                return "Out for delivery"
            case ShipmentStatus.cancelled:
                return "cancelled by seller"
            case _:
                return f"Scanned at {location}"

    async def _get_latest_event(self, shipment: Shipment) -> ShipmentEvent:
        timeline = list(shipment.timeline)
        timeline.sort(key=lambda e: e.created_at)
        return timeline[-1]

    async def add(
        self,
        shipment: Shipment,
        location: int | None = None,
        status: ShipmentStatus | None = None,
        description: str | None = None,
    ) -> ShipmentEvent:
        if location is None or status is None:
            last = await self._get_latest_event(shipment)
            location = location if location is not None else last.location
            status = status if status is not None else last.status

        description = (
            description
            if description is not None
            else self._generate_description(status, location)
        )

        event = ShipmentEvent(
            location=location,
            status=status,
            Description=description,
            shipment_id=shipment.id,
        )
        await self._notify(shipment, status, location)
        return await self._add(event)

    async def _notify(
        self,
        shipment: Shipment,
        status: ShipmentStatus,
        location: int,
        dp: DeliveryPartner | None = None,
    ):
        now = datetime.now(tz=timezone.utc).strftime("%d %B %Y")

        match status:
            case ShipmentStatus.placed:
                template = "mail_placed.html"
                subject = "Your order has been placed!"
                context = {
                    "shipment_id": str(shipment.id),
                    "content": shipment.content,
                    "partner_name": (
                        shipment.delivery_partner.name
                        if shipment.delivery_partner
                        else "the delivery partner"
                    ),
                    "estimated_delivery": shipment.estimated_delivery.strftime(
                        "%d %B %Y"
                    ),
                    "tracking_url": f"{app_settings.APP_BASE_URL}/shipment/tracking?id={shipment.id}",
                }
            case ShipmentStatus.in_transit:
                template = "mail_in_transit.html"
                subject = "Your order is in transit"
                context = {
                    "shipment_id": str(shipment.id),
                    "content": shipment.content,
                    "location": location,
                    "estimated_delivery": shipment.estimated_delivery.strftime(
                        "%d %B %Y"
                    ),
                }
            case ShipmentStatus.out_for_delivery:
                template = "mail_out_for_delivery.html"
                subject = "Your order is out for delivery!"
                context = {
                    "shipment_id": str(shipment.id),
                    "content": shipment.content,
                }
                code = randint(100_000, 999_999)
                await add_otp(shipment.id, code)
                if shipment.client_contact_phone:
                    send_sms.delay(
                        to=f"+{shipment.client_contact_phone}",
                        body=f"Your order is arriving soon! Share OTP {code} with the delivery agent when you receive your order.",
                    )
                else:
                    context["otp"] = code
            case ShipmentStatus.delivered:
                template = "mail_delivered.html"
                subject = "Your order has been delivered!"
                token = generate_url_safe_token({"id": str(shipment.id)})
                context = {
                    "shipment_id": str(shipment.id),
                    "content": shipment.content,
                    "delivered_on": now,
                    "review_url": f"{app_settings.APP_BASE_URL}/shipment/review?token={token}",
                }
            case ShipmentStatus.cancelled:
                template = "mail_cancelled.html"
                subject = "Your order has been cancelled"
                context = {
                    "shipment_id": str(shipment.id),
                    "content": shipment.content,
                    "cancelled_on": now,
                }
            case _:
                return

        if shipment.client_contact_email:
            send_email_with_template.delay(
                recipients=[shipment.client_contact_email],
                subject=subject,
                context=context,
                template_name=template,
            )
