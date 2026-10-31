# Planning handoff (2026-10-29)

For the planner that continues Smartbell planning in a smartbell pane. Read this first, then the files it names.

## State
- **Decided:**
  - Stack A′: React + TypeScript with Moon's design and tokens (the Moon library was dropped, see the memo), PWA + Capacitor; FastAPI + Postgres; Firebase Auth kept; RevenueCat kept.
  - Ship as an update to the existing store listings.
  - The constants and scope in `docs/reconciliation-v4.md` §5.
- **Board (updated 2026-10-31):** `app-scaffold`, `design-tokens`, `core-data-model` and `icons-export` are merged (PRs #1, #2, #3, #5). `history-writer` is PR #4, waiting on the user. Backlog order and card types come from `docs/backlog.md`. Specs now use the real api package path, `app/api/smartbell/`.
- **Next action:** `legacy-firebase-lockdown` is rescoped and first in Up Next, waiting on the user's decisions listed in its spec. Don't start it before they answer. `ui-surfaces-feedback` can start meanwhile.
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

## Update 2026-10-31: SINIIGA

The user corrected the lockdown: SINIIGA is unique nationally. `docs/domain-model.md` §7.7 records the format and rule, taken from the technical manual. PR #9 went back to its worker to keep the live app's nationwide check through a callable that returns only available or taken. `siniiga-compliance` is a new card, and `animal-api` carries the index change. Stage 0 of `legacy/firebase/notes/deploy-runbook.md` is with the user.

## Update 2026-10-31: lockdown merged

PR #9 merged, nothing deployed. The user accepted the Stage 1 `cow_id` gap until Stage 3. `ui-surfaces-feedback` is building. Next for the user: Stage 0 of `legacy/firebase/notes/deploy-runbook.md`. Open acceptance items stay with the user: invite end to end, RevenueCat sandbox, app flows, tamper check. Raise the permission-matrix oddities before `ranch-tenancy-permissions`.

