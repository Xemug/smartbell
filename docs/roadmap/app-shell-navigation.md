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

**Stack note:** resolved. `app/web` is the React PWA (memo option A′), so the shell lives there and `src/app/` is new.

**Decisions and assumptions (groomed while building):**

- **Web nav is a top bar.** Frame 417-2212 draws it across the top, with the ranch dropdown on the page below it. §1.15's "Left nav" was wrong and is corrected.
- **Layout switch:** the mobile shell below the `lg` token (960), the web shell from there up, per `docs/screen-inventory.md`. Only one shell mounts.
- **Fake doors:** Grupos, Reportes and Ranchos per §1.14. Web Usuarios too, because `user-admin` is unbuilt. A card sets `built: true` in `src/app/navigation.ts` when its screen lands. Vacas has no asterisk in §3.6, so it is a link to a placeholder page. Direct visits to an unbuilt route show a placeholder page, not the modal.
- **Bell count:** on mobile the badge sits on the avatar (§1.9, where the bell is the logo); on web it sits on the bell, which links to `/config/mensajes`.
- **Number:** 52 + 333-405-6398 (§3.5) in `src/app/config.ts`, overridable at build time with `VITE_WHATSAPP_NUMBER`. `whatsapp-support` makes it configurable without a deploy.
- **Cerrar sesión** shows a snackbar until `auth` lands; there is no session to end.
- **WhatsApp button** uses dark text on the kit's green, since the drawn white fails contrast. There is no WhatsApp icon in the export (see `icons-export`), so it uses the message icon.
- **Left out, not asked for here:** the web footer, the "Vacas en Sistema" pill and the separate logout icon drawn in 417-2212.

## Effort

M.

## Acceptance

- [x] At 360px the bottom bar shows Tareas, Vacas, Grupos, Reportes, Ranchos; at 1280px the web nav shows its 6 items.
- [x] Unbuilt tabs open the fake-door modal, whose WhatsApp button has the prefilled text.
- [x] Avatar → Soporte opens WhatsApp with the prefilled message.
- [x] Playwright: navigate every tab at both widths.
- [ ] Tests for the new code pass in CI.
