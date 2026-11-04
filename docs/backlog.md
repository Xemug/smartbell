# Smartbell backlog (proposed order, revised 2026-10-29 after the FlutterFlow audit)

Ordered by dependency. Each row is one card; its spec is `docs/roadmap/<slug>.md`. Sources: `docs/reconciliation-v4.md`, `docs/spikes/flutterflow-audit.md`, `docs/decision-memo-stack.md` (recommended stack: A′). Status: **draft for the user's review**.

| # | Card | Type | Effort | Depends on |
|---|---|---|---|---|
| | **0 Urgent (live app security)** | | | |
| 1 | `legacy-firebase-lockdown`: Lock down the live FlutterFlow app's Firebase (security) | bug | M | — |
| | **1 Foundations** | | | |
| 2 | `app-scaffold`: Scaffold the new Smartbell app (web + api) | chore | M | — |
| 3 | `design-tokens`: Design tokens from the Smartbell UI Kit (Moon) | feature | M | app-scaffold |
| 4 | `icons-export`: Icon set and illustrations export | chore | S | design-tokens |
| 5 | `ui-primitives`: UI primitives: buttons, inputs, selection controls | feature | L | design-tokens, icons-export |
| 6 | `ui-surfaces-feedback`: UI surfaces and feedback: modal, bottom sheet, snackbar, cards, table, tabs, filters | feature | L | ui-primitives |
| 7 | `app-shell-navigation`: App shells: Tareas-first navigation (mobile tabs, web top bar), ranch switcher, WhatsApp support | feature | M | ui-surfaces-feedback |
| 8 | `whatsapp-support`: WhatsApp support, community link and fake-door tracking | feature | S | app-shell-navigation |
| 9 | `soporte-y-demanda-admin-page-for-whatsapp-copy-and-fake-door`: Soporte y demanda: admin page for WhatsApp copy and fake-door taps | feature | S | whatsapp-support |
| 10 | `core-data-model`: Core data model and migrations | feature | M | app-scaffold |
| 11 | `repro-engine`: Reproductive engine: state projection and computed dates | feature | L | core-data-model |
| 12 | `history-writer`: Activity history writer and templates | feature | S | core-data-model |
| 13 | `auth`: Authentication via Firebase Auth: sign up, log in, session, splash | feature | M | app-shell-navigation, core-data-model |
| 14 | `ranch-tenancy-permissions`: Ranches, memberships, roles and permission guard | feature | M | auth |
| 15 | `profile-ranch-config`: My account and ranch data configuration | feature | M | ranch-tenancy-permissions |
| | **2 Registry, milk and groups** | | | |
| 16 | `animal-api`: Animal registry API: create, edit, remove, search, filter | feature | M | repro-engine, history-writer, ranch-tenancy-permissions |
| 17 | `milk-api`: Milk records API: herd daily log and per-cow litres by destination | feature | S | animal-api |
| 18 | `animal-forms`: Unified animal registration form (V4): sex, stage, crossbreed, parents | feature | M | animal-api, ui-surfaces-feedback |
| 19 | `animal-lists`: Animal lists with search and filters (cows, heifers, bulls) | feature | M | animal-api, ui-surfaces-feedback |
| 20 | `events-api`: Events API: record, edit, delete events with re-projection | feature | L | repro-engine, animal-api |
| 21 | `cow-profile`: Animal profile (V4 MVP), event log and removal | feature | L | animal-lists, events-api |
| 22 | `groups`: Groups (potreros): list, wizard, detail, delete and move cows | feature | L | animal-lists, events-api |
| | **3 Event flows** | | | |
| 23 | `event-launcher`: Event launcher and mobile event-form pattern | feature | M | cow-profile, ui-surfaces-feedback |
| 24 | `heat-flow`: ID04 Heat flow (Registro de celo) | feature | M | event-launcher |
| 25 | `pregnancy-check`: ID06 Pregnancy check (Registro de preñez) | feature | S | event-launcher |
| 26 | `calving-flow`: ID05/ID07/ID02 Calving (on time, early, late) and calf registration | feature | M | event-launcher, animal-forms |
| 27 | `abortion-flow`: ID02 Abortion record | feature | S | calving-flow |
| 28 | `health-flows`: ID01/ID03 Health events: illness, accident, medical treatment, follow-up | feature | L | event-launcher |
| 29 | `diet-group-change`: ID01/ID03 Diet change and group (potrero) change events | feature | S | event-launcher, groups |
| | **4 Tasks, onboarding and home** | | | |
| 30 | `alert-engine`: Alert engine: daily job, date-driven transitions, alert lifecycle | feature | M | events-api |
| 31 | `tasks-engine`: Tasks engine: manual and automatic tasks with priority | feature | M | alert-engine |
| 32 | `onboarding-hub`: Onboarding (V4): first cow, congratulations, one-time offer | feature | M | ranch-tenancy-permissions, animal-forms, tasks-engine |
| 33 | `tasks-home`: Tasks home: task list, new task, task detail | feature | M | tasks-engine, event-launcher, app-shell-navigation |
| 34 | `milk-screens`: Milk screens: daily log, per-cow log and production history chart | feature | M | milk-api, ui-surfaces-feedback |
| 35 | `dashboard`: Reportes 'General' dashboard (V4) | feature | M | alert-engine, animal-lists, milk-api |
| 36 | `siniiga-compliance`: Flag animals with no SINIIGA and ask at onboarding if the ranch has them all | feature | S | animal-lists, onboarding-hub, tasks-engine |
| 37 | `siniiga-transfer`: Transfer a SINIIGA when the seller hasn't recorded the sale | feature | S | animal-api, siniiga-compliance, alert-engine |
| | **5 Replace the live app** | | | |
| 38 | `legacy-firestore-import`: Import legacy Firestore data into Postgres | feature | M | core-data-model, auth, milk-api, animal-api |
| 39 | `app-favicon-and-install-icons`: App favicon and install icons | chore | S | icons-export |
| 40 | `mobile-store-release`: Capacitor iOS/Android build under the existing bundle id, with RevenueCat | feature | L | auth, tasks-home, milk-screens, groups, profile-ranch-config, user-admin, legacy-firestore-import, report-export (parity with the live app) |
| 41 | `golden-path-e2e`: End-to-end golden path test | chore | M | tasks-home, dashboard, milk-screens, calving-flow, health-flows, abortion-flow, mobile-store-release |
| | **6 Notifications and admin** | | | |
| 42 | `email-digest`: Notification service and daily email digest | feature | M | alert-engine |
| 43 | `web-push-pwa`: Web push notifications and installable PWA | feature | M | email-digest, tasks-home |
| 44 | `user-admin`: User administration and permissions | feature | M | ranch-tenancy-permissions, history-writer |
| 45 | `retire-dairy-milk-tracker`: Retire dairy-milk-tracker | chore | S | auth |
| | **7 Deferred ("Futuro" in 4.0 or not in it)** | | | |
| 46 | `vaccination-plan`: Vaccination and development plan wizard | feature | M | onboarding-hub |
| 47 | `history`: History (Historial): activity feed with filters | feature | S | history-writer, cow-profile |
| 48 | `kpi-engine`: Report KPI engine (Básico report) | feature | L | events-api |
| 49 | `reports-overview`: Reports tab: Básicos overview | feature | M | kpi-engine |
| 50 | `reports-kpi-detail`: Report KPI detail screens | feature | M | reports-overview |
| 51 | `report-export`: Report export: PDF and XLS | feature | S | reports-overview |
| | **8 Parked** | | | |
| 52 | `plans-billing`: Plans, billing and plan limits (parked) | feature | XL | user-admin |
| 53 | `sms-whatsapp-alerts`: SMS and WhatsApp alert channels (parked) | feature | M | email-digest, plans-billing |
| 54 | `messages`: Internal user messages (parked) | feature | M | user-admin |
| 55 | `offline-event-queue`: Offline event capture (spike) | spike | M | event-launcher |
