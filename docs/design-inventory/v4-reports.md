# Design inventory v4: Reportes page (Smartbell - 4.0)

Source: file **Smartbell - 4.0** `hmrArjwi6iI4cOlPkR5hQD`, page **Reportes** `2989:9570`.
Link format: `https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=<id with - in place of :>`.

Coverage: I read the whole page with one `get_metadata` call (9 top-level nodes, all parsed) and took screenshots of every top-level frame and chart symbol except `Grafica / semanal`. That symbol is visible inside `3269:9429`. `get_design_context` was not needed, because every text layer is readable in the metadata.

**Big picture:** in v4 the page called "Reportes" contains no report screens. It holds a **mobile-only home/dashboard** (`Onboarding_Dashboard`) and a **milk production tracking** feature (herd and per-cow logging plus a history chart). The Básicos/Avanzados report screens, the KPI detail sheets with benchmark gauges, the cow-list drill-downs and the download modal from v3 (see `alerts-dashboard-reports.md` §1.8/1.9) are **missing from this page**. The reconciliation in section 6 marks them as "not present in v4". It does not treat them as dropped by design.

Global chrome on every frame:
- Header `Encabezado`: `Bell_icon` (top left), `Menu Rancho` dropdown "Nombre del Rancho" (ranch selector), `Avatar` with an `Icon_KPI_Event` red badge "4".
- Hidden `Date Picker` (Material 3: month and year dropdowns, calendar grid, Clear / Cancel / OK) sits under the header in every frame. A period selector was considered but is switched off.
- Bottom tab bar `Footer_Mobile`, **new order**: Tareas / Vacas / Grupos / **Reportes** (active) / Ranchos (tasks / cows / groups / reports / ranches). Historial and Alertas are no longer tabs. The bell takes the alerts role, and "Tareas" is new.

---

## 1. Screens

### 1.1 Reportes home: "General" view (Onboarding_Dashboard)
- Link: [`3259:9504`](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3259-9504) `Onboarding_Dashboard` (375×812, mobile)
- Purpose: summary of herd KPIs and to-do counts. It is the landing view of the Reportes tab.
- Content, top to bottom:

| Element | Label (es) | Gloss (en) | Sample | Type |
|---|---|---|---|---|
| Animal counters (`Cow Counter_activated_mobile`, `Calf Counter_deactivated_mobile`, `Bull Counter_deactivated_mobile`) | – | cows / heifers / bulls | 002 (selected) / 000 / 000 | segmented filter + counts |
| KPI card (pink header) | Días Abiertos | days open | 75 | KPI tile, icon `Icon_Pregnated_Cows` |
| KPI card (blue header) | DEL | days in milk (Días En Leche) | 120 | KPI tile, icon `Icono DIM` |
| List row (`Cows in Heat`, `Icon_Cows_Heat`) | Vacas a observar celos | cows to watch for heat | 05 | count row |
| List row (`Icon_Sick_Cows`) | Vacas enfermas | sick cows | 01 | count row |
| List row (`Icon_Pregnated_Cows`, dark navy, highlighted) | Seguimiento preñez | pregnancy follow-up | 06 | count row |
| List row (`Icóno leche`, light blue) | Lts/día promedio por vaca | litres/day average per cow | 16 | KPI row |
| View switcher (bottom, 3 buttons) | General / Expandido / Avanzado | general / expanded / advanced | General active | segmented buttons |

- Actions (inferred, no prototype links in metadata):
  - Animal counter tap: filter all KPIs to that category.
  - Row tap: drill-down list (cows to watch for heat, sick, pregnancy follow-up). Milk row: Milk tracking (1.2).
  - General/Expandido/Avanzado: switches the report depth. **Only "General" is drawn on this page.**
  - Bell: alerts. Avatar: user menu.
- States: populated only. No empty (new ranch), loading or error states. No period shown, so the period is presumably "today / current".
- Navigation: entry is the Reportes tab. Exits: drill-downs (not drawn), milk tracking, other tabs.

### 1.2 Milk tracking: Registro global (herd log + history chart)
- Link: [`3269:9429`](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3269-9429) `Milk tracking globally`
- Purpose: log the herd's total litres for the day and view the production trend.
- Tabs `Pestañas datos`: **Registro global** (active) | Registro individual.
- Section "Historial de producción" (production history):
  - Period dropdown (`Menu Rancho` reused) value "Última semana". Options (1.5): Última semana / Último mes / Último trimestre / Último semestre / Último año.
  - Subtitle "Semana del 3 a {Día}, {mes} del {año}" ("week of the 3rd to {day}, {month} {year}"; the template copy is awkward).
  - Chart instance `Grafica / semanal` (1.4).
- Section "Registro de producción diario del hato" (herd daily production log):
  - Card "Producción de Leche" (milk production): big value **16**, "lts/día promedio por vaca".
  - Field: label "Registra tu producción del día" / placeholder "Litros totales del día" (total litres today) / numeric (litres) / required to submit.
- Primary button "Actualizar producción" (update production). It is drawn pale green, probably the disabled state until the field has a value.
- States: filled chart, empty input. No success, validation or "already logged today" state for the global log.

### 1.3 Milk tracking: Registro individual (per-cow log)
- Links: [`3274:587`](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3274-587) (list, 6 cows, scrolls); [`3274:10634`](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3274-10634) (after save, 3 cows plus success toast)
- Purpose: record each cow's litres for the day.
- Heading: "Registro de producción del día por vaca" (3274:587) / "Registro de producción diario por vaca" (3274:10634). The heading copy is inconsistent between the two frames.
- Repeating card `Producción individual`: title "Producción vaca: {vaca ID}" (cow production: {cow ID}), `Icon_Cow_Adult`, numeric field placeholder "Producción individual en lt" (individual production in litres). Each field is optional, so only filled cows are saved.
- Button "Actualizar producción".
- States:
  - Default: list of all (lactating?) cows.
  - Success: green snackbar `Frame 234` "Felicidades, la vaca producción de la {Vaca ID} quedó registrada exitosamente" (congratulations, the production of cow {ID} was recorded successfully; garbled word order), with a close (x) icon `Top_Nav_LogOut`.
  - After save the list shrinks from 6 to 3. This implies saved cows drop out of today's pending list.
- No validation (non-numeric, outlier) or empty-herd state.

### 1.4 Production history chart: component set
- Symbols:
  - `Grafica / semanal` `3274:10403`: x-axis Lun…Dom (Mon–Sun).
  - `Grafica / mensual` [`3274:10526`](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3274-10526): x-axis Sem 1…Sem 4.
  - `Grafica / trimestral` [`3274:10620`](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3274-10620): x-axis Mar / Abr / May (months).
- Visual: combo chart with **bars** (light lavender, one bar highlighted dark slate: Sab in weekly, Sem 3 in monthly) and a **smoothed teal line with area fill**. Y axis 0–80, ticks every 20, no unit label.
- Implied semantics (not labelled, needs confirmation):
  - Bars = production per bucket (daily, weekly avg or monthly avg). The y range 0–80 fits litres/cow/day better than herd totals.
  - Line = trend or moving average, or the individual-cow overlay.
  - Dark bar = selected bucket, max, or current day.
- **No chart variants exist for Último semestre or Último año**, though the dropdown offers them.

### 1.5 Period dropdown (Menú desplegable)
- Link: [`3271:10833`](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3271-10833)
- Options: Última semana / Último mes / Último trimestre / Último semestre / **Último año** (last option shown highlighted, as hover or selected).
- These are rolling periods ending today. There is no custom date range (unlike v3 "Periodo de reporte").

### 1.6 Milk production KPI + input (component spec)
- Link: [`3633:1096`](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3633-1096) "Milk Productio KPI and input field update" (348×272)
- Standalone redesign of the card in 1.2: KPI block "Producción de Leche · 16 lts/día promedio por vaca", input "Registra tu producción del día" / "Litros totales del día", button "Actualizar producción".
- It is a newer node id (3633 vs 3269) and probably the updated card meant to replace the one in 1.2 (or to be embedded in the dashboard).

---

## 2. Flows

### F1 Check herd summary
1. Reportes tab → 1.1 General.
2. Tap animal counter (Vacas/Vaquillas/Toros) → KPIs re-filter (inferred).
3. Tap row (celos / enfermas / preñez) → drill-down list (not designed in v4).

### F2 Log herd milk (global)
1. 1.1 → tap "16 Lts/día promedio por vaca" → 1.2 (Registro global).
2. Type "Litros totales del día" → "Actualizar producción" enables.
3. Tap → KPI recalculates and the chart updates (no success state drawn).

### F3 Log per-cow milk
1. 1.2 → tab "Registro individual" → 1.3 list.
2. Fill one or more "Producción individual en lt" → "Actualizar producción".
3. Success snackbar, and saved cows leave the list (3274:10634).

### F4 Browse production history
1. 1.2 → dropdown "Última semana" → 1.5 menu.
2. Pick period → chart swaps to semanal / mensual / trimestral variant (semestre and año not designed).

---

## 3. Domain notes / KPI catalogue (v4)

| KPI / chart (es) | en | Definition / implied formula | Filters | Period | Data needed | Bands | States drawn |
|---|---|---|---|---|---|---|---|
| Vacas / Vaquillas / Toros counters | cows / heifers / bulls | count of active animals per category on the selected ranch | ranch | current | animal category, status | – | populated |
| Días Abiertos | days open | avg over cows in the selected category: (conception date or today) − last calving date | ranch, category | current snapshot | calving dates, conception (service with positive diagnosis) | none shown | populated |
| DEL | days in milk | avg over lactating cows (today − last calving date) | ranch, category | current | calving dates, dry-off events | none | populated |
| Vacas a observar celos | cows to watch for heat | count of cows whose expected-heat window (last heat/service/calving + 21 d cycle) includes today and are unconfirmed | ranch, category | today | heat, service, calving events, alert status | – | populated |
| Vacas enfermas | sick cows | count of cows with an open sickness event | ranch, category | current | sickness/treatment events | – | populated |
| Seguimiento preñez | pregnancy follow-up | count of served cows due for a pregnancy diagnosis (or pregnant cows in follow-up) | ranch, category | current/due | service dates, diagnosis results | – | populated (highlighted row) |
| Lts/día promedio por vaca | litres/day avg per cow | herd total litres for the day ÷ number of milking cows; or Σ individual litres ÷ cows recorded | ranch | day (latest log) | daily herd litres, lactating cow count, per-cow litres | – | populated |
| Historial de producción (chart) | production history | per bucket: avg (or total) litres; bars + trend line | ranch (cow, if individual) | rolling week / month / quarter / semester / year | daily milk logs (herd and/or per cow) | – | populated (3 granularities) |

Entities and fields implied:
- **MilkProductionLog (herd)**: ranch_id, date, total_litres, entered_by. One per day. "Actualizar" implies overwriting the same day.
- **MilkProductionLog (cow)**: cow_id, date, litres. One per cow per day.
- Derived: milking_cows_count(date), avg_litres_per_cow(date), aggregates by week/month/quarter/semester/year.
- Enum `PeriodPreset`: ULTIMA_SEMANA, ULTIMO_MES, ULTIMO_TRIMESTRE, ULTIMO_SEMESTRE, ULTIMO_ANIO.
- Enum `ReportView`: GENERAL, EXPANDIDO, AVANZADO.
- Enum `AnimalCategory` (counters): VACA, VAQUILLA (calf icon), TORO.

Rules quoted:
- "Registro de producción diario del hato": one herd log per day.
- "Registra tu producción del día": entry is for today only (no back-dating shown).
- "lts/día promedio por vaca": the per-cow average, not the herd total.
- Weekly x-axis Lun→Dom: weeks start on Monday.

---

## 4. Shared components seen
`Encabezado` (Bell_icon, Menu Rancho, Avatar, Icon_KPI_Event badge), `Date Picker` (Material 3, hidden), `Footer_Mobile` (Tareas/Vacas/Grupos/Reportes/Ranchos), `Cow Counter_activated_mobile`, `Calf Counter_deactivated_mobile`, `Bull Counter_deactivated_mobile`, `KPI` tile (colored header + icon + value), `Cows in Heat` list-row pattern, `Icon_Cows_Heat`, `Icon_Sick_Cows`, `Icon_Pregnated_Cows`, `Icono DIM`, `Icóno leche`/`Milk`, `Report_Icon`, `Stall`, `Icon_Cow_Adult`, `Pestañas datos` (2-tab switch), `Menu Rancho` reused as a generic dropdown, `Boton 40h` (primary button), `Grafica / semanal|mensual|trimestral`, `Producción individual` card, `Campo de texto`, snackbar `Frame 234` with `Top_Nav_LogOut` close icon, `Grid/Mobile_Smartbell_Official` (hidden grid).

---

## 5. Open questions / inconsistencies
1. **Report screens are not in v4.** Básicos/Avanzados, KPI detail sheets, benchmark gauges, cow lists, download (XLS/PDF) and the period range picker are not on this page. Are the v3 designs still valid, or deferred?
2. "Expandido" and "Avanzado" views are named but not designed. Does Avanzado map to v3 "Avanzados" (Finanzas, Aretes, Genética, paid)?
3. The page is named "Reportes" but holds a dashboard. Where are Historial and Alertas now? The tab bar dropped them. Is "Tareas" the old alerts list?
4. Chart semantics: what are the bars vs the line, the y-axis unit, and the dark bar? Are there tooltips?
5. Charts for Último semestre and Último año are missing.
6. Subtitle "Semana del 3 a {Día}, {mes} del {año}" is a broken template.
7. Global vs individual consistency: if both are logged, which feeds "16 lts/día promedio por vaca"? Does Σ cow litres overwrite the herd total?
8. Is "Actualizar producción" disabled by default (pale green)? There are no validation or error states, no back-dating, and no edit of past days.
9. Snackbar copy: "la vaca producción de la {Vaca ID}" is garbled. It should be "la producción de la vaca {Vaca ID}". It also fires per cow, while the button saves many.
10. Per-cow list: which cows are listed (lactating only)? It needs search and pagination for large herds, and 3274:587 vs 3274:10634 headings differ.
11. Días Abiertos and DEL have no bands, no period and no drill-down defined in v4.
12. The calf icon counter means "Vaquillas" (heifers) in v3. Confirm the label.
13. The date picker is hidden in all frames. Is a period filter planned for the dashboard?
14. Milk KPI card `3633:1096` is a newer variant. Which one is canonical (1.2 card vs 1.6)?
15. Missing states everywhere: empty (no logs yet), loading, offline.

---

## 6. Reconciliation with previous analysis
Compared against `alerts-dashboard-reports.md` §1.1–1.2 (dashboard), §1.8 (mobile reports), §1.9 (web reports), §3.4 (KPI catalogue).

### 6.1 Screens
| v3 screen | v4 | Verdict | Notes |
|---|---|---|---|
| 1.1 Dashboard mobile ("¿Cómo va él rancho?", R `1:126689` variant) | 1.1 Onboarding_Dashboard | **SUPERSEDES** | Moved under the Reportes tab. Title, "Registrar nueva vaca" button and add-cow "+" are gone. Grid tiles became 2 KPI cards + 4 list rows. A General/Expandido/Avanzado switcher was added. The hidden "$4,200 Estimado actual" block is gone. |
| 1.1.a–d Drill-downs (celos, enfermas, preñadas, vacunas) | not present | (UNCHANGED by default) | v4 rows imply the same drill-downs. The v3 designs stay valid until redrawn. |
| 1.2 Dashboard web | not present (mobile-only page) | UNCHANGED | No web frames in v4 Reportes. |
| 1.8 Reports mobile Básicos | not present | UNCHANGED (pending) | Possibly the target of the "Expandido" view. Not dropped explicitly. |
| 1.8/1.9 Avanzados | "Avanzado" button only | **EXTENDS** (name only) | Content undefined in v4. |
| 1.9 Reports web, download modal, DIM rangos | not present | UNCHANGED | – |
| Milk input on dashboard (R `1:126689` inline input) | 1.2, 1.3, 1.4, 1.5, 1.6 | **EXTENDS** | A full feature now: herd and per-cow logging, history chart (week/month/quarter), period presets, success snackbar. |
| Tab bar VACAS/GRUPOS/HISTORIAL/REPORTES/ALERTAS | Tareas/Vacas/Grupos/Reportes/Ranchos | **CONFLICTS** | Historial and Alertas tabs removed. Tareas and Ranchos added. The bell moves top-left. |

### 6.2 KPIs
| KPI | v3 | v4 | Verdict |
|---|---|---|---|
| Vacas en Sistema / counters (vacas, vaquillas, toros) | header pill 035/020 + counters | counters 002/000/000, cow active | UNCHANGED (pill text "Vacas en Sistema" dropped) |
| DIM / DEL | "DIM 185" tile (v3 mobile), "DEL 120" in R variant | "DEL 120" card | **SUPERSEDES**: label settles on "DEL". Formula unchanged. |
| Días abiertos | "75" in R variant + "Días abiertos - Rangos" | "Días Abiertos 75" card, top position | UNCHANGED (promoted to a headline card) |
| Celos a confirmar (A revisar hoy / Para seguimiento) | 2-part tile | "Vacas a observar celos 05" single count | **CONFLICTS**: today vs follow-up split lost. The wording changes from "confirm" to "observe". |
| Enfermas | "002" tile | "Vacas enfermas 01" | UNCHANGED |
| Preñadas | count of pregnant cows | **"Seguimiento preñez 06"** | **CONFLICTS**: now likely "pregnancy follow-up" (diagnosis due) rather than the pregnant stock. Confirm. |
| Vacunas y tratamientos (Por vacunar / Por tratar) | tile | absent | **DROPPED** from dashboard |
| Distribución del hato (donut) | web only | absent | UNCHANGED (web not in v4) |
| Producción de leche lts/día/vaca | single value + daily input | value + herd input + per-cow input + history chart | **EXTENDS** |
| Historial de producción (chart) | none | new | **ADDED** |
| Producción individual por vaca | spec annotation only ("Volumen de leche producido por vaca") | per-cow log | **ADDED** (fulfils the v3 annotation) |
| Period presets (semana/mes/trimestre/semestre/año) | custom range "Periodo de reporte" | rolling presets (milk chart only) | **CONFLICTS** with the v3 custom range model; scope differs (chart vs report) |
| Report KPIs §3.4: Celo Conf/Esp, Eficiencia detección de celo, Celo 45-60 d, Preñez Diag/Esp, Servicios realizados, TCPS, Servicios por concepción, Partos Conf/Esp, Tiempo entre partos, Edad primer parto, Días parto-1er servicio, Enfermas Tratadas/En espera, Desechadas (total, repro), Número de lactancias, Mejora en el periodo, Benchmark | defined | not present | UNCHANGED (not redesigned; carry forward v3 definitions and bands) |
| Avanzados: Finanzas, Aretes, Genética | defined | "Avanzado" label only | UNCHANGED |
| Hidden "Estimado actual / Total estimado extra" | hidden layer | gone | **DROPPED** |

**KPIs added in v4:** Historial de producción (chart, 3 granularities), Producción individual por vaca, Seguimiento preñez (if it is a new due-for-diagnosis count), period presets.
**KPIs dropped from the dashboard in v4:** Vacunas y tratamientos (Por vacunar / Por tratar), the Celos "A revisar hoy / Para seguimiento" split, Preñadas (as stock count, if replaced), "Vacas en Sistema" pill label, hidden value estimate.
**Benchmark bands:** none defined in v4. The v3 bands (heat detection <45/45–60/60–75/75+, TCPS <50/50–55/55–65/65+, calving interval, age at first calving, days to first service) remain the only source.
