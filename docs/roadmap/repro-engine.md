---
id: repro-engine
title: Reproductive engine: state projection and computed dates
summary: Pure-Python module that folds a cow's events into her reproductive state, lactation, DIM, next heat / pregnancy-check / calving / dry-off windows and withdrawal dates, with table-driven tests.
---

# Reproductive engine: state projection and computed dates

## Problem

The product's core value is telling the farmer what each cow needs next; the rules are spread across Figma notes and need one tested implementation.

## Why

Events, alerts, dashboard and reports all read from it; getting it right once avoids divergent date math.

**Depends on:** `core-data-model`.

## What it touches

`app/api/smartbell/domain/repro.py`, `app/api/smartbell/domain/withdrawal.py`, `app/api/tests/domain/test_repro_*.py`, a projection writer `app/api/smartbell/services/projection.py`.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §2–4, §7; event-flows.md §3.3–3.7 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Implement `docs/domain-model.md` §2 (state machine), §3 (rules 3.1–3.14) and §4 (what each event schedules, as a returned list of AlertSpec/ReminderSpec, not DB writes). Signature: `project(animal, events, settings, today) -> Projection`. No I/O in the domain module. All constants come from `RanchSettings`. Windows are ranges (start, end) rendered as "entre los días X al Y". Edge cases to test: heat ⑦ during VWP (allowed + warning flag), return to heat while SERVIDA, negative check, loss classification by days (41/42/259/260), dry-off at −60 d, heifer→cow on first calving, lactation number increments, DIM continues while dry, withdrawal with unknown description = maximum. Reproduce the 7 prototype cows' dates from event-flows.md where consistent with the defaults; document deviations. Also per domain-model.md §7.5: pregnancy re-checks at 90/180 days after a positive diagnosis, a CLOSE_UP ('Reto') at calving − close_up_days, DIET_CHANGE at 120 DIM, and the heat window width from settings (V4 shows 7 days). AUTO development stage derived from age + sex + state.

### Assumptions and decisions (groomed 2026-10-31)

Audit: `core-data-model` shipped everything this card builds on, the projection columns and `RanchSettings` exist, and the named paths are free. `docs/domain-model.md` §7.6 settles the abortion and return-to-heat questions. `history-writer` adds an identical empty `services/__init__.py`.

**Shape of the module**
- **Inputs are dataclasses** (`AnimalFacts`, `EventFact`, `ReproSettings`), not ORM rows, so the domain imports no SQLAlchemy. `services/projection.py` converts and writes. §2's signature gains `animal`, as this card says.
- **Import linting** is `import-linter`, run in CI as `lint-imports`.
- **Alerts and reminders describe what should be open now.** `events-api` treats a pending alert missing from the list as closed; that is how §4's "Alerts closed" column is met. `ReminderKind` is the domain's own (WAIT_NEXT_CYCLE, MILK_WITHDRAWAL, HEIFER_TO_REGISTER): `tasks-engine` maps it to `TaskKind`.
- **The writer leaves `development_stage` and `status` alone.** AUTO must stay AUTO, so `Projection.development_stage` carries the resolved stage, and `status` belongs to whoever records the removal.
- **The seed now ends by running the writer**, so the engine has the last word on the fixture's projection fields. `ALTA` carries the lactations each fixture cow had before the calving recorded for her.
- **Not every constant is in `RanchSettings`** (a conflict with "all constants"): the withdrawal table and the age bands of §3.10, §3.11 and §7.1 are drug and design facts with no setting, so they are named module constants. Everything `RanchSettings` has is read from it. `fresh_cow_dim` duplicates `vwp_days`; §3.2 names the latter, so that is what the engine reads.

**Rules the documents leave open**
- **`heat_window_days` is the total width**, for the heat and calving windows both. An even width stays exact and leans late.
- **A heat "not observed" while SERVIDA is not a return to heat.** §7.6 needs a heat; ① says none happened, so the service stands and the +21 d watch closes. ② to ⑤ and ⑦ are returns.
- **① moves the next heat window but not `last_heat_date`** (event-flows §3.5).
- **A missed window rolls forward a cycle at a time** until it ends today or later ("cada celo perdido hay que esperar 21 días").
- **`expected_calving_date` is set by the positive check**, not by the service: a served cow shows the check window (event-flows §3.4).
- **Anything §2 has no arrow for is flagged `UNEXPECTED_EVENT` and leaves the state alone**, since the fold must be total. The exceptions are facts that happened anyway: a calving always counts, and an abortion while SERVIDA opens her. A negative re-check while GESTANTE or SECA opens her, unflagged.
- **A payload that no longer parses is skipped and flagged `INVALID_EVENT`**, so one bad row can't stop a ranch's daily run. Types the fold ignores aren't parsed at all.
- **`HEAT_DURING_VWP` goes by the dates**, not the state, so a re-service inside the VWP is warned too. ② on an ABIERTA cow has no arrow: it counts as a heat and is flagged.
- **§4 wins over the event-flows §3.4 row:** a served cow gets no "wait a cycle" reminder, only the return-to-heat alert.
- **A cow registered with no lactation number defaults to 1** if her stage is adult, or AUTO/CARGADA/A_VERIFICAR and she was over 27 months at registration. Age is measured at ALTA, so a heifer can't become a cow by ageing. RECIEN_PARIDA declared with no date becomes ABIERTA, flagged.
- **Abortion leaves the lactation unchanged**, so a dry cow stays dry (event-flows marks it unclear).
- **A never-calved heifer follows §2 literally**: ABIERTA after a failed service, SECA at −60 d, but she has no lactation to dry off and gets no DRY_OFF alert or milk reminder. The 18-month stop applies only in state VAQUILLA.
- **`repro_stage_date` by stage:** ABIERTA last heat; SERVIDA service; RECIEN_PARIDA calving; GESTANTE diagnosis (service estimated as date − `preg_check_min_days`); SECA dry-off. A stage needing a date without one is flagged `MISSING_STAGE_DATE`. `AltaPayload` gained `last_calving_date`, which it needed for "Último parto".
- **Unknown withdrawal.** `Treatment.withdrawal_days` was defaulted to 5, so "unknown" could never be stored. It is now nullable: the form still pre-fills 5, and empty resolves by entered value, heat synchronisation (2), topical (0), type table, then the maximum (42). ANTIINFLAMATORIO and QUIRURGICO have no table value, so they get the maximum. `is_sick` is set by ILLNESS and ACCIDENT and cleared by follow-up SUCCESS. The withdrawal date is never shortened, by a later drug or by the cure.
- **AUTO stage bands** close the gaps in v4 §5. Female: TERNERA <6 mo, DESTETADA <12, NOVILLA to 27, then VACA_ADULTA while fresh and VACA_ADULTA_VACIA otherwise; CARGADA and A_VERIFICAR by state. Male: BECERRO <3, DESTETADO <9, NOVILLO <24, TORO from 24.
- **The DIET_CHANGE task stays open** until a diet change is recorded on or after the due date, while she is lactating.
- **Left to their cards:** applying the loss classification to a request (`abortion-flow`, `events-api`; `classify_loss` is here), and the §3.3 DIM buckets (`kpi-engine`).

**Fixture deviations.** The mock's absolute dates are not reproduced: `core-data-model` made the herd relative to the seed day, and event-flows calls its own samples inconsistent. By state and lactation, 00001–00007 match §3.5. 00005 and 00007 are SECA, because a calving due today or in 10 days is past −60 d; 00002 is SECA with calving overdue. 00003's accident now also makes her sick, as §3.5 says; the seed never set it.

## Effort

L.

## Acceptance

- [x] `pytest app/api/tests/domain` passes with ≥40 table cases covering every transition in domain-model §2.
- [x] Projection is deterministic given (events, settings, today) and has no DB/network access (import-linted).
- [x] Changing `gestation_days` in settings changes expected calving in tests.
- [x] Fixture cows 00001–00007 project to the states shown in event-flows.md §3.5 (or deviations listed in the PR).
- [ ] Tests for the new code pass in CI.
