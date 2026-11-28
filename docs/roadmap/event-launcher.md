---
id: event-launcher
title: Event launcher and mobile event-form pattern
verifiedAt: 2026-11-27
summary: Shared EventWizard (full-screen stepper on mobile, modal on web) opened from the profile cards and from automatic tasks, with confirmation snackbars and the unsaved-data guard.
---

# Event launcher and mobile event-form pattern

## Problem

Event forms are only drawn at 1366×768; the mobile pattern is undefined, and 7 flows would otherwise each invent one.

## Why

Sets the pattern every event-flow card follows.

**Depends on:** `cow-profile`, `ui-surfaces-feedback`.

## What it touches

`app/web/src/features/events/EventWizard.tsx`, `EventLauncher.tsx`, `useRecordEvent.ts` (TanStack mutation + snackbar + query invalidation), `eventTypes.ts`, `flows.tsx`, `launcherContext.ts`, `heat/HeatPrompt.tsx`, `README.md`; `app/web/src/ui/Modal.tsx` (`fullScreen`), `app/web/src/app/AppShell.tsx` (provider), the profile's `ProfileSummary.tsx` / `AnimalProfilePage.tsx` (Registrar), both i18n catalogs.

**Figma:** [M 2005-5517](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-5517), [M 2005-31277](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-31277), [W 2018-565589](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-565589), [W 3807-170164](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=3807-170164), [W 3807-170908](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=3807-170908), [W 3807-169763](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=3807-169763)
**Inventory:** event-flows.md 1.0, 1.11; mobile-core.md D (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Launcher per event-flows 1.0 (health vs reproduction entries; reproduction entries enabled only inside the cow's current window, per "está dentro de los días estimados"). Mobile: full-screen stepper using tokens and the Wizard shell, one question per step for decision trees; web: modal per W frames. Snackbars per event-flows 1.11 (also on mobile, as the design gap fix). Connection error snackbar on failed mutation. Document the pattern in `app/web/src/features/events/README.md` with a screenshot. Entry points in V4: the profile's Reproducción/Salud cards and **automatic tasks** (e.g. the heat task opens 'Registro de Celo' with 'No entró' / 'Sí, confirmar', v4-onboarding-dashboard-tasks.md §1.12). Expose `openEvent(animalId, type, taskId?)` so a task can launch it and close itself on success.

### Assumptions and decisions (groomed 2026-11-27)

Audit: the events API (`POST /api/animals/{id}/events`, all payload types) and the projection's `next_heat` / `pregnancy_check` / `calving` windows exist; `features/events/` did not. The V4 conflict in v4-animal-registration-profile §6.3 ("launch from the profile cards or from Tareas only?") is answered by this spec: both. Confirmed with the orchestrator:

- **Entry point.** A Registrar button on the Reproducción and Salud cards opens that card's entries (bottom sheet on phones, modal on the web). Hidden on removed animals, without `EVENTS_RECORD`, and on semen-only bulls. Bulls (En rancho / Ambos) get the Salud entries only; reproduction entries are for females.
- **Entries.** Reproducción: Celo, Preñez, Parto, Aborto. Salud: Enfermedad, Accidente, Tratamiento médico, Cambio de dieta. Potrero change stays on the profile's Cambiar (#41), not in the launcher.
- **Disabled reasons (es-MX).** Outside the window: "Disponible a partir del 3 dic" when it is ahead, "Los días estimados terminaron el …" when it passed, "Fuera de los días estimados" when the projection has none. An entry whose flow card hasn't landed: "Disponible pronto" (the window reason wins). Aborto has no window.
- **The stub flow** is real: the heat task's prompt (§1.12). "No entró" records `HEAT` / `NOT_OBSERVED`; "Sí, confirmar" stays disabled until `heat-flow`.
- **openEvent(animalId, kind, taskId?)** returns a promise: true once recorded (the task closes itself), false on back-out. With a `taskId` the snackbar names the animal (1.11's "Vaca 00000 …" variant). tasks-home wires it; a stand-in task covers it in tests.
- **Snackbars.** Sentence case ("Celo registrado"), not Figma's title case. Abortion says "Aborto registrado" rather than 1.11's "Parto Registrado". Diet change, which 1.11 doesn't cover, says "Cambio de dieta registrado".
- **Leaving with data** (×, Escape, a flow's Regresar, a link or the phone's back gesture via `useBlocker`) asks with the kit's discard dialog. Changing page closes an open launcher or form.

Figma gaps: no mobile frames for event forms or snackbars (by design, this card sets the pattern); the V4 MVP profile drops the old Celo/Preñada/Parto/Salud tiles, so the Registrar buttons on the cards are ours.

## Effort

M.

## Acceptance

- [x] Opening the launcher on a cow outside any window disables the reproduction entries with a reason.
- [x] A stub event recorded through EventWizard shows the success snackbar and refreshes the profile.
- [x] Backing out with data entered asks for confirmation.
- [ ] Mobile pattern reviewed against the 1366 frames (human).
- [ ] Tests for the new code pass in CI.
