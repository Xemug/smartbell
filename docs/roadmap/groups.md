---
id: groups
title: Groups (potreros): list, wizard, detail, delete and move cows
summary: Potrero management: list with KPI indicator, create/edit wizard with automatic or manual cow selection, detail, delete with re-homing to General, move/add cows, and computed heifer groups.
verifiedAt: 2026-11-26
---

# Groups (potreros): list, wizard, detail, delete and move cows

## Problem

Farmers organise cows into groups (General, Alta producción, Secas, Recién paridas, Enfermas) to manage diet and milking.

## Why

The Grupos tab, stall-change events and dashboard group KPIs depend on it.

**Depends on:** `animal-lists`, `events-api`.

## What it touches

`app/api/smartbell/routes/groups.py`, `app/web/src/features/groups/*`.

**Figma:** [M 1658-94285](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1658-94285), [M 1968-104045](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1968-104045), [M 1976-103201](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1976-103201), [M 1946-1757](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1757), [M 1975-306](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1975-306), [M 2005-2848](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-2848), [W 129-1430](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=129-1430), [W 164-629](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-629), [W 164-1426](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-1426), [W 164-2822](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-2822), [W 4163-164994](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=4163-164994)
**Inventory:** mobile-core.md A11, C1–C7; web-onboarding-registry.md 1.10–1.13 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per mobile-core A11, C1–C7 and web 1.10–1.13. Name ≤60, description ≤120, preset or custom, AUTO (filter by age/breed/# lactations, re-evaluated on demand) or MANUAL (two-table picker; drag on web, checkboxes on mobile). KPI indicator optional, only after ≥1 cow. Delete moves cows to General (history: "Se eliminó X potrero y las vacas se enviaron a potrero Y"). Heifer groups are computed from age/state, read-only. Moving cows writes GROUP_CHANGE events through the events API.

## Notes from animal-lists

- `animal-lists` adds a read-only `GET /api/groups` (id, name, preset). Extend it here; don't replace it.
- The bulk "move to group" action in the animal lists stays hidden until this card's group picker exists. Wire it up here.

## Decisions and assumptions (groomed 2026-11-26)

Audit: `routes/groups.py` (read-only `GET /api/groups`), the `Group` model with every wizard
field, the `GROUP_*` history keys and templates, and the `GROUP_CHANGE` event all existed. No
migration was needed. The Grupos nav entry was a V4 fake door (`built: false`); the orchestrator
confirmed flipping it to the real page.

- **Scope split:** the onboarding first-potrero wizard (mobile-core A11, web 1.10 header "Crea tu
  primer potrero", "Omitir paso") stays with `onboarding-hub`. This card builds the post-onboarding
  wizard (C3), list (C1/C2, 1.12), detail (C5, 1.13), delete (C4) and add/move (C6).
- **General** is created on first use (first `GET /api/groups` or group write) and holds every
  animal with no group. It can't be deleted or renamed. Lists show General first, then the other
  presets, then custom groups by name.
- **Moves** write one `GROUP_CHANGE` event per animal (bitácora) and one history entry per request:
  `GROUP_ANIMALS_MOVED` when every animal came from the same group, `GROUP_ANIMALS_SENT` when they
  came from several, and `GROUP_ANIMALS_ADDED` when none had a group.
  Delete writes one `GROUP_DELETED`. Moves don't re-run the repro projection (groups don't feed it).
- **AUTO rules** (`{field: AGE|BREED|LACTATIONS, values}`): matching cows come in **only from
  General**, and members that stop matching go back to General. A rule never takes an animal from
  another group (manual or AUTO), so two rules can't fight over a cow. Animals can't be added to an
  AUTO group by hand (409 `group_is_auto`). Rules re-apply on create, on rule edit, from "Revisar
  filtro ahora", and in the daily job (`smartbell.jobs.daily`, after the projection step), as the
  orchestrator asked.
- **Chips:** age and lactation chips are 1–6 and "Más" (7+). The design draws 3–6 and "más";
  1 and 2 were added because first- and second-lactation groups are common.
- **Indicator:** optional. The server refuses one on a group created with no cows
  (`kpi_needs_animals`), per C3. Figures: EN_CELO = members with a pending HEAT alert, PRENADAS =
  pregnant (GESTANTE/SECA), ENFERMAS = sick, DIM (shown as "DEL") = average days in milk of milking
  members.
- **Heifer groups** are computed from active VAQUILLA animals: Preñadas (pregnant), Servidas
  (SERVIDA), Recién nacidas (under 6 months), En desarrollo (6 months on, not served, with no upper
  age, so an unserved heifer past 16 months stays visible). A sick heifer is also in Enfermas.
- **Cow potreros hold cows only** (founder, 2026-11-26): heifers move through their groups by age
  and bulls have no group. Counts, member lists and the move actions cover VACA animals only; a
  move with a heifer or bull is refused (409 `not_a_cow`), and the heifer and bull lists offer no
  "Cambiar de potrero". Bull groups (for bulls on the ranch, in their own tab) are a separate idea
  passed to the planner, not built here.
  They're read-only, so there's no Editar/Eliminar on them (C2 draws Eliminar; not built).
- **Manual picker:** checkboxes on every screen. The web designs also drag rows across; checkboxes
  do the same job and work with a keyboard. Drag-and-drop is not built.
- **Permissions:** view = `ANIMALS_VIEW`; create = `GROUPS_CREATE`; edit, move, re-evaluate =
  `GROUPS_VIEW_EDIT`; delete = `GROUPS_DELETE`. The animal lists' bulk "Cambiar de potrero" needs
  `GROUPS_VIEW_EDIT`.

## Effort

L.

## Acceptance

- [x] Create a manual group with 3 cows; it lists them and its KPI tile shows the selected indicator. (`test_manual_group_with_three_cows_lists_them_with_its_kpi`, `groups.test.tsx` wizard test; browser QA 2026-11-26: "Lote QA" with 3 cows and Vacas en celo.)
- [x] Deleting a group moves its cows to General and writes one history entry. (`test_delete_sends_cows_to_general_with_one_history_entry`; browser QA: one `GROUP_DELETED` row in `history_entries`.)
- [x] Heifer groups list heifers by age bucket (0–6 mo, 6–16 mo, …). (`test_heifer_groups_by_age_and_state`, `groups.test.tsx` heifer test; browser QA of the Potreros vaquillas tab.)
- [ ] Matches M 1658-94285, M 1968-104045, W 129-1430, W 164-2822 (human).
- [x] Tests for the new code pass in CI. (PR #36: api, web, scripts, legacy-firebase green at 77a36f17.)
