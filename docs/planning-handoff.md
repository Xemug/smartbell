# Planning handoff (2026-10-29)

For the planner that continues Smartbell planning in a smartbell pane. Read this first, then the files it names.

## State
- **Decided:**
  - Stack A′: React + TypeScript with Moon's design and tokens (the Moon library was dropped, see the memo), PWA + Capacitor; FastAPI + Postgres; Firebase Auth kept; RevenueCat kept.
  - Ship as an update to the existing store listings.
  - The constants and scope in `docs/reconciliation-v4.md` §5.
- **Board (updated 2026-10-31):** `app-scaffold`, `design-tokens`, `core-data-model` and `icons-export` are merged (PRs #1, #2, #3, #5). `history-writer` is PR #4, waiting on the user. Backlog order and card types come from `docs/backlog.md`. Specs now use the real api package path, `app/api/smartbell/`.
- **In flight:** `repro-engine` is Building. `history-writer` (PR #4) gets one text change, then the planner merges it; the user approved.
- **Next action:** merge PR #4, steer `repro-engine` to a ready PR, and start `ui-primitives` (Up Next). Abortion and return-to-heat rules are in `docs/domain-model.md` §7.6.
  - `legacy-firebase-lockdown` stays first in Backlog; the user deferred it.
- **Worker briefs:** tick the "pass in CI" acceptance item once CI is green, before marking the PR ready. Put copy-paste terminal test commands in the PR. This machine has no Docker: use the Homebrew Postgres 14 with `DATABASE_URL=postgresql+asyncpg://juan@localhost:5432/<db>` and `SKIP_DOCKER=1`.

## Where things are
| Topic | File |
|---|---|
| What source wins per module, and the user's answers | `docs/reconciliation-v4.md` (§2, §4, §5) |
| Domain model and reproductive rules (§7 overrides §1–6) | `docs/domain-model.md` |
| Stack decision and rationale | `docs/decision-memo-stack.md` |
| Screen inventories (Figma links, fields, states) | `docs/screen-inventory.md` → `docs/design-inventory/*.md` |
| Legacy FlutterFlow app audit and the RevenueCat facts | `docs/spikes/flutterflow-audit.md` |
| Ordered backlog | `docs/backlog.md` |

## Access and resources
- **Figma (MCP):**
  - Mobile `gv5ugNqVKPF8N2Ol5cQCyV`, Web `6UCRP77ZAdWb1ut1A91yJX`, Reports `nUJCa7ZxyUPwr3J6sxato1`.
  - Smartbell 4.0 `hmrArjwi6iI4cOlPkR5hQD`.
  - UI Kit `61o8icnDCev7fz5IN4irtj`.
  - The seat rate-limits: budget about 25 calls per agent.
- **Legacy app code (read-only reference):** `/Users/juan/Development/smartbell-flutterflow/smartbell`. Firebase project `smartbell-app-2025`.
- **Google Cloud:** application-default credentials are on this machine. Firestore is readable (read-only use only; never write to the legacy project without the user's explicit OK).
- **RevenueCat (MCP):** project `projca1c5dee`.
- **Do not touch:**
  - sessions named `smartbell-design-system-*`;
  - the terminals where the user runs smartbell dev servers (spawn workers in new terminals).

## Open questions still with the user
- The permission-matrix oddities. The user tabled this on 2026-10-31; raise it before `ranch-tenancy-permissions`.
