"""The daily alert job (docs/roadmap/alert-engine.md).

Every ranch, once a day at 05:00 ranch time:

1. re-run the repro fold for every animal as of the ranch's today, which applies the date-driven
   transitions (VWP end → ABIERTA, dry-off date → SECA) by writing the projection; no event is
   written for them, the fold derives them from the dates;
2. open and close the projection's alerts and reminder tasks (`alert_sync.sync_animal`, the same
   hook `events-api` calls), and the approved vaccination plan's VACCINE_DUE alerts;
3. move every pending alert one day on: follow-up day, expiry.

Every step is idempotent, so a second run on the same day changes nothing, and a ranch that
fails is logged and skipped without stopping the others.

Ways to run it:
- in the API process, when `DAILY_JOB_ENABLED` is set (`start_scheduler`, APScheduler);
- once, from a shell or a scheduled Cloud Run job: `python -m smartbell.jobs.daily [--today D]`.
"""

import argparse
import asyncio
import datetime as dt
import logging
import uuid
from dataclasses import dataclass

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from smartbell.domain.repro import EventFact, project
from smartbell.models import Animal, Event, Ranch, RanchSettings
from smartbell.services import alert_sync, alerts
from smartbell.services.animals import RANCH_TIMEZONE
from smartbell.services.projection import animal_facts, event_fact, repro_settings, write_projection

log = logging.getLogger(__name__)

RUN_AT_HOUR = 5  # 05:00 ranch time.


@dataclass(frozen=True)
class RanchRun:
    ranch_id: uuid.UUID
    today: dt.date
    animals: int
    expired: int


def ranch_today(now: dt.datetime | None = None) -> dt.date:
    """The ranch's date. Ranches are all in Mexico and none stores its own zone yet."""
    return (now or dt.datetime.now(dt.UTC)).astimezone(RANCH_TIMEZONE).date()


async def run_ranch(session: AsyncSession, ranch_id: uuid.UUID, today: dt.date) -> RanchRun:
    """The job for one ranch. The caller commits."""
    settings = await session.get_one(RanchSettings, ranch_id)
    engine_settings = repro_settings(settings)
    animals = (await session.scalars(select(Animal).where(Animal.ranch_id == ranch_id))).all()
    events: dict[uuid.UUID, list[EventFact]] = {animal.id: [] for animal in animals}
    for event in await session.scalars(select(Event).where(Event.ranch_id == ranch_id)):
        events.setdefault(event.animal_id, []).append(event_fact(event))
    vaccines = await alerts.approved_vaccines(session, ranch_id)
    for animal in animals:
        projection = project(animal_facts(animal), events[animal.id], engine_settings, today)
        write_projection(animal, projection)
        await alert_sync.sync_animal(session, animal, projection, today)
        await alerts.sync_vaccines(session, animal, projection, vaccines, events[animal.id], today)
    expired = await alerts.advance(session, ranch_id, today)
    return RanchRun(ranch_id=ranch_id, today=today, animals=len(animals), expired=len(expired))


async def run_all(
    sessionmaker: async_sessionmaker[AsyncSession], now: dt.datetime | None = None
) -> list[RanchRun]:
    """The job for every ranch, each in its own transaction."""
    today = ranch_today(now)
    async with sessionmaker() as session:
        ranch_ids = list(await session.scalars(select(Ranch.id).order_by(Ranch.created_at)))
    runs: list[RanchRun] = []
    for ranch_id in ranch_ids:
        async with sessionmaker() as session:
            try:
                runs.append(await run_ranch(session, ranch_id, today))
                await session.commit()
            except Exception:
                await session.rollback()
                log.exception("daily job failed for ranch %s", ranch_id)
    log.info("daily job for %s: %d of %d ranches", today, len(runs), len(ranch_ids))
    return runs


def start_scheduler(sessionmaker: async_sessionmaker[AsyncSession]) -> AsyncIOScheduler:
    """Run `run_all` every day at 05:00 ranch time, in the running event loop."""
    scheduler = AsyncIOScheduler(timezone=RANCH_TIMEZONE)
    scheduler.add_job(
        run_all,
        CronTrigger(hour=RUN_AT_HOUR, minute=0, timezone=RANCH_TIMEZONE),
        args=[sessionmaker],
        id="daily-alerts",
        coalesce=True,  # One run after downtime, not one per missed day.
        max_instances=1,
        misfire_grace_time=6 * 3600,
        replace_existing=True,
    )
    scheduler.start()
    return scheduler


async def _main(today: dt.date | None) -> None:
    from smartbell.db import make_engine, make_sessionmaker
    from smartbell.settings import get_settings

    engine = make_engine(get_settings().database_url)
    try:
        now = None
        if today is not None:
            now = dt.datetime.combine(today, dt.time(RUN_AT_HOUR), tzinfo=RANCH_TIMEZONE)
        for run in await run_all(make_sessionmaker(engine), now):
            print(f"{run.ranch_id} {run.today}: {run.animals} animals, {run.expired} expired")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--today", type=dt.date.fromisoformat, default=None)
    asyncio.run(_main(parser.parse_args().today))
