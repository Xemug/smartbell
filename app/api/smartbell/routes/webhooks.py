"""`POST /api/webhooks/revenuecat`: RevenueCat tells us a subscriber changed.

Authenticated by a shared secret only (RevenueCat sends no Firebase token), so it fails closed:
no secret configured means every call is refused. Non-2xx makes RevenueCat retry later.
"""

import hashlib
import hmac
import json
import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.services import revenuecat
from smartbell.settings import Settings

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
log = logging.getLogger(__name__)

MAX_BODY_BYTES = 64 * 1024  # RevenueCat events are a few KB.


class WebhookOut(BaseModel):
    action: str


def _settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_subscriber_fetcher(
    settings: Annotated[Settings, Depends(_settings)],
) -> revenuecat.FetchSubscriber:
    return revenuecat.http_subscriber_fetcher(
        settings.revenuecat_api_url, settings.revenuecat_secret_key
    )


def _same_secret(given: str, expected: str) -> bool:
    # Hashing first makes the comparison constant-time whatever the lengths.
    digest = hashlib.sha256
    return hmac.compare_digest(digest(given.encode()).digest(), digest(expected.encode()).digest())


@router.post("/revenuecat", operation_id="revenueCatWebhook")
async def revenuecat_webhook(
    request: Request,
    settings: Annotated[Settings, Depends(_settings)],
    session: Annotated[AsyncSession, Depends(get_session)],
    fetch_subscriber: Annotated[revenuecat.FetchSubscriber, Depends(get_subscriber_fetcher)],
) -> WebhookOut:
    if not settings.revenuecat_webhook_auth or not settings.revenuecat_secret_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "not_configured")
    given = request.headers.get("authorization", "")
    if not _same_secret(given, settings.revenuecat_webhook_auth):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "unauthorized")

    raw = bytearray()
    async for chunk in request.stream():  # Stop reading at the cap, not after the whole body.
        raw += chunk
        if len(raw) > MAX_BODY_BYTES:
            raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "too_large")
    try:
        body: Any = json.loads(raw)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "bad_event") from None
    event = body.get("event") if isinstance(body, dict) else None
    if not isinstance(event, dict) or not isinstance(event.get("type"), str):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "bad_event")

    try:
        result = await revenuecat.apply_event(
            session, event, fetch_subscriber, allow_sandbox=settings.revenuecat_allow_sandbox
        )
    except revenuecat.RevenueCatUnavailable as err:
        await session.rollback()
        log.warning("revenuecat webhook: %s", err)  # No ids or secrets in the log.
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "try_again") from None
    return WebhookOut(action=result["action"])
