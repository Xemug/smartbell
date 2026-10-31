# Smartbell domain model

Consolidated from `docs/design-inventory/*.md`. Each rule cites the inventory section that quotes the
Figma copy. **Constants marked ⚙ are not stated in the designs**: they are defaults pending the
user's confirmation (`docs/decision-memo-stack.md` §"Also needed") and are stored per ranch in
`RanchSettings`, never hard-coded.

UI copy is Spanish (MX). Code and API names are English; Spanish labels live in i18n files.

## 1. Entities

### Tenancy and access
| Entity | Fields | Notes |
|---|---|---|
| **User** | id, first_name, last_name, phone (E.164, default +52), email (unique), password_hash (min 8), photo_url (JPG/PNG ≤2MB), created_at, last_active_at | One user can belong to many ranches |
| **Ranch** | id, name, address, geo (lat/lng), owner_user_id, plan_id, vaccination_plan_status (pendiente / aprobado), created_at | Switcher on every screen |
| **Membership** (user↔ranch) | user_id, ranch_id, role (DUENO, ADMINISTRADOR, MEDICO, NUTRIOLOGO, TECNICO_CAMPO), permissions (set of codes) | Role presets fill permissions, which can then be customised. Deleting a user keeps their history |
| **Permission** (code enum) | Groups: Ganado, Usuarios, Dispositivos, Salud, Reportes, Finanzas. Codes as in mobile-core.md §Role permission matrix (e.g. `cows.create`, `cows.delete`, `groups.delete`, `users.create`, `alerts.repro.confirm`, `reports.export`, …) | Ships with the role-preset matrix; Dueño has all |
| **NotificationPreference** | user_id, ranch_id, channels ⊆ {IN_APP, EMAIL, WEB_PUSH, MOBILE_PUSH, SMS, WHATSAPP} | At least one channel; SMS and WhatsApp are plan-gated |
| **RanchSettings** | gestation_days ⚙283, heat_cycle_days ⚙21, heat_window_days ⚙±2 (renders as a 4–5 day window), vwp_days 45, preg_check_min_days ⚙35, preg_check_max_days ⚙45, dry_off_days_before_calving 60, fresh_cow_dim 45, abortion_min_days 42, abortion_max_days 260, heifer_heat_alert_from_months 13, heifer_heat_alert_until_months 18, heifer_breeding_unlock_months 12, herd_type (DAIRY / BEEF; beef shows days open instead of DIM) | Seeded with defaults |

### Animals and groups
| Entity | Fields | Notes |
|---|---|---|
| **Animal** | id, ranch_id, kind (VACA, VAQUILLA, TORO), control_id (unique per ranch; letters, digits, ñ, spaces), siniiga (optional, 4–8 digits, unique; 4 digits expand to `MX-00-00-0000-1234`), breed (default HOLSTEIN), birth_date (never in the future), photo_url, group_id, status (ACTIVE, REMOVED), removed_reason, removed_at, created_at | One table with a kind discriminator |
| ↳ cow fields | repro_state (see §2), lactation_state (LACTANDO, SECA), lactation_number, last_calving_date, last_heat_date, last_service_date, service_bull_id, service_number_in_lactation, pregnancy_confirmed_date, expected_calving_date, is_sick, sick_since, milk_withdrawal_until | All repro fields are **derived** from events (§3); stored as a projection for list speed |
| ↳ heifer fields | dam_id, sire_id, birth_length_cm, birth_weight_kg, sex ⚙ (in notes only) | Becomes a VACA automatically on her first calving |
| ↳ bull fields | name (unique per ranch) | Added inline from the heat flow ("Agregar Toro") |
| **Group** (Potrero) | id, ranch_id, name (≤60), description (≤120), type (PRESET, CUSTOM), preset (GENERAL, ALTA_PRODUCCION, SECAS_RETO, RECIEN_PARIDAS, ENFERMAS), selection (AUTO, MANUAL), auto_filter {age, breed, lactation_number}, kpi_indicator (optional: EN_CELO, PRENADAS, ENFERMAS, DIM) | General is the default and receives cows when a group is deleted. Heifer groups (RECIEN_NACIDAS 0–6 mo, EN_DESARROLLO 6–16 mo, SERVIDAS, PRENADAS, ENFERMAS) are computed, not stored |
| Enums | Breed: HOLSTEIN, JERSEY, SIMMENTAL, PARDO_SUIZO, GUERNSEY, AYRSHIRE, SHORTHORN, NORMANDO, OTRA, MIXTA. Removal reason: ERROR_REGISTRO (hard delete), VENTA_RASTRO, VENTA_OTRO_RANCHO, MUERTE | |

### Events (the bitácora): the source of truth
**Event**: id, ranch_id, animal_id, type, occurred_on (date, defaults to today, never in the future),
recorded_by, created_at, description, comments (≤160), payload (JSON, typed per `type`), deletable
(derived from type). Every event writes a HistoryEntry.

| type | Payload | Deletable |
|---|---|---|
| ALTA | initial snapshot | no |
| HEAT | outcome: NOT_OBSERVED ①, VWP ②, NOT_INSEMINATED ③, DIRTY_MEDICATED ④, DIRTY_NOT_MEDICATED ⑤, INSEMINATED ⑦; clean (bool); bull_id and method (IA, MONTA) when ⑦; treatment when ④ | no |
| PREGNANCY_CHECK | method (TACTO, ULTRASONIDO), result (POSITIVE, NEGATIVE), description (required when negative) | no |
| CALVING | timing (ESPERADO, ANTICIPADO, RETRASADO; computed), calf_registered (bool), calf_animal_id | no |
| ABORTION | kind (NATURAL, INDUCIDO), cause (natural: HORMONAL, REABSORCION, NUTRICION, DESCONOCIDO; induced: ACCIDENTE, ENFERMEDAD(+illness), INTOXICACION_NUTRICIONAL, VIRUS, BACTERIA, TRATAMIENTO) | no |
| ILLNESS | illness (MASTITIS, BRUCELOSIS, PULMONIA, CETOSIS, TUBERCULOSIS, COJERA, FIEBRE_AFTOSA, ENVENENAMIENTO, OTRO), treatment, optional diet_change, optional group_change | yes |
| ACCIDENT | description, treatment, optional diet_change and group_change | yes |
| MEDICAL_TREATMENT | kind (SINCRONIZACION_CELO, HORMONAS_CRECIMIENTO, REDUCCION_LECHE, VACUNAS, OTROS), treatment | yes |
| TREATMENT_FOLLOWUP | outcome (SUCCESS, CHANGE), new treatment when CHANGE | yes |
| DIET_CHANGE | reason (ETAPA_REPRODUCTIVA, ENFERMEDAD, TRATAMIENTO, OTRA), diet | yes |
| GROUP_CHANGE | from_group_id, to_group_id | yes |
| VACCINATION | vaccine_id, dose_ml | yes |
| WEIGHT | kg | yes |
| REMOVAL (Baja) | reason | yes (ERROR_REGISTRO hard-deletes the animal) |

**Treatment** (embedded): type (ANTIBIOTICO, ANTISEPTICO, ANTIBACTERIANO, ANTIMICOTICO, QUIRURGICO,
ANTIINFLAMATORIO, CORTICOIDE, ANTIMICROBIANO, ANTIPARASITARIO), corticoid_subtype?, presentation
(TOPICO, ORAL, INYECCION), start_date, duration_days (default 5), withdrawal_days (the form pre-fills 5; left empty, §3.6 applies).

Deleting an event that is not deletable is refused. Deleting without the permission creates a
**DeletionRequest** (event_id, requested_by, status), which goes to an admin.

### Vaccination and development
| Entity | Fields |
|---|---|
| **VaccinationPlan** (per ranch) | first_insemination_weight_kg (330–380), weaning_age_days (60–90), first_deworming_days (90–180), deworming_frequency (6 MESES, ANUAL), colostrum_type (MADRE, CALIFICADO), status (PENDIENTE, APROBADO), version |
| **PlanVaccine** | name (presets: IBR, DVR, CLOSTRIDIOS, DERRIENGUE, + custom), dose_ml (or ml/kg), start_by (AGE_MONTHS, WEIGHT_KG, EVENT: primer celo, primera inseminación, diagnóstico gestación, secado), start_value, frequency (UNICA, REFUERZOS n × every m months, CADA_6_MESES, ANUAL) |

### Alerts, reminders, notifications
| Entity | Fields |
|---|---|
| **Alert** | id, ranch_id, animal_id, kind (HEAT, PREGNANCY_CHECK, CALVING, HEALTH, VACCINE_DUE, TREATMENT_DUE, DRY_OFF), window_start, window_end, status (PENDING, CONFIRMED, NEGATED, EXPIRED), follow_up_day (0..5+), resolved_by, resolved_at, resulting_event_id |
| **Reminder** | id, ranch_id, kind (ONBOARDING_TASK, SICK_FOLLOWUP, MILK_WITHDRAWAL, HEIFER_TO_REGISTER, HEAT_PENDING, VACCINE, BILLING_DUE, USER_MESSAGE), subject refs, due_on, done_at |
| **Notification** | id, user_id, channel, template, vars, sent_at, deep_link, status |
| **HistoryEntry** | id, ranch_id, user_id, category (GANADO, USUARIOS, DISPOSITIVOS, SALUD, REPORTES, FINANZAS, RANCHO), event_key, refs {animal_ids[], group_id, user_ids[]}, rendered from templates in alerts-dashboard-reports.md §3.5 |

### Reports, billing, later modules
- **Report**: computed on demand; nothing stored except **ReportExport** (format PDF/XLS/CSV, period, type).
- **MilkRecord** (later): ranch_id, date, total_liters; feeds the dashboard's "lts/día/vaca" tile.
- **Plan** (later): CRIA ($15 USD, ≤50 cows), DESTETE ($45, ≤150), PRODUCCION ($79, >150); extra user $49 MXN/mo. **Subscription**, **Invoice**, **CancellationReason**. On lapse: free tier, only the first 20 cows editable.
- **Message** (later): from, to, subject, body, thread.
- Avanzados (parked): finance, smart ear tags and devices, genealogy.

## 2. Reproductive state machine (cows and heifers)

`repro_state` ∈ VAQUILLA, RECIEN_PARIDA, ABIERTA, SERVIDA, GESTANTE, SECA (+ REMOVED via status).
Flags running alongside: lactation_state, is_sick, milk_withdrawal_until.

```
VAQUILLA      --HEAT ⑦------------------------------> SERVIDA
VAQUILLA      --HEAT ①②③④⑤--------------------------> VAQUILLA     (next heat window)
RECIEN_PARIDA --HEAT ②/①③④⑤-------------------------> RECIEN_PARIDA (next heat window)
RECIEN_PARIDA --day vwp_days after calving (job)----> ABIERTA
RECIEN_PARIDA --HEAT ⑦------------------------------> SERVIDA      (allowed, warn)
ABIERTA       --HEAT ⑦------------------------------> SERVIDA
ABIERTA       --HEAT ①③④⑤---------------------------> ABIERTA      (next heat window)
SERVIDA       --HEAT (return to heat)----------------> treated as a heat from ABIERTA
SERVIDA       --PREGNANCY_CHECK +--------------------> GESTANTE
SERVIDA       --PREGNANCY_CHECK −--------------------> ABIERTA
GESTANTE      --expected_calving − 60 d (job)--------> SECA         (lactation → SECA)
GESTANTE|SECA --CALVING------------------------------> RECIEN_PARIDA (lactation → LACTANDO, #lact+1, kind VAQUILLA→VACA)
GESTANTE|SECA --ABORTION-----------------------------> ABIERTA     (confirmed 2026-10-31, §7.6)
any           --REMOVAL------------------------------> status REMOVED
```

Implementation rule: the state is a **pure fold over the animal's events plus today's date**
(`repro.project(animal, events, settings, today)`). Deleting or editing an event re-projects; nothing is
mutated by hand. The scheduled job only re-runs the projection for date-driven transitions and emits
alerts.

## 3. Computed dates and rules

| # | Rule | Formula | Source |
|---|---|---|---|
| 3.1 | DIM (days in milk) | today − last_calving_date (keeps counting while dry) | event-flows §3.3 |
| 3.2 | Fresh cow / VWP end | last_calving_date + vwp_days (45) | "Recién paridas (menor a 45 días)", "0-45 días PEV" |
| 3.3 | Next heat window | anchor + heat_cycle_days ± heat_window_days, where anchor = last heat, or calving, or negative check, or abortion. Post-calving expected heats fall in the 45-70 / 70-90 / 90-110 / 110-130 DIM buckets | "cada celo perdido hay que esperar 21 días" |
| 3.4 | Pregnancy-check window | service_date + [preg_check_min_days, preg_check_max_days] ⚙ | not in design |
| 3.5 | Expected calving window | service_date + gestation_days ± heat_window_days ⚙ | not in design (mock inconsistent) |
| 3.6 | Milk withdrawal until | treatment start + duration_days + withdrawal_days. Defaults by type: corticoide 21, antibiótico 10, antiséptico 3, antibacteriano 3, antimicrobiano 42, antiparasitario 42, antimicótico 3, sincronización 2, tópico 0, quirúrgico = user-entered; unknown = maximum | withdrawal note |
| 3.7 | Dry-off date | expected_calving − 60 d | "Secas (60 días antes de parto)" |
| 3.8 | Calving timing | before the window = ANTICIPADO, inside = ESPERADO, after = RETRASADO | calving copy |
| 3.9 | Loss classification | days since service: <42 early embryonic death (logged as a negative check), 42–259 ABORTION, ≥260 CALVING (ANTICIPADO) | abortion note |
| 3.10 | Heifer stages | age <6 mo RECIEN_NACIDA, 6–16 mo EN_DESARROLLO; heat alerts from 13 mo; the breeding button unlocks at 12 mo; last heat alert at 18 mo | note 2018:907744 |
| 3.11 | Age validation | heifer birth date ≤ 24 mo old when edited; > 30 mo with no service = warn "no ha sido fértil"; cow last calving ≥ birth + 22 mo (660 d) | web-onboarding §3 |
| 3.12 | Days open | conception date (or today) − last_calving_date | reports KPI |
| 3.13 | Sick days | today − sick_since | banner "lleva N días enferma" |
| 3.14 | Milk-separation alert | every ILLNESS; ACCIDENT and MEDICAL_TREATMENT only when withdrawal_days > 0 | separation note |

## 4. What each event schedules

| Event | Alerts and reminders created | Alerts closed |
|---|---|---|
| ALTA (cow) | the projection's next window (heat, check or calving) from the onboarding stage and dates | none |
| HEAT ①–⑤ | HEAT alert at the next window; reminder "Esperar al siguiente ciclo"; ④ also MILK_WITHDRAWAL | the current HEAT alert |
| HEAT ⑦ | PREGNANCY_CHECK alert; HEAT alert at +21 d to watch for a return to heat | HEAT |
| PREGNANCY_CHECK + | CALVING alert (window), DRY_OFF at −60 d | PREGNANCY_CHECK, return-to-heat HEAT |
| PREGNANCY_CHECK − | HEAT alert at the next window | PREGNANCY_CHECK |
| CALVING | HEAT alert (post-calving), HEIFER_TO_REGISTER reminder if the calf was skipped | CALVING, DRY_OFF |
| ABORTION | HEAT alert at the next window | CALVING, DRY_OFF |
| ILLNESS / ACCIDENT / MEDICAL_TREATMENT | HEALTH alert until withdrawal ends; MILK_WITHDRAWAL reminder (days remaining); auto-move to the ENFERMAS group for ILLNESS | none |
| TREATMENT_FOLLOWUP SUCCESS | none | HEALTH; restores the previous group ⚙ |
| VaccinationPlan approved | VACCINE_DUE per animal per vaccine schedule | none |

Alert follow-up: a HEAT alert left unconfirmed moves through follow_up_day 0→5+ ("Hoy, Hace 1 día …
Hace 5+ días"), then EXPIRED ("Sistema ya no envía alertas").

## 5. KPIs (reports)
Formulas are in `design-inventory/alerts-dashboard-reports.md` §3.4. All are computed from Events
and Animals over a period, filtered by ranch, period and animal category. They are implemented as
one service module, `reports/kpis`, with a test per KPI on a fixture herd.

## 6. Open domain questions (also in the memo)
1. The ⚙ constants: gestation, cycle, check window.
2. The state after an abortion.
3. Return-to-heat while SERVIDA.
4. Reproductive events marked non-deletable, yet their cards show Editar/Eliminar. Proposal: editable by admins, never deletable.
5. Calf sex appears in the notes but has no field.
6. No dry-off event screen; the backlog assumes an automatic transition.
7. The permission matrix oddities (Médico, Técnico).
8. No snooze or dismiss on alerts.

## 7. Changes from Smartbell 4.0, the UI Kit and the shipped app (2026-10-29)

Source: `docs/reconciliation-v4.md`. Where this section conflicts with §1–§6, **this section wins**.

### 7.1 Animal (replaces the kind-first model)
| Field | Change |
|---|---|
| sex | NEW: MACHO, HEMBRA. This is the primary toggle on the unified form |
| kind | DERIVED: VACA = female that has calved; VAQUILLA = female that has not calved; TORO = male stage TORO; other males are BECERRO/NOVILLO. Kept for list tabs and filters |
| name_or_control_id | One required field, "Nombre o Número interno" (unique per ranch). Bulls may still have a separate name |
| birth_date | Required (the only other required field) |
| development_stage | NEW, with AUTO. Female: TERNERA, DESTETADA, NOVILLA, CARGADA, VACA_ADULTA, VACA_ADULTA_VACIA, A_VERIFICAR. Male: BECERRO, DESTETADO, NOVILLO, TORO. AUTO derives it from age + sex + projection (bands in v4-animal-registration-profile.md §3.3) |
| breed + crossbreed_level + contributing_breed | NEW. Levels FB 100%, F4 15/16, F3 7/8, F2 3/4, F1 1/2. contributing_breed is required when the level ≠ FB. Breed MIXTA is dropped |
| repro_stage (input) + repro_stage_date | One generic date for the declared stage replaces the stage-specific dates. It seeds the projection (§2) |
| lactation_number | Default 1 for adult females |
| weights | weight_birth_kg, weight_weaning_kg, weight_one_year_kg, plus WEIGHT events |
| dam_id, sire_id | On every animal. A parent can be created inline. When a heifer is registered, the dam's status is asked (VIVA, MUERTA_DESECHO, VENDIDA_OTRO_RANCHO, VENDIDA_RASTRO), and a non-alive answer writes a REMOVAL on the dam |

### 7.2 Task (new; replaces Reminder; the surface for Alert)
`Task`: id, ranch_id, source (MANUAL, AUTOMATIC, SYSTEM, PROMO), kind, title, due_date, frequency
(ONCE, DAILY, WEEKLY, MONTHLY; only DAILY is drawn), category (CAMBIO_POTRERO, DIETA, REPRODUCCION, SALUD,
OTRA; from the shipped app), animal_id?, assignee_user_id?, notes, status (OPEN, DONE, DELETED),
completed_by, completed_at, linked_event_id, alert_id?, completion_rule.

- **Automatic kinds** come from the repro engine (§4 alerts) plus the new rules in §7.5: ONBOARDING_TUTORIAL, REGISTER_ANIMALS, BUY_PLAN (promo), FIRST_EVENT, HEAT_OBSERVE, INSEMINATE, PREG_CONFIRM (diagnosis / 90 d / 180 d), DRY_OFF, CLOSE_UP, CALVING_OBSERVE, LAST_CALVING_CONFIRM, HEALTH_FOLLOWUP, DIET_CHANGE, MILK_WITHDRAWAL, HEIFER_TO_REGISTER, VACCINE_DUE.
- **Display order within a day:** register animals > health > reproduction (heat, pregnancy, dry-off, close-up, calving) > user-created > recurring > marketing.
- Completing an automatic task records its event (for example HEAT) or marks it negated ("No entró"). The underlying Alert closes with it.

### 7.3 Milk
`MilkHerdLog`: ranch_id, date (one per day; re-entering overwrites it), total_liters, entered_by.
`MilkCowLog`: animal_id, date, liters, destination (TANQUE, BECERRAS, ANTIBIOTICOS).
Derived values: liters per cow per day = herd total ÷ lactating cows; per-cow average and peak day (DIM + liters); aggregates by week (Monday start), month, quarter, semester and year. Antibiotic-destination litres should match cows within `milk_withdrawal_until`; a mismatch is shown as a warning.

### 7.4 Diet
The DIET_CHANGE payload adds diet_type, daily_kg and daily_cost. The profile shows the current diet as the latest change.

### 7.5 New settings and rules (⚙ = unconfirmed)
- `diet_change_dim` = 120: automatic DIET_CHANGE task.
- `preg_recheck_days` = [90, 180] ⚙: PREG_CONFIRM re-checks after a positive diagnosis.
- `close_up_days_before_calving` = 21 ⚙: CLOSE_UP ("Reto") task and the move to the close-up group.
- `heat_window_days`: the V4 profile shows a 7-day window ("entre los días 12 al 18") ⚙. The 4–5 day windows of §3.3 need a decision.
- `value_per_registered_cow_mxn` = 2,100 drives the home banner (registered × value; declared × value).
- Ranch: auto-created at sign-up ⚙ ("Mi rancho", editable).
- Membership: one basic plan ⚙ (pricing open, see the reconciliation §4.5).

### 7.6 Confirmed by the user (2026-10-29)
The ⚙ defaults in §1 and §7.5 are confirmed and become seeded defaults:
- gestation 283 d, heat cycle 21 d, heat window 7 d, pregnancy check 35–45 d, re-checks at 90/180 d, close-up 21 d before calving;
- tasks are the only alert surface;
- the ranch is auto-created at sign-up;
- pricing comes from the RevenueCat store products.

Confirmed by the user (2026-10-31):
- **State after an abortion:** ABIERTA, ready to be bred again. The web mock's RECIEN_PARIDA is dropped.
- **Return to heat while SERVIDA:** the service failed. The cow goes back to ABIERTA and her pending pregnancy check and expected calving dates are cancelled. The heat is then handled as a heat from ABIERTA (§2): if a service is recorded on it, she becomes SERVIDA again with new dates.

Still open: the permission-matrix oddities (§6).
