import asyncio
import logging
import os
import smtplib
from datetime import datetime
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def smtp_is_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_FROM_EMAIL"))


def should_expose_password_reset_links() -> bool:
    return _env_flag("EXPOSE_PASSWORD_RESET_LINKS", default=False)


def _build_password_reset_message(to_email: str, reset_url: str, expires_at: datetime) -> EmailMessage:
    from_email = os.getenv("SMTP_FROM_EMAIL", "no-reply@example.com")
    from_name = os.getenv("SMTP_FROM_NAME", "UR Academic Resource Hub")
    expires_label = expires_at.strftime("%Y-%m-%d %H:%M UTC")

    message = EmailMessage()
    message["Subject"] = "Reset your UR Academic Resource Hub password"
    message["From"] = f"{from_name} <{from_email}>"
    message["To"] = to_email
    message.set_content(
        "\n".join(
            [
                "Hello,",
                "",
                "We received a request to reset your UR Academic Resource Hub password.",
                f"Use this link to choose a new password before {expires_label}:",
                reset_url,
                "",
                "If you did not request this, you can ignore this email.",
            ]
        )
    )
    return message


def _send_email_sync(message: EmailMessage) -> None:
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    use_ssl = _env_flag("SMTP_USE_SSL", default=False)
    use_tls = _env_flag("SMTP_USE_TLS", default=not use_ssl)

    if use_ssl:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30) as server:
            if smtp_username:
                server.login(smtp_username, smtp_password)
            server.send_message(message)
        return

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        if use_tls:
            server.starttls()
        if smtp_username:
            server.login(smtp_username, smtp_password)
        server.send_message(message)


async def send_password_reset_email(to_email: str, reset_url: str, expires_at: datetime) -> bool:
    if not smtp_is_configured():
        logger.warning("SMTP is not configured; password reset link for %s: %s", to_email, reset_url)
        return False

    message = _build_password_reset_message(to_email, reset_url, expires_at)
    await asyncio.to_thread(_send_email_sync, message)
    logger.info("Password reset email queued for %s", to_email)
    return True
