---
id: app-shell-navigation
title: App shells: Tareas-first navigation (mobile tabs, web top bar), ranch switcher, WhatsApp support
summary: Mobile bottom tabs Tareas · Vacas · Grupos · Reportes · Ranchos and the web nav Tareas · Vacas · Grupos · Reportes · Usuarios · Ranchos, with the avatar menu (including WhatsApp Soporte), the ranch switcher and the 'en construcción' fake-door modal.
---

# App shells: Tareas-first navigation (mobile tabs, web top bar), ranch switcher, WhatsApp support

## Problem

Smartbell 4.0 replaced the old navigation (Alertas and Historial tabs removed; tasks are home). Every screen mounts in this shell.

## Why

Gives feature cards a place to mount and makes navigation testable end to end.

**Depends on:** `ui-surfaces-feedback`.

## What it touches

`app/web/src/app/` (AppShell, MobileShell, WebShell, routes with placeholder pages, `useActiveRanch` context stub), avatar menu items routing to config placeholders.

**Figma:** [V 3133-9247](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3133-9247), [V 3133-9276](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3133-9276), [V 805-5447](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=805-5447), [V 2951-7886](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-7886), [V 417-2212](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=417-2212)
**Inventory:** v4-onboarding-dashboard-tasks.md §1.13–1.15, §3.5–3.6 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per v4-onboarding-dashboard-tasks.md §1.13–1.14 and §3.6. Routes: `/` tasks home, `/vacas`, `/vacas/:id`, `/grupos`, `/reportes`, `/ranchos`, `/usuarios` (web), `/config/*`. Tabs whose feature is not built yet open the "Funcionalidad en construcción" modal with a WhatsApp button and prefilled copy ("Me interesa la funcionalidad {nombre}…"). Avatar menu items per §1.13, including Soporte → `https://wa.me/52…` with "Necesito que me ayuden a usar Smartbell." (the number lives in config). Ranch switcher and bell read from a stub context.

**Stack note:** the platform for UI cards depends on the memo's revised decision (A′ React PWA, or G Flutter mobile + React web). Write UI cards against the chosen client; API cards are unaffected.

## Effort

M.

## Acceptance

- [ ] At 360px the bottom bar shows Tareas, Vacas, Grupos, Reportes, Ranchos; at 1280px the web nav shows its 6 items.
- [ ] Unbuilt tabs open the fake-door modal, whose WhatsApp button has the prefilled text.
- [ ] Avatar → Soporte opens WhatsApp with the prefilled message.
- [ ] Playwright: navigate every tab at both widths.
- [ ] Tests for the new code pass in CI.
