"""The one place a templated email is queued.

Every email template pulls the pixel typefaces off this server with @font-face,
and an email is read outside any browsing context — so those URLs have to be
absolute and reachable from the recipient's device. `asset_base` is resolved
HERE, in the web process, while the request that triggered the mail is still in
scope (see core.request_context). Resolving it inside the Celery worker would be
too late: the worker has no request, so it would fall back to APP_BASE_URL and
mail out font links to localhost.

Going through this function rather than calling send_email_with_template.delay()
directly is what guarantees no caller can forget to include it.
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
