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

(the space before `/Code` is part of the path). Its Inicio (`src/views/Home.vue`), Historial (`src/views/History.vue`) and Reportes (`src/views/DashResume.vue`) screens are the ancestors of the "v3" designs our specs already reconcile (`docs/design-inventory/v4-reports.md` §3, `alerts-dashboard-reports.md`). The agents who will build `dashboard`, `history`, `kpi-engine`, `reports-overview` and `reports-kpi-detail` cannot see that folder, and the 2019 code is the source for three of the founder's dashboard decisions (2026-11-26).

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
- "Celos a confirmar" card, split into "A revisar hoy" and "Para seguimiento". In `HomeFullCard.vue`, the first is cows with `heatCycle === 1` and the second is those with `heatCycle !== 1`. `mixins/heats.js` counts cycles from the last calving, 21 days ± 3, cycles 1 to 6. The founder decided on 2026-11-26 to keep this split, now in `dashboard.md` Approach §1. Record the 2019 rule as its source.
- "Preñadas" means cows with a `pregDate`, which is the pregnant stock, not diagnosis follow-up. The founder settled this on 2026-11-26: v4's "Seguimiento preñez" follows confirmed pregnant cows toward calving (`dashboard.md` Approach §2). Record the 2019 definition as its source.
- The DEL tile averages DEL over cows whose DEL is not 0. Covered (`v4-reports.md` DEL row). Label it **DEL**, never DIM.
- "Enfermas" filters by disease (9 values, matching ILLNESS). Covered.
- "Vacunas y tratamiento" (Por vacunar / A dar tratamiento): drop, since v4 dropped it from the dashboard.
- "Distribución del hato" donut: Preñadas / Con servicio / Abiertas / Enfermas, with the total in the centre (the `chart.js` centre-text plugin). Its numbers are hardcoded `002`. The founder kept it for web on 2026-11-26 (`dashboard.md` Approach §3), so mark it **covered**.
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
- Re-opening the founder's 2026-11-26 decisions (heat split, Seguimiento preñez, web donut). These are already in `dashboard.md` and `v4-reports.md` §3.

**Grooming notes (2026-11-27, checked against the 2019 code):**
- The 2019 folder is still at the path above, and all 13 named files plus the 14 PNGs exist.
- The DEL tile is labelled "DIM" in 2019 and links to Reportes; the note labels it DEL.
- The Preñadas drill-down slider filters by months since `pregDate` (1–5, 30-day months), although its header reads "Fecha parto estimada". It is not an expected-calving range. The v3 "Siguientes partos entre" filter stays the target.
- The donut's data is dummy (`[10, 20, 30, 50]`, centre text `'05'`), not only the `002` legend counts.
- Reportes "Preñez" header counts are Diagnósticos / Esperados (not Confirmados), its first tile is mislabelled "Eficiencia detección de celo" (copy bug, its dialog is Servicios realizados), the Enfermas tiles are spelled "Deshechadas", and the Días/Años toggle sits on both Tiempo entre partos and Edad primer parto.
- History role list maps 1:1 onto our five roles; no role lacks a match. 2019 searches by user, our `history` spec by cow ID.
- The vaccines tile is dropped because the v4 dashboard (v4-reports.md §1.1) has no vaccines row; v4 §6.1 keeps the v3 drill-down designs valid only until redrawn.
- The PNGs are copied under kebab-case names (`<kpi>-trend.png`, `<kpi>-bar.png` or `<kpi>-percent.png`); the note lists the original filenames.

## Effort

S. Docs only: one inventory note, 14 images, and a line added to five specs. The Vue files are long, but the relevant parts are listed above.

## Acceptance

- [x] `docs/design-inventory/legacy-2019-web.md` exists with §1 Inicio, §2 Historial, §3 Reportes and a final "Founder decisions" section linking to `dashboard.md` Approach §1–3. Every element has a covered/gap/drop verdict that cites a spec or inventory row.
- [x] The 14 chart PNGs are in `docs/design-inventory/legacy-2019/graphs/` and every image link in the note resolves (`grep -o 'legacy-2019/graphs/[^)]*' docs/design-inventory/legacy-2019-web.md` lists only files that exist).
- [x] The Inventory lines in `dashboard.md`, `history.md`, `kpi-engine.md`, `reports-overview.md` and `reports-kpi-detail.md` point to the matching section of the note.
- [x] No 2019 source code or Firebase config is in the repo (`git grep -n "smartbell-master\|apiKey" -- docs/ ':!docs/roadmap/capture-the-2019-*'` returns nothing; this spec is excluded because it names the project and the pattern).
- [ ] The "Founder decisions" section gives the heat split, Seguimiento preñez and the web donut, each next to its 2019 definition, and agrees with `dashboard.md` (human).

## Verify

The 2019 folder is outside the repo and could move. If it's gone, ask the founder for the new path before you start.
