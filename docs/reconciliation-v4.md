# Reconciliation: Smartbell 4.0, the UI Kit, the shipped app, and the earlier designs

Date: 2026-10-29. Status: **draft; the decisions in §4 need the user.**

## 1. Sources and their age

| Source | File | Era | What it is | Inventory |
|---|---|---|---|---|
| Mobile (M) | `gv5ugNqVKPF8N2Ol5cQCyV` | ~2019–2020 | Full reproductive-management app, Vue/Vuetify-era library | mobile-core.md, event-flows.md, alerts-dashboard-reports.md, design-system.md |
| Web (W) | `6UCRP77ZAdWb1ut1A91yJX` | ~2019–2020 | Web version, registries, users, plans | web-onboarding-registry.md, event-flows.md |
| Reports (R) | `nUJCa7ZxyUPwr3J6sxato1` | ~2020 | Básico / Avanzado KPI reports | alerts-dashboard-reports.md |
| **Smartbell 4.0 (V4)** | `hmrArjwi6iI4cOlPkR5hQD` | 2023–2025 | New onboarding, task-based home, unified animal form, MVP profile, milk tracking | v4-onboarding-dashboard-tasks.md, v4-animal-registration-profile.md, v4-reports.md |
| **UI Kit (K)** | `61o8icnDCev7fz5IN4irtj` | ~2024 | Moon design system re-tokenised for FlutterFlow, plus store screenshots and a grant one-pager | uikit-design-system.md, uikit-product.md |
| **Shipped FlutterFlow app** | (seen only in store screenshots) | 2025 | Live iOS/Android MVP: milk logging (tank / calves / antibiotics), tasks, profile, store subscription, OneSignal push | uikit-product.md |

**Rule used below:** where V4 or K redraws something, it supersedes M/W/R. Where they are silent, M/W/R stay the only source. The shipped app is an earlier subset of V4: milk and tasks only, with **no** reproductive features.

## 2. Source of truth by module

| Module | Source of truth | Status vs earlier analysis | Notes |
|---|---|---|---|
| Design tokens and generic components | **K** (Moon + Smartbell brand) | SUPERSEDES design-system.md foundations | The old library stays the source for domain icons, feature discs, mascots, tables and KPI cards |
| Navigation | **V4**: mobile tabs Tareas · Vacas · Grupos · Reportes · Ranchos; web Tareas · Vacas · Grupos · Reportes · Usuarios · Ranchos | SUPERSEDES | Alertas and Historial are no longer tabs. The shipped app has Leche · Tareas · Perfil |
| Sign-up and log-in | **V4** (adds Google/Facebook; drops ranch fields) | SUPERSEDES A3–A4, W 1.1–1.2 | The ranch must be auto-created |
| Onboarding | **V4**: first cow (4 fields) → Felicidades → 50% one-time offer → task home | SUPERSEDES A5–A6, W 1.3 hub | "¿Cuántas vacas?" and "Éxito estimado" hidden on mobile; alert-channel step dropped |
| Home | **V4 task list** grouped by month/day, value banner ($2,100 MXN per registered cow per year), Nuevo animal / Nueva tarea | SUPERSEDES the old dashboard as home | |
| Tasks | **V4 + shipped app** (new entity) | NEW | Manual + automatic tasks with a defined display priority (v4-onboarding-dashboard-tasks.md §3.3–3.4) |
| Alerts and reminders | Logic: **domain-model §4** (unchanged). Surface: **V4 tasks** | SUPERSEDES the alert list, the Recordatorios hub and the onboarding cards | Automatic tasks are the old alerts in a new costume; the off-app digest/push keep sending them |
| Animal registration | **V4 unified form** (sex toggle, development stage, crossbreed level FB–F1 + contributing breed, parents inline, dam-status modal, more/less data) | SUPERSEDES A7–A9, W 1.9 | Only name/ID + birth date required |
| Animal lists and filters | **M/W** (V4 shows a simple list only) | UNCHANGED + new columns (sex, stage) | |
| Animal profile | **V4 MVP profile** (Peso / DEL / Lts tiles; Genealogía, Dieta, Reproducción, Salud cards; Registros: producción, peso) | SUPERSEDES B2 layout | The event-launch buttons are gone from the MVP profile: events start from tasks and from cards |
| Event flows ID01–ID07 | **M/W** | UNCHANGED | V4 adds pregnancy re-checks at 90 and 180 days, a "Reto" (close-up) stage, and an automatic diet-change task at 120 DIM |
| Groups | **M/W** | UNCHANGED, but "en construcción" in V4 | Fake door in the V4 MVP |
| Milk | **V4 + shipped app**: daily herd log, optional per-cow litres by destination (tanque / becerras / antibióticos), history chart week/month/quarter/semester/year | EXTENDS (was a parked tile) | Antibiotic litres tie to the milk-withdrawal rule |
| Dashboard / KPIs | **V4 Reportes "General"**: animal counts, días abiertos, DEL, heat watch, sick, pregnancy follow-up, litres/cow/day | SUPERSEDES the M/W dashboard | "Expandido" / "Avanzado" views are labels only |
| Básico KPI reports | **R** | UNCHANGED but marked **"Futuro"** in V4 | Deferred unless the user says otherwise |
| History | **M/W** | Tab removed in V4 | The per-cow log stays; the global feed is deferred |
| Users and permissions | **M/W** (V4 web nav has Usuarios) | UNCHANGED | Task assignee needs users |
| Plans and billing | **CONFLICT ×4** | | See §4 |
| Support | **V4**: WhatsApp support link, "en construcción" fake-door modal with a WhatsApp button, WhatsApp community | NEW | Number 333-405-6398 |

## 3. Domain changes (applied to domain-model.md §7)

- **Animal:** add `sex`, `development_stage` (+ AUTO), `crossbreed_level`, `contributing_breed`, `repro_stage_date`, birth/weaning/one-year weights, `dam_id`/`sire_id` on every animal. `kind` becomes derived (sex + stage). Drop breed `MIXTA`. Drop the cow's `lactation_state` field from the form (derived from the projection).
- **Task (new):** source (MANUAL, AUTOMATIC, SYSTEM, PROMO), kind, title, due_date, frequency, animal_id?, assignee_user_id?, notes, status (OPEN, DONE, DELETED), completed_by/at, linked_event_id, completion_rule. It replaces Reminder; Alert becomes the internal record that generates an automatic task (or merges into Task; see §4).
- **MilkRecord:** herd log per day (total litres) + optional per-cow litres with destination (TANQUE, BECERRAS, ANTIBIOTICOS).
- **DietChange:** add diet_type, daily_kg, daily_cost.
- **Settings:** `diet_change_dim` = 120, `preg_recheck_days` = [90, 180] ⚙, `close_up_days_before_calving` ⚙ (industry ~21), `value_per_registered_cow_mxn` = 2,100, heat window rendered as 7 days in V4 (was ±2) ⚙.

## 4. Decisions needed (supersedes the memo's earlier list)

**Product**
1. **Stack and the existing FlutterFlow app:** continue it, rebuild in Flutter, or rebuild as web + PWA (see the memo). Also needed:
   - Which backend the app uses (Firebase or Supabase?).
   - How many users and subscribers it has.
   - Whether their data must be migrated.
   - Whether the project can be exported.
2. **Scope of v1:** the proposal is milk + tasks parity with the shipped app, plus the reproductive core (registry, the 7 event flows, automatic tasks) and the V4 General dashboard. Deferred: Básico reports, the history feed, groups management (fake door, as in V4), plans/billing beyond one membership.
3. **Alerts:** merge Alert into Task (one entity), or keep Alert internal and generate Tasks from it? The recommendation is to keep Alert internal for the off-app channels and the window logic, and show only Tasks.
4. **Ranch creation:** auto-create "Mi rancho" at sign-up and let users rename it?
5. **Pricing:** four conflicting models: herd-size tiers (M/W), the $250/$2,500 MXN basic membership + 50% OTO (V4), the 24.99/249.99 store subscription (shipped), and the lifetime licence (grant). Which one is current?
6. **Reproductive constants:** gestation 283 d, cycle 21 d, check 35–45 d, re-checks 90/180 d, close-up 21 d before calving, heat window 7 d (V4) vs ±2 d.
7. **Abortion → ABIERTA?** Return-to-heat while SERVIDA? (unchanged from before)

**Design** (the full list is in uikit-design-system.md §6.6; defaults proposed)
8. Is the UI Kit canonical? Proposed **yes**, with these defaults:
   - navy `#063664`
   - blue primary CTA
   - heat and error as separate tokens
   - orange kept for "Aceptable"
   - the kit's greys and `#F9F9F9` background
   - radii 8/12
   - **body 16** (farmers in the field)
   - Open Sans buttons
   - light app bar
   - breakpoints 600/960/1280
   - no dark mode in v1
9. F4 is labelled 93.5% but is 93.75%; development-stage age bands overlap (see v4-animal-registration-profile.md §5).

## 5. User answers (2026-10-29)

- **4.5 Pricing:** the store prices pulled by RevenueCat are canonical. The product identifiers and display names were left unchanged on purpose, to avoid touching references. Plans and billing build on the RevenueCat `Pro` entitlement (monthly, annual, lifetime) and the `User` add-on.
- **4.3 Alerts:** shown only as tasks; Alert stays internal.
- **4.4 Ranch:** "Mi rancho" is created automatically at sign-up and can be renamed.
- **4.6 Reproductive constants:** confirmed. Gestation 283 d, cycle 21 d, pregnancy check 35–45 d, re-checks at 90/180 d, close-up 21 d before calving, heat window 7 d.
- **4.2 v1 scope:** confirmed. Milk + tasks parity, plus the reproductive core and the General dashboard. Reports, history, the vaccination plan and groups management are deferred.
- **4.1 Stack:** still open; the user asked for clarification on Capacitor's native capabilities and on FlutterFlow sync.
- Legacy security: the rules are managed in FlutterFlow (Firestore → Settings → Rules). The `Users` collection is publicly readable and writable in production (released 2026-05-27).
