---
id: user-admin
title: User administration and permissions
summary: Users list, invite/create with role preset and per-permission tabs (Ganado, Usuarios, Dispositivos, Salud, Reportes, Finanzas), edit and delete keeping history.
---

# User administration and permissions

## Problem

Ranches have vets, nutritionists and field techs who need scoped access.

## Why

Multi-user ranches are core to the product.

**Depends on:** `ranch-tenancy-permissions`, `history-writer`.

## What it touches

`app/api/smartbell/routes/invitations.py` (routes live in `routes/`, not `api/`; invite, accept link, plan state, role presets), `app/api/smartbell/services/invitations.py`, `app/api/smartbell/services/plans.py` (the single "has Pro" check), `app/api/smartbell/services/ranches.py` (edit/remove now write history), `app/api/smartbell/security/permissions.py` (codes capped by role), migration `0005_invitations.py`, `app/web/src/features/config/users/*`, tests.

**Figma:** [M 2573-152259](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2573-152259), [M 2579-28](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2579-28), [M 1457-137410](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1457-137410), [W 871-28](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=871-28), [W 894-37699](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=894-37699), [W 906-38180](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=906-38180)
**Inventory:** mobile-core.md E8, E10; web-onboarding-registry.md 1.17 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per mobile-core E8, E10 and web 1.17. Create disabled until permissions chosen. Plan user caps are shown only when plans-billing exists.

## As built (2026-11-19)

- **Already there from `ranch-tenancy-permissions`:** list, edit and remove members. This card adds inviting, the invite link, history entries, the Pro gate, and the screens.
- **Pro gate (user decision via the planner, 2026-11-19):** inviting is a Pro feature, as in the live app (`plans-billing`). `services/plans.has_pro` is the one check: a ranch has Pro when `Ranch.plan_id` is set (the RevenueCat entitlement the legacy import copies). Without Pro, `POST /api/ranch/invitations` answers 402 `plan_required`, `GET /api/ranch/plan` says `has_pro: false`, and the screens show the upsell. "Ver planes" opens the support WhatsApp, because no purchase flow is built. Listing, editing and removing members stay free.
- **Role limits (§7.8):** a member's codes never exceed their role's preset. This is enforced on invite and edit (403 `exceeds_role`) and on every request (`effective()` ignores stored codes outside the preset). Toggles outside the preset are shown locked. Only the Dueño removes users, and the code also checks that explicitly.
- **Invite:** `POST /api/ranch/invitations` (USERS_ADD) takes name, email, optional phone, a non-Dueño role and at least one code. It returns a 256-bit token once; only its sha256 is stored. Pending invites can be listed (USERS_VIEW) and revoked (USERS_ADD). A new invite to the same email replaces the pending one. Each ranch has at most 50 pending invites, and each invite expires after 7 days.
- **Accept link `/invitacion/{token}`:** public `GET /api/invitations/{token}` shows ranch, inviter, role and status. `POST …/accept` needs a signed-in user whose email matches the invite (any case), then creates the membership with exactly the invited codes. The error codes are 409 `invitation_used`, 410 `invitation_expired`, 403 `email_mismatch` and 404 for unknown tokens. A signed-out invitee is sent to sign-up or log-in and brought back to the link (kept in sessionStorage). After accepting, the joined ranch becomes the active one.
- **History:** accepting writes `USERS_ADDED` (by the inviter), editing writes `USERS_EDITED`, removing writes `USERS_REMOVED`, all with `refs.user_ids`. Removing deletes only the membership, so the user row and every history entry they wrote stay.
- **Screens:** list (Nombre, Usuario, Última actividad, actions), Agregar Usuario with Datos Generales and Personalizar permisos (Ganado, Usuarios, Dispositivos, Salud, Reportes, Finanzas), edit, and the delete confirm with the Figma copy. Mobile (<960) shows the two parts as tabs; web shows them side by side. Create stays disabled until at least one permission is on. The plan cap ("Llevas 1 usuario de 3") is not shown, because `plans-billing` doesn't exist yet.
- **Fix outside this card:** `ActiveRanchProvider` lost `X-Ranch-Id` after mount under React StrictMode (dev), so the first write from a screen was refused with `ranch_required`. Its effect now sets the ranch again on setup.

### Assumptions (no answer needed to proceed)

- **No email is sent.** There is no email provider yet. The inviter copies the link or sends it by WhatsApp from the "¡Invitación lista!" screen. Email delivery belongs with `email-digest` or a later card.
- **No password on the create form.** The Figma form has Contraseña fields, but the spec says invite and accept link. The invitee picks their own password at sign-up, and the API holds no Firebase admin key.
- **An unverified email is accepted** at accept time: the secret token plus a matching email is enough. Firebase email sign-ups are unverified, and requiring verification would block the flow.
- **The invite's name and phone** are for the inviter's pending list. The member's profile is what the invitee typed at sign-up.
- **Figma frames were not opened.** The Figma MCP isn't authenticated in this environment, so the screens follow the design inventory (mobile-core E8, web 1.17). Matching the frames is the (human) acceptance item.

## Effort

M.

## Acceptance

- [x] Owner invites a Médico; the invitee signs up via the link and sees only permitted actions.
- [x] Editing permissions takes effect on the next request.
- [x] Deleting a user keeps their history entries.
- [ ] Matches M 2573-152259 and W 871-28 (human).
- [x] Tests for the new code pass in CI (api and web jobs; `scripts` fails on main since #16, separate card).
