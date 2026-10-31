# Decision memo: keep building on dairy-milk-tracker, or start fresh?

Status: **awaiting the user's decision. Revised 2026-10-29** after the Smartbell 4.0 and UI Kit analysis (`docs/reconciliation-v4.md`). No card that depends on the stack (F-01 onward) starts before this is answered.
Date: 2026-10-28

> **Plain-language summary (2026-10-29).**
> - **What gets built:** a new app written from scratch, using the Figma files, the docs and the old app only as reference. The current FlutterFlow app is not modified and keeps running until the new one is ready.
> - **What the new app is:** one codebase (React) that runs in the browser and is also packaged as a real iOS and Android app with Capacitor. It is installed from the App Store and Google Play like any app.
> - **Native features:** push notifications, in-app purchases (RevenueCat), the camera for animal photos, offline storage and local notifications all work through native plugins.
> - **The trade-off:** the screens are drawn by a web view rather than native widgets. For a forms-and-lists app like Smartbell the difference is small.
> - **What is reused:** only accounts and services. The same Firebase sign-in (users keep their logins), the same RevenueCat, and the same store listing (decided at release time, see below).
> - **Existing data:** copied into the new database, never modified.

## The question

The Figma designs describe a reproductive-management app: about 470 mobile frames and as many web
frames. The domain covers cows, heifers, bulls and calves, potreros (groups or stalls), 7 event flows
that move a cow through a reproductive cycle, alerts on 4 channels, reminders, a dashboard, a history
log, KPI reports, roles and permissions, and paid plans. `dairy-milk-tracker/` is the earlier attempt.
Should the new work build on it, or start again?

## What dairy-milk-tracker actually is

- About 9.7k lines. Create React App (deprecated, no longer maintained) with plain CSS, plus FastAPI
  and async SQLAlchemy on SQLite.
- Three tables: `users`, `herds`, `milk_productions`. None of the domain in the designs exists: no
  cow, no event, no reproductive state, no alert, no role.
- The schema is "migrated" by hand-written column checks in `fix_database.py`, with no Alembic.
- Desktop and mobile are separate, duplicated page components switched by width
  (`MobileDetector`).
- Its UI kit (Header, Sidebar, Card, Form) does not follow the Smartbell design system (Montserrat
  and Open Sans, the blue #1460AA palette, the 4/8-column grids).
- The worthwhile parts are small: JWT login and registration, CORS handling, a pytest suite pattern
  and a Playwright login test. They can be ported in an afternoon.

Building on it would mean replacing the data model, the migration approach, the frontend toolchain
and the UI kit. Little would be left, so it would be a rewrite in place that inherits CRA and the
duplicated pages.

## Options

| | Option | For | Against |
|---|---|---|---|
| A | **Fresh build: React + TypeScript (Vite) PWA, FastAPI + PostgreSQL + Alembic** | One responsive codebase serves both the mobile (360) and web (1280) designs. Python suits the reproductive date rules, the report math and tests. The existing auth and tests port over. The API contract is typed through OpenAPI into a generated TS client. | Two languages. Web push on iPhone works only when the PWA is installed (iOS 16.4+). |
| B | Fresh build, all TypeScript (Next.js or Vite + Hono/Fastify, Prisma, Postgres) | One language for every agent card; shared types end to end. | Nothing from the old backend carries over. |
| C | Native mobile (Expo / React Native) plus a separate web app | Best offline use and push notifications in the field. | Two UIs to build for every screen, which roughly doubles the backlog. The designs' mobile and web layouts differ enough that react-native-web would not cover the web screens. |
| D | Vue 3 + Vuetify (the Figma spec notes reference `v-progress-linear`, so the original design target was Vuetify) | Closest to what the designer assumed. | Vuetify's Material look fights the custom design system anyway. No reuse from the old app. |
| E | Keep dairy-milk-tracker and extend it | Nothing to set up. | As above: CRA, no migrations, duplicated pages, wrong model. It costs more than A over the backlog. |

## Recommendation: A

Start fresh in a new top-level `app/` folder (`app/web`, `app/api`). Freeze `dairy-milk-tracker/` as
read-only reference and delete it once auth has been ported.

- **Frontend:** Vite + React 18 + TypeScript, React Router, TanStack Query, Tailwind themed from a
  `tokens.json` generated out of Figma, Radix primitives for accessible dialogs, menus and selects,
  and Recharts for the reports. Responsive layouts: the mobile designs below 960px, the web shell at
  960 and up. Installable as a PWA, with an offline write queue as a later card.
- **Backend:** FastAPI, SQLAlchemy 2, Alembic, PostgreSQL (SQLite allowed only in tests), pytest.
  The reproductive rules live in one pure-Python module, `app/api/domain/repro.py`, with
  table-driven tests. Alerts are derived from that module by a scheduled job (APScheduler at first).
- **Notifications:** in-app and email first; web push next; SMS and WhatsApp (through a provider
  such as Twilio) behind the paid-plan flag, late in the backlog.
- **Why not B:** B is a close second. The deciding factors are the existing Python auth and tests,
  and that the date and KPI logic reads more clearly in Python. If you would rather have one
  language, B changes only the foundation cards (F-01, F-03, F-04); every feature card is written
  stack-neutral.


## Update 2026-10-29: a third codebase exists

The UI Kit's store screenshots show a **live FlutterFlow app** on iOS and Android (Spanish and English):
- Tabs: Leche · Tareas · Perfil.
- Milk logging by destination, plus tasks.
- Store subscription at 24.99 a month or 249.99 a year.
- OneSignal push.

It has no reproductive features. The UI Kit is the Moon design system themed for FlutterFlow. That adds an option and changes the weighting:

| | Option | For | Against |
|---|---|---|---|
| F | **Continue in FlutterFlow / Flutter** (export the code, keep the store listings, add the reproductive core) | Existing users, subscriptions, push and store presence carry over. `moon_design` exists for Flutter. Native offline and push | The FlutterFlow visual builder is awkward for agent-built cards; the exported code needs a clean architecture before agents can work in it. The web app (registries, users) is weaker in Flutter web |
| G | **Flutter app (mobile) + React web (desktop)** sharing one FastAPI backend | Best of each: the phone app for field work (tasks, events, milk), web for office work (registries, users, reports) | Two UIs, as in C; needs the token source (UI Kit) shared by both |
| A′ | **Recommended earlier (A): React PWA + FastAPI**, now wrapped with Capacitor for the stores | One UI codebase; Moon has a React + Tailwind kit matching the UI Kit tokens | Must migrate store subscribers and push; a PWA in a store wrapper feels less native |

**Revised recommendation, pending the FlutterFlow facts.** If the app has real paying users, or its backend holds data that matters, choose **G**:
- Keep the mobile client in Flutter. Export the code from FlutterFlow and clean it up.
- Put a new FastAPI + Postgres backend behind both apps.
- Build the web (desktop) side in React with Moon.

If the user base is negligible, **A′** is the cheapest path to one codebase. In both cases the backend, domain model, reproductive engine and all API cards are the same. Only the UI cards change platform.

Facts needed before choosing:
1. The FlutterFlow app's backend (Firebase or Supabase?).
2. Its active users and paying subscribers.
3. Whether the project can be exported.
4. Whether the Android app is published.
5. Whether you want desktop web at all for v1.

## Also needed from you (superseded by `docs/reconciliation-v4.md` §4; kept for the record) (blocking or shaping the backlog)

1. **The stack:** A (recommended), B, C, D or E.
2. **Reproductive constants.** The designs never state them as numbers; the backlog will use these
   defaults, set per ranch, unless you say otherwise:
   - gestation 283 days
   - heat cycle 21 days (window ±3)
   - voluntary waiting period (PEV) 45 days
   - pregnancy check 35–45 days after service
   - dry-off 60 days before calving
   - "recién parida" (fresh cow) under 45 DIM (days in milk)
   - abortion between days 42 and 260 of gestation
3. **Colour conflicts:** the palette board says F15C00 and FF006A, while the colour styles say
   FF7B01 and EB004E. Which are canonical?
4. **Language:** the copy is Spanish (Mexico): MXN, SINIIGA. Ship Spanish only, or es plus en via
   i18n from day one? The backlog assumes Spanish copy behind i18n keys.
5. **Scope of v1:** billing and plans (Cría / Destete / Producción), SMS and WhatsApp, the
   Avanzados reports (Finances, Smart ear tags, Genetics) and milk logging are scheduled last or
   parked. Confirm.
6. **Repo housekeeping:** the main checkout is on branch `port-auth-fixes`, with `docs/` untracked.
   Planning docs should land on `main`. OK to commit `docs/` to `main`?

## Recommendation after the FlutterFlow audit (2026-10-29)

Facts (`docs/spikes/flutterflow-audit.md`):
- 24 active users and 1 paying subscriber (RevenueCat, last 28 days).
- 18 loosely typed Firestore collections.
- No reproductive logic.
- No entitlement checks.
- Open security rules.
- Exported code that is not a viable base: pages up to 4,300 lines, 143 widgets querying Firestore directly, no tests. Cleanup is about the cost of a rewrite.

**Update 2026-10-31: the Moon library was dropped, confirmed by the user.** `ui-primitives` found that `@heathmont/moon-core-tw` conflicts with the Radix primitives, so components are built on Radix with Tailwind and the tokens from the Smartbell UI Kit. The app keeps Moon's design and token names but doesn't use Moon's code. Read "with Moon" below in that sense.

**Recommendation: A′.** Build one React + TypeScript app with Moon, served as a PWA on the web and wrapped with Capacitor for iOS and Android. Behind it, a FastAPI + Postgres backend.
- **Keep the store presence:** ship under the same bundle id `com.juanbordesontiveros.smartbell`, so existing installs update in place.
- **Keep the RevenueCat project:** use `@revenuecat/purchases-capacitor` for purchases. The backend checks entitlements through RevenueCat webhooks and its REST API, never a client-side flag.
- **Keep Firebase Auth as the identity provider:**
  - The API verifies Firebase ID tokens.
  - Existing uids, passwords and the Google and Apple logins carry over with no migration.
  - RevenueCat, OneSignal and Mixpanel history stays linked.
  - This replaces the auth card's "port the JWT auth" plan.
- **Push:** FCM through Capacitor. Keep OneSignal only if the hourly reminders need it.
- **Data:** a one-off import of Firestore into Postgres (the `legacy-firestore-import` card), using the collection mapping in the audit's §8.
- **Legacy app, right away:** lock down its security rules and rotate the OneSignal keys (the `legacy-firebase-lockdown` card). Then freeze it and stop adding features.

Why not G (a new Flutter app plus React web): there is no Flutter code worth keeping, so G means building two UIs for every screen. Capacitor keeps the store listings with one UI.
