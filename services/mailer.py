"""Single entry point for queuing templated emails.

Resolves asset_base here (web process, request still in scope) since the Celery
worker has no request and would fall back to APP_BASE_URL / localhost.
"""

from config import app_settings
from worker.tasks import send_email_with_template


def send_templated_email(
    recipients: list[str],
    subject: str,
    context: dict,
    template_name: str,
) -> None:
    send_email_with_template.delay(
        recipients=recipients,
        subject=subject,
        context={"asset_base": app_settings.link_base(), **context},
        template_name=template_name,
    )
