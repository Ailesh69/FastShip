from fastapi import BackgroundTasks
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from config import notification_settings
from utils import TEMPLATE_DIR
from twilio.rest import Client


class NotficationService:
    def __init__(self, tasks: BackgroundTasks):
        self.tasks = tasks
        self.fastmail = FastMail(
            ConnectionConfig(
                **notification_settings.model_dump(
                    exclude=["TWILIO_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]
                ),
                TEMPLATE_FOLDER=TEMPLATE_DIR,
            )
        )
        self.twilio = Client(
            notification_settings.TWILIO_SID, notification_settings.TWILIO_AUTH_TOKEN
        )

    async def send_email(
        self,
        recipients: list[EmailStr],
        subject: str,
        body: str,
    ):
        try:
            self.tasks.add_task(
                self.fastmail.send_message,
                message=MessageSchema(
                    recipients=recipients,
                    subject=subject,
                    body=body,
                    subtype=MessageType.plain,
                ),
            )
            print(f"EMAIL SENT to {recipients}")
        except Exception as e:
            print(f"EMAIL FAILED: {e}")

    async def send_email_with_template(
        self,
        recipients: list[EmailStr],
        subject: str,
        context: dict,
        template_name: str,
    ):
        self.tasks.add_task(
            self.fastmail.send_message,
            message=MessageSchema(
                recipients=recipients,
                subject=subject,
                template_body=context,
                subtype=MessageType.html,
            ),
            template_name=template_name,
        )

    def send_sms(self, to: str, body: str):
        self.twilio.messages.create(
            from_=notification_settings.TWILIO_PHONE_NUMBER, to=to, body=body
        )

    async def send_sms_background(self, to: str, body: str):
        self.tasks.add_task(self.send_sms, to, body)
