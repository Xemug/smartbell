"""Who is calling: verifies Firebase ID tokens. Identity lives in Firebase, not our database."""

import os
from dataclasses import dataclass
from typing import Annotated, Any

import firebase_admin  # type: ignore[import-untyped]
from fastapi import Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth, credentials
from google.auth.credentials import AnonymousCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.models import User
from smartbell.settings import Settings

_EMULATOR_ENV = "FIREBASE_AUTH_EMULATOR_HOST"
_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class TokenClaims:
    uid: str
    email: str | None
    email_verified: bool
    name: str | None
    picture: str | None


class _NoCredential(credentials.Base):  # type: ignore[misc]
    """Verifying a token needs only Google's public certs, so the API holds no admin key at all."""

    def get_credential(self) -> AnonymousCredentials:
        return AnonymousCredentials()  # type: ignore[no-untyped-call]


def _unauthorized() -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail="invalid_token",
        headers={"WWW-Authenticate": "Bearer"},
    )


class FirebaseTokenVerifier:
    def __init__(self, settings: Settings) -> None:
        # firebase-admin reads the environment itself. Settings has already refused an emulator
        # outside a demo- project; this keeps a stray variable from outliving that decision.
        if settings.firebase_auth_emulator_host:
            os.environ[_EMULATOR_ENV] = settings.firebase_auth_emulator_host
        else:
            os.environ.pop(_EMULATOR_ENV, None)
        name = f"smartbell-{settings.firebase_project_id}"
        try:
            self._app = firebase_admin.get_app(name)
        except ValueError:
            self._app = firebase_admin.initialize_app(
                _NoCredential(), {"projectId": settings.firebase_project_id}, name
            )

    def _verify(self, token: str) -> TokenClaims:
        try:
            claims: dict[str, Any] = auth.verify_id_token(token, app=self._app)
        except auth.CertificateFetchError as error:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE) from error
        except (auth.InvalidIdTokenError, ValueError) as error:
            raise _unauthorized() from error
        return TokenClaims(
            uid=claims["uid"],
            email=claims.get("email"),
            email_verified=claims.get("email_verified") is True,
            name=claims.get("name"),
            picture=claims.get("picture"),
        )

    async def verify(self, token: str) -> TokenClaims:
        return await run_in_threadpool(self._verify, token)  # It fetches certs over the network.


async def get_token_claims(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> TokenClaims:
    if credentials is None:
        raise _unauthorized()
    verifier: FirebaseTokenVerifier = request.app.state.token_verifier
    return await verifier.verify(credentials.credentials)


async def get_current_user(
    claims: Annotated[TokenClaims, Depends(get_token_claims)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """A valid token with no `users` row is still a 401: the client must open a session first."""
    user = await session.scalar(select(User).where(User.firebase_uid == claims.uid))
    if user is None:
        raise _unauthorized()
    return user
