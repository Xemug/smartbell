---
id: tasks-home
title: Tasks home: task list, new task, task detail
summary: The V4 home: tasks grouped by month and day with icons for animal-linked and assigned tasks, a red border for promo tasks, the value banner, Nuevo animal / Nueva tarea, the create-task form and task detail (Completada, Eliminar), with automatic tasks opening the event wizard.
---

# Tasks home: task list, new task, task detail

## Problem

This is the screen users open every day in V4 and in the shipped app.

## Why

It turns the engine's tasks into actions and replaces the alerts tab.

**Depends on:** `tasks-engine`, `event-launcher`, `app-shell-navigation`.

## What it touches

`app/web/src/features/tasks/*`.

**Figma:** [V 3049-9523](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3049-9523), [V 3099-9569](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3099-9569), [V 3099-9118](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3099-9118), [V 3099-10935](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3099-10935), [V 3099-10595](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3099-10595), [V 3282-10075](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3282-10075), [V 3282-10240](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3282-10240), [V 3023-8355](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3023-8355)
**Inventory:** v4-onboarding-dashboard-tasks.md §1.9–1.12; uikit-product.md S3–S4 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route. Smartbell 4.0 (V links) supersedes the older Mobile/Web frames where both exist; see `docs/reconciliation-v4.md` §2.
Per v4-onboarding-dashboard-tasks.md §1.9–1.12 and uikit-product.md S3–S4 (shipped create-task fields: name ≤60, description ≤150, category, due date). Value banner: registered × $2,100 MXN vs declared. Automatic tasks open `openEvent(...)` from event-launcher; manual ones open the detail. No snooze (not designed).

## Effort

M.

## Acceptance

- [ ] Tasks render grouped by month/day in priority order at both widths.
- [ ] A new manual task can be created, completed and deleted.
- [ ] The automatic heat task opens the heat confirmation and disappears after recording.
- [ ] Matches V 3099-9569, V 3099-10595 and V 3282-10075 (human).
- [ ] Tests for the new code pass in CI.
