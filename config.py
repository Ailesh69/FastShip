from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict

from core.request_context import get_request_base_url

# Addresses that only ever resolve on the machine running this process. A link
# built from one of these is undeliverable to anyone else, on any network.
LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1", ""}


def is_loopback(url: str) -> bool:
    return (urlparse(url).hostname or "") in LOOPBACK_HOSTS

_base_config = SettingsConfigDict(
    env_file=".env", env_ignore_empty=True, extra="ignore"
)


class App_Settings(BaseSettings):
    App_Name: str = "Fastship"
    # App_Domain used to live here and fed the verification / password-reset
    # links. It has been removed: this class had no model_config, so it never
    # read .env and was permanently stuck on "localhost:8000" — which meant
    # every verification email sent anyone on another device to their own
    # machine. There is now one setting for the public address of this server,
    # AppSettings.APP_BASE_URL below, and it includes the scheme.
    model_config = _base_config


class DatabaseSettings(BaseSettings):
    POSTGRES_SERVER: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_TEST_DB :  str
    model_config = _base_config
    REDIS_HOST: str
    REDIS_PORT: int

    @property
    def POSTGRES_URL(self):
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def POSTGRES_TEST_URL(self):
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_TEST_DB}"

    def REDIS_URL(self, db):
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{db}"


class SecuritySettings(BaseSettings):
    JWT_SECRET: str
    JWT_ALGORITHM: str
    model_config = _base_config


class NotificationsSettings(BaseSettings):
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    TWILIO_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str
    model_config = _base_config


class AppSettings(BaseSettings):
    # The address this API is reachable at FROM A BROWSER — including scheme.
    # Every link that leaves the server (email verification, password reset,
    # tracking, review) is built from this, so it must be something the
    # recipient's device can actually resolve. "localhost" only ever works when
    # the recipient is on this same machine; use the LAN IP for other devices
    # on the same network, or a tunnel/public hostname for anyone off it.
    APP_BASE_URL: str = "http://localhost:8000"

    # Browser origins allowed to call this API. Comma-separated; the frontend's
    # dev server must be listed under whatever host the browser used to load it.
    CORS_ORIGINS: str = "http://localhost:5173"
    model_config = _base_config

    @property
    def base_url(self) -> str:
        """APP_BASE_URL without a trailing slash, safe to concatenate."""
        return self.APP_BASE_URL.rstrip("/")

    def link_base(self) -> str:
        """The address to build outgoing links from, for THIS request.

        A configured APP_BASE_URL that names a real host always wins — that is
        someone deliberately pinning the public address, and it must not be
        second-guessed. Only when it points at loopback (the default, and what
        it is during local development) does the request's own Host take over,
        so a link mailed to a phone that reached this server over the LAN comes
        back addressed to the LAN, not to the phone's own localhost.
        """
        configured = self.base_url
        if not is_loopback(configured):
            return configured
        derived = get_request_base_url()
        return derived.rstrip("/") if derived else configured

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


db_settings = DatabaseSettings()
security_settings = SecuritySettings()
notification_settings = NotificationsSettings()
app_settings = AppSettings()
