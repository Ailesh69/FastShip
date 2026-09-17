from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict

from core.request_context import get_request_base_url

# Hosts that only resolve on this machine; links built from these are undeliverable elsewhere.
LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1", ""}


def is_loopback(url: str) -> bool:
    return (urlparse(url).hostname or "") in LOOPBACK_HOSTS

_base_config = SettingsConfigDict(
    env_file=".env", env_ignore_empty=True, extra="ignore"
)


class App_Settings(BaseSettings):
    App_Name: str = "Fastship"
    # App_Domain removed: never read .env, stuck on localhost. Use AppSettings.APP_BASE_URL instead.
    model_config = _base_config


class DatabaseSettings(BaseSettings):
    POSTGRES_SERVER: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_TEST_DB :  str | None = None 
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
    # Public address (with scheme) all outgoing links are built from. Must be reachable
    # by the recipient's device, not just localhost.
    APP_BASE_URL: str = "http://localhost:8000"

    # Comma-separated browser origins allowed to call this API.
    CORS_ORIGINS: str = "http://localhost:5173"
    model_config = _base_config

    @property
    def base_url(self) -> str:
        """APP_BASE_URL without a trailing slash, safe to concatenate."""
        return self.APP_BASE_URL.rstrip("/")

    def link_base(self) -> str:
        """Address to build outgoing links from. A non-loopback APP_BASE_URL always
        wins; otherwise falls back to the request's own Host (for LAN/dev access)."""
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
