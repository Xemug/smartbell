# Smartbell screen inventory (index)

The detailed, per-screen inventory lives in `docs/design-inventory/`. Each screen there lists its
Figma node links, fields (Spanish label plus English gloss), actions, states and navigation:

| File | Covers |
|---|---|
| [mobile-core.md](design-inventory/mobile-core.md) | Mobile onboarding, cow tab (profile, log, delete), stalls/groups, events hub (desktop-size frames), configuration, reminders. 58 screens / ~414 frames |
| [event-flows.md](design-inventory/event-flows.md) | The 7 cow event flows ID01–ID07, mobile and web side by side, snackbars, the reproductive state machine |
| [web-onboarding-registry.md](design-inventory/web-onboarding-registry.md) | Web shell, login and signup, onboarding, registries and filters, groups, users and permissions, plans, messages, history |
| [alerts-dashboard-reports.md](design-inventory/alerts-dashboard-reports.md) | Dashboard, alerts and their confirmation modals, off-app channels (email, SMS, WhatsApp, push), history, reports, the KPI catalogue |
| [design-system.md](design-inventory/design-system.md) | Tokens, ~110 components, icons, extraction plan (2020 library; foundations superseded by the UI Kit) |
| [v4-onboarding-dashboard-tasks.md](design-inventory/v4-onboarding-dashboard-tasks.md) | **Smartbell 4.0**: new onboarding, task-list home, tasks model and priority, OTO offer, WhatsApp support, new navigation |
| [v4-animal-registration-profile.md](design-inventory/v4-animal-registration-profile.md) | **Smartbell 4.0**: unified animal form (sex, stage, crossbreed FB–F1, parents), MVP animal profile, diet change |
| [v4-reports.md](design-inventory/v4-reports.md) | **Smartbell 4.0**: Reportes "General" dashboard, milk tracking (herd and per-cow logs, history chart) |
| [uikit-design-system.md](design-inventory/uikit-design-system.md) | **UI Kit (Moon for FlutterFlow)**: tokens, widgets, components, icons; canonical for foundations |
| [uikit-product.md](design-inventory/uikit-product.md) | **UI Kit**: store screenshots of the shipped FlutterFlow app, grant one-pager |

Link format: `https://www.figma.com/design/<fileKey>/x?node-id=<id with - for :>`. Files:
M = mobile `gv5ugNqVKPF8N2Ol5cQCyV`, W = web `6UCRP77ZAdWb1ut1A91yJX`, R = reports `nUJCa7ZxyUPwr3J6sxato1`, V = Smartbell 4.0 `hmrArjwi6iI4cOlPkR5hQD`, K = UI Kit `61o8icnDCev7fz5IN4irtj`.

**Read `docs/reconciliation-v4.md` first:** 4.0 and the UI Kit supersede the older files for navigation, onboarding, home (tasks), animal registration, the profile, the dashboard, milk and design foundations. The navigation map and matrix below describe the older designs. The reconciliation's §2 table says which source wins per module.

Coverage caveat: the Figma seat hit its MCP rate limit during the dissection. Every page was read in
full through its layer and text metadata, but only about 70 frames were screenshotted. Labels inside
component instances (some buttons, radio options and dropdown values) were sometimes taken from the
designers' annotation notes, and the files mark these. Builder agents must open the linked frames
with `get_screenshot` before building.

## Navigation map

**Mobile (360 base, below 960):** global header (bell with badge, user name, avatar, ranch
dropdown) → bottom tab bar **VACAS · GRUPOS · HISTORIAL · REPORTES · ALERTAS**. The dashboard
("¿Cómo va el rancho?") is home. The avatar opens the configuration hub (Mi cuenta, Rancho,
Vacunación y desarrollo, Usuarios, Plan).

**Web (1280+, 960 and up):** dark-blue top bar **Inicio · Vacas · Grupos · Alertas · Historial ·
Reportes** · bell · user · avatar menu (Configurar mi perfil / mi rancho / Administrar usuarios /
Vacunación y desarrollo / Cambiar plan / Cerrar sesión) · ranch switcher · "Vacas en Sistema | N"
pill · footer.

## Screen matrix (module × platform)

| Module | Screen | Mobile (§ in mobile-core unless noted) | Web (§ in web-onboarding-registry unless noted) | Card |
|---|---|---|---|---|
| Auth | Splash, Home | A1, A2 | (none) | auth |
| | Sign up | A3 | 1.2 | auth |
| | Log in | A4 | 1.1 | auth |
| Onboarding | Task hub | A5 | 1.3 | onboarding-hub |
| | Alert channels | A6 | 1.7 | onboarding-hub |
| | Account and ranch config | A12–A14, E2, E6 | 1.4, 1.5 | profile-ranch |
| | Vaccination and development plan | A15, E7, B6 | 1.6 | vaccination-plan |
| Registry | Cow / heifer / bull forms | A7–A9 | 1.9 | animal-forms |
| | Animal lists and filters | A10, B1 | 1.8, 1.14 | animal-lists |
| | Cow profile and log | B2, B4, B5 | 1.15; event-flows 1.0, 1.9 | cow-profile |
| | Removal (Baja) | B3 | event-flows 1.12 | cow-profile |
| Groups | List, wizard, detail, delete, move | A11, C1–C7 | 1.10–1.13 | groups |
| Events | Health: illness, accident, treatment, follow-up | D2–D4, D6; event-flows 1.1–1.8 | event-flows 1.1–1.8 | health-flows |
| | Diet and group change | D5, D7; event-flows 1.7, 1.10 | event-flows 1.7, 1.10 | diet-group-change |
| | Heat (ID04) | D8; event-flows 1.13 | event-flows 1.13 | heat-flow |
| | Pregnancy check (ID06) | D9; event-flows 1.14 | event-flows 1.14 | pregnancy-check |
| | Calving (ID02/05/07) | D10; event-flows 1.15 | event-flows 1.15 | calving |
| | Abortion (ID02) | event-flows 1.15 | event-flows 1.15 | abortion |
| | Snackbars | (none on mobile) | event-flows 1.11 | event-launcher |
| Alerts | Alert list and confirmation modals | adr 1.3, 1.4 | adr 1.4, 1.5 | alerts-screens |
| | Off-app channels | (none) | adr 1.6 | email-digest, web-push, sms |
| | Reminders | F | (none) | reminders |
| Dashboard | Tiles and drill-downs | A16, A17; adr 1.1 | 1.16; adr 1.2 | dashboard |
| History | Activity history | adr 1.7 | 1.20 | history |
| Reports | Overview, KPI detail, export | adr 1.8 | adr 1.9 | reports-* |
| Admin | Users and permissions | E8, E10 | 1.17 | user-admin |
| | Plans and billing | E3–E5 | 1.18 | plans-billing (parked) |
| | Messages | E9 | 1.19 | messages (parked) |

(adr = alerts-dashboard-reports.md)

## Design gaps builders must handle

- **Event forms have no 360px design.** The events hub frames are 1366×768. The `event-launcher` card sets the mobile pattern (full-screen stepper), and every event card follows it.
- **Library states are missing:** hover, focus, error, loading and modal states. The components cards define them from the tokens.
- **Screens that don't exist:** forgot password, a confirmation before discarding unsaved data, a dry-off event, alert snooze or dismiss. Each is either built minimally per its card or listed in the memo's open questions.
