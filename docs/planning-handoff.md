# Planning handoff (2026-10-29)

For the planner that continues Smartbell planning in a smartbell pane. Read this first, then the files it names.

## State
- **Decided:**
  - Stack A′: React + TypeScript + Moon, PWA + Capacitor; FastAPI + Postgres; Firebase Auth kept; RevenueCat kept.
  - Ship as an update to the existing store listings.
  - The constants and scope in `docs/reconciliation-v4.md` §5.
- **Board:** 51 spec'd cards in Backlog (`docs/backlog.md` is the order; specs are in `docs/roadmap/`).
- **Board cleanup:** 4 stale cards from earlier drafts need archiving: `alerts-screens`, `reminders`, `milk-records`, `flutterflow-audit`.
- **Next action (the user said "let's do it"):**
  1. Archive the 4 stale cards.
  2. `hc roadmap reorder` the Backlog to match `docs/backlog.md`.
  3. Move `app-scaffold`, then `design-tokens` and `core-data-model`, to Up Next.
  4. Start `app-scaffold`.
  - `legacy-firebase-lockdown` stays first in Backlog; the user deferred it.

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
- The state after an abortion (default ABIERTA).
- A return to heat while SERVIDA.
- The permission-matrix oddities.
- The design defaults in `docs/design-inventory/uikit-design-system.md` §6.6 (proposed defaults are in reconciliation §4.8).
