---
id: capture-the-2019-web-app-s-home-history-and-report-rules-as-
title: Capture the 2019 web app's home, history and report rules as reference
summary: Record what the recovered 2019 Vue app shows for Inicio, Historial and Reportes (heat watch split, herd distribution, report sections, KPI chart pairs) in a design-inventory note, and point the dashboard, history and report specs at it. Reference only: no 2019 code is ported.
verifiedAt: 2026-11-27
---

# Capture the 2019 web app's home, history and report rules as reference

## Problem

The founder recovered the 2019 Smartbell web app (Vue 2 + Vuetify + Firebase Realtime Database), rebuilt from the public source maps of smartbell.solutions. It lives outside the repo at:

`/Users/juan/Documents/Inversiones/Smartbell/Accelerator Pro /Code - backup/smartbel solutions -2019/smartbell-solutions-2019`

(the space before `/Code` is part of the path). Its Inicio (`src/views/Home.vue`), Historial (`src/views/History.vue`) and Reportes (`src/views/DashResume.vue`) screens are the ancestors of the "v3" designs our specs already reconcile (`docs/design-inventory/v4-reports.md` §3, `alerts-dashboard-reports.md`). The agents who will build `dashboard`, `history`, `kpi-engine`, `reports-overview` and `reports-kpi-detail` cannot see that folder, and two v3→v4 conflicts in `v4-reports.md` §3 are still open. The 2019 code shows how the original app defined them.

## Why

All five of those cards are in Backlog. Recording the evidence once, inside the repo, costs an S now and saves each later worker from re-reading 2,000-line Vue files or guessing at the two open conflicts.

**Planner review (2026-11-26):** nothing in these three screens is worth porting as code:
- The stack is different (Vue 2, Vuetify, Firebase RTDB, against our React and FastAPI with Postgres).
- History and Reportes are static mockups: they render hardcoded rows (`'Elver Muñoz'`, `'Mastitis diagnosticada'`, `65%`, `2/4`, `467`) and hardcoded dates (`31-Oct-19`).
- The live logic in Home is already covered, and done better, by shipped `repro-engine` (heat cycle and window come from settings, not a hardcoded ±3 days from calving).
- The 2019 disease list matches `docs/domain-model.md` ILLNESS exactly.

## What it touches

- New `docs/design-inventory/legacy-2019-web.md`.
- New `docs/design-inventory/legacy-2019/graphs/*.png`: the 14 KPI chart images from the 2019 `src/assets/graphs/` (92 KB in total, real PNGs, not placeholders).
- The **Inventory:** line in `docs/roadmap/dashboard.md`, `history.md`, `kpi-engine.md`, `reports-overview.md` and `reports-kpi-detail.md`: add "2019 reference: `legacy-2019-web.md` §n".
- Read only, from the 2019 folder: `src/views/Home.vue`, `src/components/HomeFullCard.vue`, `HomeMediumCard.vue`, `HomeSmallCard.vue`, `src/views/visualization.vue`, `src/views/chart.js`, `src/mixins/heats.js`, `src/views/History.vue`, `src/views/DashResume.vue`, `src/components/HistoryLargeCard.vue`, `ResumeMediumCard.vue`, `ResumeAdvancedCard.vue`, `src/store/index.js`.

## Approach

Write `legacy-2019-web.md` with one section per screen. For each element, give a verdict: **covered** (name the spec or inventory row that already has it), **gap** (not in any spec yet) or **drop** (and say why). Seed it with the Planner's findings below, then check each one against the code.

**§1 Inicio (Home.vue + HomeFullCard.vue)**
- Header: an "Agregar animal" button, the ranch switcher and a "Vacas en Sistema" counter. Covered by `app-shell-navigation` and `dashboard`.
- "Celos a confirmar" card, split into "A revisar hoy" and "Para seguimiento". In `HomeFullCard.vue`, the first is cows with `heatCycle === 1` and the second is those with `heatCycle !== 1`. `mixins/heats.js` counts cycles from the last calving, 21 days ± 3, cycles 1 to 6. Record this as the 2019 definition for the open **CONFLICTS** row "Celos a confirmar" in `v4-reports.md` §3. Do not settle it: that is a founder call.
- "Preñadas" means cows with a `pregDate`, which is the pregnant stock, not diagnosis follow-up. Record it as evidence for the open "Preñadas → Seguimiento preñez" conflict.
- The DEL tile averages DEL over cows whose DEL is not 0. Covered (`v4-reports.md` DEL row). Label it **DEL**, never DIM.
- "Enfermas" filters by disease (9 values, matching ILLNESS). Covered.
- "Vacunas y tratamiento" (Por vacunar / A dar tratamiento): drop, since v4 dropped it from the dashboard.
- "Distribución del hato" donut: Preñadas / Con servicio / Abiertas / Enfermas, with the total in the centre (the `chart.js` centre-text plugin). Its numbers are hardcoded `002`. This is a **gap**: the `dashboard` spec builds a web layout but says nothing about the donut, and `v4-reports.md` §3 marks it "web only, UNCHANGED". Write down the 2019 categories so the founder can decide whether the web dashboard keeps it.
- Drill-down lists: preñadas filtered by an expected-calving date range, heats by heat day, sick by disease. Covered by `alerts-dashboard-reports.md` filter sheets.
- Counts are zero-padded to three digits (`002`), which matches the v4 counters. Note it for `dashboard`.

**§2 Historial (History.vue)**
- A static mockup. The columns are Usuario / ID Vaca / Tipo / Fecha / Evento, with filters for role (Dueño, Administrador, Médico, Nutriólogo, Técnico de campo), event type (Con Ganado, Con Usuario, Con Dispositivos, De Salud, De Reportes, De Finanzas), a date range, search by user, and page sizes 5/20/30/40.
- Mostly covered by the `history` spec. Drop Dispositivos, Reportes and Finanzas as event types, because those modules don't exist. Drop pagination, because the spec uses infinite scroll grouped by day. Check that our role list maps onto the 2019 roles and note any role that has no match.

**§3 Reportes (DashResume.vue)**
- Tabs Básico / Avanzado. Básico has four sections, and each has a header card (`HistoryLargeCard`) for confirmed vs expected:
  - **Celo**: Eficiencia detección de celo, Celo a 45-60 días postparto.
  - **Preñez**: Servicios realizados, Tasa de concepción de servicio, Servicios por concepción.
  - **Partos**: Tiempo entre partos (Días/Años toggle), Edad primer parto, Días entre parto y primer servicio.
  - **Enfermas** (Tratadas / En espera): Desechadas, Desechadas por fines reproductivos.
- Every KPI comes as a pair of charts: a trend chart plus a bar or percent chart (the 14 PNGs) and an info icon (`Icon_MoreInfo`).
- Avanzado: Finanzas (Ingresos, Egresos, Utilidad bruta, Impuestos), Aretes inventory (Asignados, Por asignar, Con fallas), Genética (árbol genealógico).
- Export icons: XLS and PDF.
- All values are hardcoded. The KPI list is covered by `kpi-engine`. The section grouping and chart pairs are reference for `reports-overview` and `reports-kpi-detail`, but the Figma R frames win wherever they differ. Avanzado is covered as locked tiles. Export is covered by `report-export`.

**Out of scope:**
- Porting any Vue or JS code.
- Copying `src/firebase.js` or any other config. It holds keys for the `smartbell-master` Firebase project: do not put it in the repo.
- Importing 2019 RTDB data.
- Changing any behaviour.
- Settling the two conflicts. Record the evidence and list them under "Open questions for the founder".

## Effort

S. Docs only: one inventory note, 14 images, and a line added to five specs. The Vue files are long, but the relevant parts are listed above.

## Acceptance

- [ ] `docs/design-inventory/legacy-2019-web.md` exists with §1 Inicio, §2 Historial, §3 Reportes and a final "Open questions for the founder". Every element has a covered/gap/drop verdict that cites a spec or inventory row.
- [ ] The 14 chart PNGs are in `docs/design-inventory/legacy-2019/graphs/` and every image link in the note resolves (`grep -o 'legacy-2019/graphs/[^)]*' docs/design-inventory/legacy-2019-web.md` lists only files that exist).
- [ ] The Inventory lines in `dashboard.md`, `history.md`, `kpi-engine.md`, `reports-overview.md` and `reports-kpi-detail.md` point to the matching section of the note.
- [ ] No 2019 source code or Firebase config is in the repo (`git grep -n "smartbell-master\|apiKey" -- docs/` returns nothing).
- [ ] The open questions list the heat watch split, the meaning of "Preñadas" and the web herd-distribution donut, each with the 2019 definition (human).

## Verify

The 2019 folder is outside the repo and could move. If it's gone, ask the founder for the new path before you start.
