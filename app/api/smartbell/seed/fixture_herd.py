"""The fixture herd: the 7 prototype cows of event-flows.md plus 31 more.

    uv run python -m smartbell.seed.fixture_herd [--today YYYY-MM-DD]

Dates are relative to `today`, so each prototype cow sits at the start of its flow whenever the
herd is seeded. The builders below keep the projection fields in memory because the alerts, tasks
and milk logs they write depend on them; the last step re-runs the repro engine, which has the final
word on those fields. Seeding twice changes nothing.
"""

import argparse
import asyncio
import datetime as dt
import uuid
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import make_engine, make_sessionmaker
from smartbell.enums import (
    AbortionCause,
    AbortionKind,
    AlertKind,
    AnimalStatus,
    Breed,
    CalvingTiming,
    CrossbreedLevel,
    DevelopmentStage,
    DietChangeReason,
    DrugPresentation,
    EventType,
    GroupPreset,
    GroupType,
    HeatOutcome,
    Illness,
    LactationState,
    MedicalTreatmentKind,
    MilkDestination,
    PregnancyCheckMethod,
    PregnancyCheckResult,
    RemovalReason,
    ReproState,
    Role,
    ServiceMethod,
    Sex,
    TaskCategory,
    TaskKind,
    TaskSource,
    TreatmentFollowupOutcome,
    TreatmentType,
    VaccinationPlanStatus,
    VaccineFrequency,
    VaccineStartBy,
)
from smartbell.models import (
    Alert,
    Animal,
    Event,
    Group,
    Membership,
    MilkCowLog,
    MilkHerdLog,
    PlanVaccine,
    Ranch,
    RanchSettings,
    Task,
    User,
    VaccinationPlan,
    derive_kind,
)
from smartbell.services.projection import reproject_ranch
from smartbell.settings import get_settings

OWNER_EMAIL = "dueno@fixture.smartbell.test"
GROUP_NAMES = {
    GroupPreset.GENERAL: "General",
    GroupPreset.ALTA_PRODUCCION: "Alta producción",
    GroupPreset.SECAS_RETO: "Secas o reto",
    GroupPreset.RECIEN_PARIDAS: "Recién paridas",
    GroupPreset.ENFERMAS: "Enfermas",
}


@dataclass
class Herd:
    """Builds animals, their events and open work in memory; `save` writes them in FK order."""

    today: dt.date
    settings: RanchSettings
    owner_id: uuid.UUID
    groups: dict[GroupPreset, Group]
    vaccine_id: uuid.UUID
    bulls: list[Animal] = field(default_factory=list)
    calves: list[Animal] = field(default_factory=list)
    females: list[Animal] = field(default_factory=list)
    events: list[Event] = field(default_factory=list)
    alerts: list[Alert] = field(default_factory=list)
    tasks: list[Task] = field(default_factory=list)
    milk: list[MilkCowLog | MilkHerdLog] = field(default_factory=list)
    next_control: int = 1

    @property
    def ranch_id(self) -> uuid.UUID:
        return self.settings.ranch_id

    @property
    def window_side(self) -> int:
        return self.settings.heat_window_days // 2

    def ago(self, days: int) -> dt.date:
        return self.today - dt.timedelta(days=days)

    def animal(
        self,
        sex: Sex,
        stage: DevelopmentStage,
        age_days: int,
        *,
        has_calved: bool = False,
        group: GroupPreset = GroupPreset.GENERAL,
        control_id: str | None = None,
        **fields: Any,
    ) -> Animal:
        if control_id is None:
            control_id = f"{self.next_control:05d}"
            self.next_control += 1
        animal = Animal(
            id=uuid.uuid4(),
            ranch_id=self.ranch_id,
            sex=sex,
            kind=derive_kind(sex, stage, has_calved=has_calved),
            control_id=control_id,
            birth_date=self.ago(age_days),
            development_stage=stage,
            group_id=self.groups[group].id,
            **fields,
        )
        self.record(
            animal,
            EventType.ALTA,
            animal.birth_date,
            control_id=control_id,
            sex=sex,
            birth_date=animal.birth_date.isoformat(),
            breed=animal.breed or Breed.HOLSTEIN,
            development_stage=stage,
        )
        return animal

    def cow(self, age_days: int = 1500, **fields: Any) -> Animal:
        cow = self.animal(
            Sex.HEMBRA, DevelopmentStage.VACA_ADULTA, age_days, has_calved=True, **fields
        )
        self.females.append(cow)
        return cow

    def record(self, animal: Animal, event_type: EventType, on: dt.date, **payload: Any) -> None:
        self.events.append(
            Event(
                ranch_id=self.ranch_id,
                animal_id=animal.id,
                type=event_type,
                occurred_on=on,
                recorded_by=self.owner_id,
                payload=payload,
            )
        )

    def calved(self, cow: Animal, days_ago: int, *, lactation: int) -> None:
        on = self.ago(days_ago)
        alta = next(
            event
            for event in self.events
            if event.animal_id == cow.id and event.type is EventType.ALTA
        )
        alta.payload |= {"lactation_number": lactation - 1}  # What she had already calved.
        self.record(
            cow, EventType.CALVING, on, timing=CalvingTiming.ESPERADO, calf_registered=False
        )
        cow.last_calving_date = on
        cow.lactation_number = lactation
        cow.lactation_state = LactationState.LACTANDO
        fresh = days_ago < self.settings.vwp_days
        cow.repro_state = ReproState.RECIEN_PARIDA if fresh else ReproState.ABIERTA

    def link_calf(self, dam: Animal, calf: Animal) -> None:
        calving = next(
            event
            for event in self.events
            if event.animal_id == dam.id and event.type is EventType.CALVING
        )
        calving.payload |= {"calf_registered": True, "calf_animal_id": str(calf.id)}

    def served(self, cow: Animal, days_ago: int, *, bull: Animal) -> dt.date:
        on = self.ago(days_ago)
        self.record(
            cow,
            EventType.HEAT,
            on,
            outcome=HeatOutcome.INSEMINATED,
            clean=True,
            bull_id=str(bull.id),
            method=ServiceMethod.IA,
        )
        cow.last_heat_date = cow.last_service_date = on
        cow.service_bull_id = bull.id
        cow.service_number_in_lactation = 1
        cow.repro_state = ReproState.SERVIDA
        cow.development_stage = DevelopmentStage.A_VERIFICAR
        check_start = on + dt.timedelta(days=self.settings.preg_check_min_days)
        check_end = on + dt.timedelta(days=self.settings.preg_check_max_days)
        if check_end >= self.today:
            self.work(
                cow,
                AlertKind.PREGNANCY_CHECK,
                check_start,
                check_end,
                TaskKind.PREG_CONFIRM,
                TaskCategory.REPRODUCCION,
            )
        return on

    def confirmed(self, cow: Animal, service_on: dt.date) -> None:
        on = service_on + dt.timedelta(days=40)
        self.record(
            cow,
            EventType.PREGNANCY_CHECK,
            on,
            method=PregnancyCheckMethod.ULTRASONIDO,
            result=PregnancyCheckResult.POSITIVE,
        )
        expected = service_on + dt.timedelta(days=self.settings.gestation_days)
        cow.pregnancy_confirmed_date = on
        cow.expected_calving_date = expected
        cow.development_stage = DevelopmentStage.CARGADA
        dry_off = expected - dt.timedelta(days=self.settings.dry_off_days_before_calving)
        if self.today >= dry_off:
            cow.repro_state = ReproState.SECA
            cow.lactation_state = LactationState.SECA
            cow.group_id = self.groups[GroupPreset.SECAS_RETO].id
        else:
            cow.repro_state = ReproState.GESTANTE
            self.work(
                cow,
                AlertKind.DRY_OFF,
                dry_off,
                dry_off,
                TaskKind.DRY_OFF,
                TaskCategory.REPRODUCCION,
            )
        self.work(
            cow,
            AlertKind.CALVING,
            expected - dt.timedelta(days=self.window_side),
            expected + dt.timedelta(days=self.window_side),
            TaskKind.CALVING_OBSERVE,
            TaskCategory.REPRODUCCION,
        )

    def heat_due(self, cow: Animal, days_since_heat: int, outcome: HeatOutcome) -> None:
        """A heat that didn't end in service, and the next window that it opens."""
        on = self.ago(days_since_heat)
        clean = {
            HeatOutcome.NOT_OBSERVED: None,
            HeatOutcome.DIRTY_NOT_MEDICATED: False,
        }.get(outcome, True)
        self.record(cow, EventType.HEAT, on, outcome=outcome, clean=clean)
        if outcome is not HeatOutcome.NOT_OBSERVED:
            cow.last_heat_date = on
        center = on + dt.timedelta(days=self.settings.heat_cycle_days)
        self.work(
            cow,
            AlertKind.HEAT,
            center - dt.timedelta(days=self.window_side),
            center + dt.timedelta(days=self.window_side),
            TaskKind.HEAT_OBSERVE,
            TaskCategory.REPRODUCCION,
        )

    def work(
        self,
        animal: Animal,
        kind: AlertKind,
        start: dt.date,
        end: dt.date,
        task_kind: TaskKind,
        category: TaskCategory,
    ) -> None:
        alert = Alert(
            id=uuid.uuid4(),
            ranch_id=self.ranch_id,
            animal_id=animal.id,
            kind=kind,
            window_start=start,
            window_end=end,
        )
        self.alerts.append(alert)
        self.tasks.append(
            Task(
                ranch_id=self.ranch_id,
                source=TaskSource.AUTOMATIC,
                kind=task_kind,
                title=f"{task_kind.value} {animal.control_id}",
                due_date=start,
                category=category,
                animal_id=animal.id,
                alert_id=alert.id,
            )
        )

    def treatment(self, days_ago: int, kind: TreatmentType, **fields: Any) -> dict[str, Any]:
        return {
            "type": kind,
            "presentation": DrugPresentation.INYECCION,
            "start_date": self.ago(days_ago).isoformat(),
            "withdrawal_days": 5,
            **fields,
        }

    def group_move(self, animal: Animal, to: GroupPreset) -> dict[str, str]:
        move = {"from_group_id": str(animal.group_id), "to_group_id": str(self.groups[to].id)}
        animal.group_id = self.groups[to].id
        return move

    async def save(self, session: AsyncSession) -> None:
        # The models declare no relationships, so the flush order is the FK order, by hand:
        # bulls before the animals they sired, dams before their calves.
        for batch in (self.bulls, self.females, self.calves, self.events, self.alerts, self.tasks):
            session.add_all(batch)
            await session.flush()
        session.add_all(self.milk)
        await session.flush()


def prototype_cows(herd: Herd, bull: Animal) -> None:
    """00001-00007, each at the start of the scenario event-flows.md gives it."""
    gestation = herd.settings.gestation_days

    sick = herd.cow()  # 00001: illness, then removal or a stall change.
    herd.calved(sick, 60, lactation=2)
    herd.record(
        sick,
        EventType.ILLNESS,
        herd.ago(5),
        illness=Illness.MASTITIS,
        treatment=herd.treatment(5, TreatmentType.ANTIBIOTICO),
        group_change=herd.group_move(sick, GroupPreset.ENFERMAS),
    )
    sick.is_sick = True
    sick.sick_since = herd.ago(5)
    sick.milk_withdrawal_until = herd.ago(5) + dt.timedelta(days=10)
    herd.work(
        sick,
        AlertKind.HEALTH,
        herd.ago(5),
        sick.milk_withdrawal_until,
        TaskKind.MILK_WITHDRAWAL,
        TaskCategory.SALUD,
    )

    delayed = herd.cow()  # 00002: the expected calving has already passed.
    herd.calved(delayed, 392, lactation=3)
    herd.confirmed(delayed, herd.served(delayed, gestation + 7, bull=bull))

    accidents = herd.cow()  # 00003: diet change, accident, medical treatment.
    herd.calved(accidents, 150, lactation=2)
    herd.record(
        accidents,
        EventType.ACCIDENT,
        herd.ago(20),
        description="Se cayó en un hoyo la vaca",
        treatment=herd.treatment(20, TreatmentType.ANTIINFLAMATORIO),
    )
    herd.record(
        accidents,
        EventType.MEDICAL_TREATMENT,
        herd.ago(15),
        kind=MedicalTreatmentKind.OTROS,
        treatment=herd.treatment(15, TreatmentType.ANTIPARASITARIO, withdrawal_days=0),
    )
    herd.record(
        accidents,
        EventType.DIET_CHANGE,
        herd.ago(10),
        reason=DietChangeReason.ETAPA_REPRODUCTIVA,
        diet="Materia seca alta en fibra",
        diet_type="Materia Seca",
        daily_kg=22.5,
        daily_cost=118.0,
    )

    heat = herd.cow()  # 00004: inside the heat window, the full cycle is ahead of her.
    herd.calved(heat, 110, lactation=2)
    herd.heat_due(heat, herd.settings.heat_cycle_days, HeatOutcome.NOT_INSEMINATED)

    on_time = herd.cow()  # 00005: the calving is due today.
    herd.calved(on_time, 385, lactation=3)
    herd.confirmed(on_time, herd.served(on_time, gestation, bull=bull))

    pregnancy = herd.cow(breed=Breed.SIMMENTAL)  # 00006: inside the pregnancy-check window.
    herd.calved(pregnancy, 140, lactation=2)
    herd.served(pregnancy, 40, bull=bull)

    early = herd.cow()  # 00007: the calving is 10 days out, before its window.
    herd.calved(early, 402, lactation=3)
    herd.confirmed(early, herd.served(early, gestation - 10, bull=bull))


def male_stock(herd: Herd) -> None:
    for months in (10, 14, 20):
        herd.calves.append(herd.animal(Sex.MACHO, DevelopmentStage.NOVILLO, months * 30))
    herd.calves.append(herd.animal(Sex.MACHO, DevelopmentStage.BECERRO, 45))


def young_stock(herd: Herd, bull: Animal) -> None:
    # Prototype cows that calved within a calf's first 6 months, with a weight history.
    dams = [cow for cow in herd.females if cow.control_id in ("00001", "00003", "00004", "00006")]
    for index, dam in enumerate(dams):
        assert dam.last_calving_date is not None  # noqa: S101 - calved() ran for all of them
        calf = herd.animal(
            Sex.HEMBRA,
            DevelopmentStage.TERNERA,
            (herd.today - dam.last_calving_date).days,
            dam_id=dam.id,
            sire_id=bull.id,
            birth_length_cm=Decimal(78),
            weight_birth_kg=Decimal(38),
        )
        herd.calves.append(calf)
        herd.link_calf(dam, calf)
        herd.record(calf, EventType.WEIGHT, herd.ago(14), kg=75 + index * 12)
    for months in (7, 8):
        calf = herd.animal(Sex.HEMBRA, DevelopmentStage.DESTETADA, months * 30)
        calf.weight_weaning_kg = Decimal(95)
        herd.calves.append(calf)
        herd.record(
            calf, EventType.VACCINATION, herd.ago(30), vaccine_id=str(herd.vaccine_id), dose_ml=2.0
        )
    for months in (13, 15):  # Open heifers in the breeding months.
        heifer = herd.animal(
            Sex.HEMBRA,
            DevelopmentStage.NOVILLA,
            months * 30,
            breed=Breed.JERSEY,
            crossbreed_level=CrossbreedLevel.F1,
            contributing_breed=Breed.HOLSTEIN,
            repro_state=ReproState.VAQUILLA,
        )
        heifer.weight_one_year_kg = Decimal(290)
        herd.calves.append(heifer)
        herd.heat_due(heifer, 18 + months % 4, HeatOutcome.NOT_OBSERVED)
    served = herd.animal(
        Sex.HEMBRA, DevelopmentStage.NOVILLA, 17 * 30, repro_state=ReproState.VAQUILLA
    )
    herd.calves.append(served)
    herd.served(served, 20, bull=bull)


def milking_herd(herd: Herd, bulls: list[Animal]) -> None:
    """Fifteen cows spread over the rest of the cycle, one twist per cow."""
    bull = bulls[1]

    fresh = herd.cow(group=GroupPreset.RECIEN_PARIDAS)
    herd.calved(fresh, 12, lactation=1)
    fresher = herd.cow(group=GroupPreset.RECIEN_PARIDAS)
    herd.calved(fresher, 30, lactation=4)
    herd.heat_due(fresher, 9, HeatOutcome.VWP)

    open_cow = herd.cow(group=GroupPreset.ALTA_PRODUCCION)
    herd.calved(open_cow, 75, lactation=2)
    herd.heat_due(open_cow, 18, HeatOutcome.DIRTY_NOT_MEDICATED)

    for days_since_calving, days_since_heat in ((85, 21), (125, 20), (160, 22)):
        waiting = herd.cow()
        herd.calved(waiting, days_since_calving, lactation=2)
        herd.heat_due(waiting, days_since_heat, HeatOutcome.NOT_INSEMINATED)

    medicated = herd.cow()
    herd.calved(medicated, 95, lactation=3)
    herd.record(
        medicated,
        EventType.HEAT,
        herd.ago(4),
        outcome=HeatOutcome.DIRTY_MEDICATED,
        clean=False,
        treatment=herd.treatment(4, TreatmentType.ANTISEPTICO, withdrawal_days=3),
    )
    medicated.last_heat_date = herd.ago(4)
    medicated.milk_withdrawal_until = herd.ago(4) + dt.timedelta(days=8)

    negative = herd.cow()
    herd.calved(negative, 170, lactation=2)
    herd.served(negative, 46, bull=bull)
    herd.record(
        negative,
        EventType.PREGNANCY_CHECK,
        herd.ago(3),
        method=PregnancyCheckMethod.TACTO,
        result=PregnancyCheckResult.NEGATIVE,
        description="Se diagnosticó por tacto que no se logró la concepción",
    )
    negative.repro_state = ReproState.ABIERTA
    negative.development_stage = DevelopmentStage.VACA_ADULTA_VACIA

    aborted = herd.cow()
    herd.calved(aborted, 250, lactation=2)
    service_on = herd.served(aborted, 145, bull=bull)
    herd.record(
        aborted,
        EventType.PREGNANCY_CHECK,
        service_on + dt.timedelta(days=40),
        method=PregnancyCheckMethod.TACTO,
        result=PregnancyCheckResult.POSITIVE,
    )
    herd.record(
        aborted,
        EventType.ABORTION,
        herd.ago(25),
        kind=AbortionKind.NATURAL,
        cause=AbortionCause.DESCONOCIDO,
    )
    aborted.repro_state = ReproState.ABIERTA
    aborted.development_stage = DevelopmentStage.VACA_ADULTA_VACIA

    recovered = herd.cow()
    herd.calved(recovered, 130, lactation=3)
    herd.record(
        recovered,
        EventType.ILLNESS,
        herd.ago(40),
        illness=Illness.COJERA,
        treatment=herd.treatment(40, TreatmentType.ANTIINFLAMATORIO),
    )
    herd.record(
        recovered,
        EventType.TREATMENT_FOLLOWUP,
        herd.ago(30),
        outcome=TreatmentFollowupOutcome.SUCCESS,
    )

    for days_since_service, lactation in ((55, 1), (120, 2), (170, 3)):
        pregnant = herd.cow()
        herd.calved(pregnant, days_since_service + 85, lactation=lactation)
        herd.confirmed(pregnant, herd.served(pregnant, days_since_service, bull=bull))

    moved = herd.cow()
    herd.calved(moved, 200, lactation=2)
    herd.confirmed(moved, herd.served(moved, 150, bull=bulls[2]))
    herd.record(
        moved,
        EventType.GROUP_CHANGE,
        herd.ago(2),
        **herd.group_move(moved, GroupPreset.ALTA_PRODUCCION),
    )

    sold = herd.cow(status=AnimalStatus.REMOVED, removed_reason=RemovalReason.VENTA_RASTRO)
    sold.removed_at = dt.datetime.combine(herd.ago(6), dt.time(12), dt.UTC)
    herd.calved(sold, 500, lactation=5)
    herd.record(sold, EventType.REMOVAL, herd.ago(6), reason=RemovalReason.VENTA_RASTRO)


def milk_logs(herd: Herd) -> None:
    milking = [
        cow
        for cow in herd.females
        if cow.lactation_state is LactationState.LACTANDO and cow.status is not AnimalStatus.REMOVED
    ]
    for days_ago in range(14):
        on = herd.ago(days_ago)
        liters = Decimal(len(milking) * 24 + days_ago % 3 * 5)
        herd.milk.append(
            MilkHerdLog(
                ranch_id=herd.ranch_id, date=on, total_liters=liters, entered_by=herd.owner_id
            )
        )
        for cow in milking[:6]:
            if cow.last_calving_date is None or on < cow.last_calving_date:
                continue
            until = cow.milk_withdrawal_until
            withheld = until is not None and herd.ago(5) <= on <= until
            herd.milk.append(
                MilkCowLog(
                    ranch_id=herd.ranch_id,
                    animal_id=cow.id,
                    date=on,
                    liters=Decimal(24),
                    destination=(
                        MilkDestination.ANTIBIOTICOS if withheld else MilkDestination.TANQUE
                    ),
                )
            )


async def seed_fixture_herd(session: AsyncSession, today: dt.date) -> bool:
    """Create the fixture ranch in `session`. Returns False if it was already there."""
    owner_id = await session.scalar(select(User.id).where(User.email == OWNER_EMAIL))
    if owner_id is not None:
        return False

    owner = User(id=uuid.uuid4(), first_name="Dueño", last_name="Fixture", email=OWNER_EMAIL)
    session.add(owner)
    await session.flush()
    ranch = Ranch(id=uuid.uuid4(), name="Rancho Fixture", owner_user_id=owner.id)
    session.add(ranch)
    await session.flush()
    # Permissions stay empty until `ranch-tenancy-permissions` defines the codes; Dueño has all.
    settings = RanchSettings(ranch_id=ranch.id)
    session.add_all([settings, Membership(user_id=owner.id, ranch_id=ranch.id, role=Role.DUENO)])
    groups = {
        preset: Group(
            id=uuid.uuid4(), ranch_id=ranch.id, name=name, type=GroupType.PRESET, preset=preset
        )
        for preset, name in GROUP_NAMES.items()
    }
    plan = VaccinationPlan(
        id=uuid.uuid4(), ranch_id=ranch.id, status=VaccinationPlanStatus.APROBADO
    )
    session.add_all([*groups.values(), plan])
    await session.flush()
    vaccine = PlanVaccine(
        id=uuid.uuid4(),
        plan_id=plan.id,
        name="IBR",
        dose_ml=Decimal(2),
        start_by=VaccineStartBy.AGE_MONTHS,
        start_value=Decimal(6),
        frequency=VaccineFrequency.CADA_6_MESES,
    )
    session.add(vaccine)
    await session.flush()

    herd = Herd(today, settings, owner.id, groups, vaccine.id)
    bulls = [
        herd.animal(
            Sex.MACHO,
            DevelopmentStage.TORO,
            1200 + index * 200,
            control_id=f"TORO-{index + 1}",
            name=name,
        )
        for index, name in enumerate(("Emperador", "Relámpago", "Trueno"))
    ]
    herd.bulls.extend(bulls)
    prototype_cows(herd, bulls[0])
    male_stock(herd)
    young_stock(herd, bulls[0])
    milking_herd(herd, bulls)
    milk_logs(herd)
    await herd.save(session)
    await reproject_ranch(session, ranch.id, today)
    await session.flush()
    return True


async def main(today: dt.date) -> None:
    settings = get_settings()
    if settings.env == "prod":
        raise SystemExit("Refusing to seed fixture data with ENV=prod")
    engine = make_engine(settings.database_url)
    try:
        async with make_sessionmaker(engine)() as session, session.begin():
            created = await seed_fixture_herd(session, today)
            animals = await session.scalar(select(func.count()).select_from(Animal))
            events = await session.scalar(select(func.count()).select_from(Event))
    finally:
        await engine.dispose()
    print(f"{'Seeded' if created else 'Already seeded'}: {animals} animals, {events} events")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--today", type=dt.date.fromisoformat, default=dt.date.today())
    asyncio.run(main(parser.parse_args().today))
