---
id: cow-profile
title: Animal profile (V4 MVP), event log and removal
summary: The V4 MVP animal profile (photo, breed/cross chips, Peso / DEL / Lts tiles, Genealogía / Dieta / Reproducción / Salud cards, Registros for production and weight) plus the bitácora with filters, event detail and delete rules, and the Baja flow.
verifiedAt: 2026-11-26
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

### Groomed 2026-11-26 (build notes)

- Premise holds: `/vacas/:id` was a placeholder held for this card; the API already had everything (`GET /animals/{id}` with its projection, the bitácora list/edit/delete with `deletable`, the 202 deletion request, `POST /animals/{id}/removal`, `GET /milk/cows/{id}`). The only API change: the bitácora list now names who recorded each event (`recorded_by_name`), since `/ranch/members` needs USERS_VIEW, which not every recorder holds.
- Built in `app/web/src/features/animals/profile/`: `/vacas/:id` (profile) and `/vacas/:id/registros` (Registros: Bitácora / Producción / Peso / Dieta). A phone shows one at a time; ≥960px shows both side by side.
- Banners (assumption, "as before"): sick first ("Esta vaca lleva N días enferma. Evita ordeñar para producción."), then the projection's calving window (warning tone once it has passed: "El parto se esperaba … y aún no se registra."), pregnancy-check window ("Confirma preñez …") and heat window ("Celo estimado …"). A removed animal shows only "Dada de baja por … el …".
- The event launcher doesn't exist yet (`event-launcher` depends on this card), so "Consultar historial" on Reproducción / Salud opens the bitácora filtered to that category, and on Dieta the diet history (1.11d). `event-launcher` should rewire those cards when it lands. Genealogía links to each parent's profile; there is no tree to consult yet.
- Tiles: Peso is the last WEIGHT event, else the registry's one-year / weaning / birth weight. Milking cows show DEL + Lts promedio (needs REPORTS_VIEW; a dash otherwise); dry cows show DEL + Peso al nacer; heifers, calves and bulls show Edad + Peso al nacer (DEL is cows only).
- Producción shows the per-cow stats the milk API has (average, total, days, peak); the chart belongs to `milk-screens`.
- Event detail: Editar edits comments (0/160) and Eliminar shows only on deletable events (not repro, alta or baja) for users with EVENTS_RECORD; without ANIMALS_DELETE the API files a request and the snackbar says an admin will decide.
- Baja: reason → per-reason confirm copy → success. "Registrarme en la lista de espera" (finance) opens the WhatsApp fake-door message for "Finanzas"; a new FakeDoorFeature value would need a migration, so it isn't counted yet. Error al registrar deletes the animal (204) and returns to its list.

## Effort

L.

## Acceptance

- [x] Fixture cows 00001–00007 show the banners their projections imply.
- [x] Repro events show no Eliminar; a diet change can be deleted and disappears from the log.
- [x] Baja with "Error al registrar" removes the cow from all lists.
- [ ] Matches M 1841-98715, M 1841-99061, M 1866-100732, W 2018-907783 (human).
- [ ] Tests for the new code pass in CI.
