from celery import Celery
from asgiref.sync import async_to_sync
from config import db_settings, notification_settings
from fastapi_mail import FastMail, ConnectionConfig, MessageSchema, MessageType
from utils import TEMPLATE_DIR
from pydantic import EmailStr
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

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

# Statuses where trying the same request again can plausibly succeed: Twilio
# rate-limiting us, or Twilio itself being unhealthy.
#
# Everything else is permanent for this message — 401/403 means the credentials
# are wrong (error 20003), 400 means the request is malformed, 21211 an invalid
# recipient, 21608 an unverified number on a trial account. None of those change
# on the tenth attempt, so retrying just buries the real cause under a pile of
# identical failures and delays the log line that explains it.
_RETRYABLE_STATUSES = {429, 500, 502, 503, 504}


@app.task(
    bind=True,
    max_retries=5,
    retry_backoff=5,        # 5s, 10s, 20s, 40s, 80s
    retry_backoff_max=300,
    retry_jitter=True,      # spread retries so a burst doesn't resynchronise
)
def send_sms(self, to: str, body: str):
    try:
        twilio.messages.create(
            from_=notification_settings.TWILIO_PHONE_NUMBER, to=to, body=body
        )
    except TwilioRestException as exc:
        if exc.status not in _RETRYABLE_STATUSES:
            # Swallowed on purpose: re-raising would mark the task FAILED and
            # retry it under Celery's default policy for no benefit. The
            # delivery code still reaches the customer by email, which is why
            # this is survivable at all — see ShipmentEventService._notify.
            print(
                f"[sms] permanent failure for {to}: "
                f"HTTP {exc.status} twilio_code={exc.code} {exc.msg}"
            )
            return
        raise self.retry(exc=exc)
    except Exception as exc:  # noqa: BLE001 - DNS, TLS, timeouts: all transient
        raise self.retry(exc=exc)


@app.task
def add_log(log: str):
    with open("file.log", "a") as f:
        f.write(log + "\n")