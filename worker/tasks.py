from celery import Celery
from asgiref.sync import async_to_sync
from config import db_settings, notification_settings
from fastapi_mail import FastMail, ConnectionConfig, MessageSchema, MessageType
from utils import TEMPLATE_DIR
from pydantic import EmailStr
from twilio.rest import Client

fast_mail = FastMail(
    ConnectionConfig(
        **notification_settings.model_dump(
            exclude=["TWILIO_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]
        ),
        TEMPLATE_FOLDER=TEMPLATE_DIR
    )
)
send_message = async_to_sync(fast_mail.send_message)
app = Celery(
    "api_tasks",
    broker=db_settings.REDIS_URL(9),
    backend=db_settings.REDIS_URL(9),
)


@app.task
def send_mail(recipients: list[str], body: str, subject: str, subtype: str = "plain"):
    send_message(
        MessageSchema(
            recipients=recipients,
            subject=subject,
            body=body,
            subtype=subtype,
        )
    )
    return "Message Sent"


@app.task
def send_email_with_template(
    recipients: list[EmailStr],
    subject: str,
    context: dict,
    template_name: str,
):
    send_message(
        message=MessageSchema(
            recipients=recipients,
            subject=subject,
            template_body=context,
            subtype=MessageType.html,
        ),
        template_name=template_name,
    )
twilio = Client(
            notification_settings.TWILIO_SID, notification_settings.TWILIO_AUTH_TOKEN
)

@app.task
def send_sms(to: str, body: str):
    twilio.messages.create(
        from_=notification_settings.TWILIO_PHONE_NUMBER, to=to, body=body
    )


@app.task
def add_log(log: str):
    with open("file.log", "a") as f:
        f.write(log + "\n")