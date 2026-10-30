---
id: cow-profile
title: Animal profile (V4 MVP), event log and removal
summary: The V4 MVP animal profile (photo, breed/cross chips, Peso / DEL / Lts tiles, Genealogía / Dieta / Reproducción / Salud cards, Registros for production and weight) plus the bitácora with filters, event detail and delete rules, and the Baja flow.
---

# Animal profile (V4 MVP), event log and removal

## Problem

The cow profile is where a farmer sees a cow's status and history; it also hosts the event launcher.

## Why

Event-flow cards mount on this screen.

**Depends on:** `animal-lists`, `events-api`.

## What it touches

`app/web/src/features/animals/profile/*`.

**Figma:** [V 4000-10263](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=4000-10263), [V 4048-10361](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=4048-10361), [V 3845-9789](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3845-9789), [M 1841-99061](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1841-99061), [M 1866-100732](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-100732), [W 2018-567249](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-567249)
**Inventory:** v4-animal-registration-profile.md §1.11; mobile-core.md B3–B5; event-flows.md 1.9, 1.12 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route. Smartbell 4.0 (V links) supersedes the older Mobile/Web frames where both exist; see `docs/reconciliation-v4.md` §2.
Layout per v4-animal-registration-profile.md §1.11e (MVP) and §1.11b–d (Registros, diet history). The insights in §1.11f are stretch goals (inseminations this cycle, % of herd at the same age, peak lactation day). The bitácora, event detail/delete and Baja keep the older behaviour (mobile-core B3–B5, event-flows 1.9, 1.12). Banners as before ("Celo estimado entre…"). The Reproducción and Salud cards link to the event launcher (the MVP profile has no event buttons).

## Effort

L.

## Acceptance

- [ ] Fixture cows 00001–00007 show the banners their projections imply.
- [ ] Repro events show no Eliminar; a diet change can be deleted and disappears from the log.
- [ ] Baja with "Error al registrar" removes the cow from all lists.
- [ ] Matches M 1841-98715, M 1841-99061, M 1866-100732, W 2018-907783 (human).
- [ ] Tests for the new code pass in CI.
