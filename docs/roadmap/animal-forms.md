---
id: animal-forms
title: Unified animal registration form (V4): sex, stage, crossbreed, parents
summary: The V4 'Primer animal' unified form: Macho/Hembra toggle, development stage (AUTO), breed + crossbreed level + contributing breed, more/less data disclosure, parent search or inline registration, the dam-status modal, and the female reproductive section.
verifiedAt: 2026-11-21
---

# Unified animal registration form (V4): sex, stage, crossbreed, parents

## Problem

Registering animals is the most frequent onboarding step and the V4 designs reworked it for every scenario (heifer with a known mother, purchased cow, crossbreeds).

## Why

Required before any event flow can be exercised on real data.

**Depends on:** `animal-api`, `ui-surfaces-feedback`.

## What it touches

`app/web/src/features/animals/forms/*`.

**Figma:** [V 2955-9420](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-9420), [V 2955-8971](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-8971), [V 3074-10657](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3074-10657), [V 315-1902](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=315-1902), [V 734-6074](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=734-6074)
**Inventory:** v4-animal-registration-profile.md §1.1–1.10, §2 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route. Smartbell 4.0 (V links) supersedes the older Mobile/Web frames where both exist; see `docs/reconciliation-v4.md` §2.
Per v4-animal-registration-profile.md §1.1, §1.4–1.10 and flows F1–F5. Quick mode shows 4 fields; "Tengo más datos de mi animal" expands. Defaults: Holstein, General, FB, lactation 1, stage Ninguna, development AUTO. The required-field error is "Este campo es obligatorio", with the toast "Por favor, llena los datos solicitados". Parents: search by ID (autofill) or register inline. The dam-status modal appears after a heifer is saved with a dam. The female repro section has last calving, lactation cycle, repro stage + stage date. Fix F4 = 93.75% (15/16).

### Audit (2026-11-21) and decisions

- The API (`animal-api`) already takes every field: `sex`, `development_stage`, `crossbreed_level` + `contributing_breed`, inline `dam`/`sire` (`ParentCreate`) or `dam_id`/`sire_id`, and `dam_status`. No migration. The only API change: `GET /api/animals` gains a `sex` filter for the parent search.
- Files: `app/web/src/features/animals/forms/` (new), route `/vacas/nueva` (the list's "Agregar" button already points there; `?tipo=toros` starts on Macho). `AnimalForm` is reusable for `onboarding-hub`'s first-cow step.
- **Dam status:** the modal opens when Registrar is pressed for a heifer with a dam (new or found), and the heifer, the inline dam and `dam_status` go in **one request**, so a non-alive answer and the dam's baja are atomic. The V4 frame draws it over the saved summary; the copy is the same. Asked for heifers only (§7.1): a female whose reproductive section is hidden. Without `ANIMALS_DELETE` only "Viva en producción" is offered, since the other answers remove the dam (§7.8).
- **Reproductive section:** Hembra only, hidden for stages Ternera/Destetada/Novilla, and for AUTO when the birth date gives under 660 days (the API's minimum calving age). Repro stages offered: Vacía, Servida, Preñada, Seca (+ Ninguna).
- **Inline parents** take what `ParentCreate` takes: ID, birth date, breed, crossbreed level + contributing breed, SINIIGA. The V4 dam form's lactation, last calving and repro stage are not accepted by the API for a parent; they're entered on her profile later.
- **Parent search** uses `GET /api/animals?q=…&sex=…`.
- **Stage labels** use the bands the user confirmed (§7.6), not the Figma ones: Ternera <6 m, Destetada 6–12, Novilla 12–27, adult >27; Becerro <3, Destetado 3–9, Novillo 9–24, Toro ≥24.
- **Collapsing "Tengo menos datos" only hides fields:** what was entered (cross, stage, parents, weights) is still sent, and a refusal on a hidden field opens the section again. Untouched fields hold the API defaults (FB, AUTO). The reproductive inputs go only when the section applies, and are validated only then. "Ciclo de lactancia" shows 1 as a placeholder and is sent only when typed, so the API's age-based default applies otherwise.
- **After saving** the app goes to the list that shows the animal (Vacas, Vaquillas, Toros); a calf or steer has no list yet, so it goes back to the list it came from.
- **Bull seam:** `BullSection.tsx` renders in the detailed form for Macho and is empty; `mark-each-bull-as-on-the-ranch-semen-only-or-both` fills it.
- Layout: one route; sections are cards in one column under 960px and two columns from 960px.

## Effort

M.

## Acceptance

- [x] A female and a male can be registered with only name/ID + birth date. (`animalForm.test.tsx` "quick registration"; browser: male T-001 at 1280px.)
- [x] An F2 crossbreed requires a contributing breed. (`animalForm.test.tsx` "requires a contributing breed for an F2 cross".)
- [x] A heifer with a newly typed dam creates both animals; choosing 'Vendida a rastro' removes the dam. (`animalForm.test.tsx` "registers a heifer with a newly typed dam, sold for slaughter"; browser at 375px: VQ-001 in Vaquillas, dam Vacalactica only under Bajas → Venta a rastro.)
- [ ] Matches V 2955-9420 and V 734-6074 (human).
- [ ] Tests for the new code pass in CI.
