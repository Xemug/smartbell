"""The alerts of the active ranch (`X-Ranch-Id`).

    GET  /alerts?kind=&status=      every alert, by window then kind
    GET  /alerts/counts             pending alerts whose window has opened: the bell badge
    POST /alerts/{id}/resolve       close a pending alert by hand: CONFIRMED or NEGATED

Alerts are internal (reconciliation-v4 §4.3): people meet them as automatic tasks, so these
routes serve the tasks layer and the badge rather than a screen of their own. The daily job
(`jobs/daily`) and the events API open and close them.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.enums import AlertKind, AlertStatus
from smartbell.routes.animals import Today
from smartbell.schemas.alerts import AlertCountsOut, AlertOut, AlertResolve
from smartbell.security.permissions import Permission
from smartbell.security.ranch import RanchContext, require
from smartbell.services import alerts

router = APIRouter(tags=["alerts"])

Session = Annotated[AsyncSession, Depends(get_session)]


@router.get("/alerts", operation_id="listAlerts")
async def list_alerts(
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_VIEW))],
    session: Session,
    kind: AlertKind | None = None,
    status: AlertStatus | None = None,
) -> list[AlertOut]:
    rows = await alerts.list_alerts(session, ctx.ranch_id, kind, status)
    return [AlertOut.model_validate(row) for row in rows]


@router.get("/alerts/counts", operation_id="countAlerts")
async def count_alerts(
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_VIEW))],
    session: Session,
    today: Today,
) -> AlertCountsOut:
    counts = await alerts.count_active(session, ctx.ranch_id, today)
    return AlertCountsOut(total=counts.total, by_kind=counts.by_kind)


@router.post("/alerts/{alert_id}/resolve", operation_id="resolveAlert")
async def resolve_alert(
    alert_id: uuid.UUID,
    body: AlertResolve,
    ctx: Annotated[RanchContext, Depends(require(Permission.EVENTS_RECORD))],
    session: Session,
) -> AlertOut:
    try:
        row = await alerts.resolve(
            session, ctx.ranch_id, alert_id, ctx.user.id, body.status, body.event_id
        )
    except alerts.AlertNotFound:
        # The same answer for another ranch's alert, so ids can't be probed.
        raise HTTPException(404, detail="Alert not found") from None
    except alerts.AlertClosed:
        raise HTTPException(409, detail="The alert is already closed") from None
    except alerts.EventMismatch:
        raise HTTPException(
            422,
            detail=[
                {
                    "loc": ["body", "event_id"],
                    "type": "event_not_found",
                    "msg": "No such event for this animal",
                }
            ],
        ) from None
    await session.commit()
    return AlertOut.model_validate(row)
