# Brief for designer agents dissecting the Smartbell Figma files

Smartbell: an app for small dairy farmers to log herd operations, mainly reproductive
management (heats, inseminations, pregnancies, calvings, days open, abortions, sickness,
diet and stall changes, alerts, reminders). We are PLANNING only: do NOT write app code.

Figma files (Figma MCP is authenticated). Call create_session first with the fileKey,
then get_metadata (page id) -> get_screenshot / get_design_context per frame. Load the
figma:figma-design-to-code skill before get_design_context. Prefer get_metadata +
get_screenshot (cheap); use get_design_context only where text/fields are unreadable.
- Mobile  fileKey gv5ugNqVKPF8N2Ol5cQCyV
- Web     fileKey 6UCRP77ZAdWb1ut1A91yJX (also holds copies of mobile pages; ignore those)
- Reports fileKey nUJCa7ZxyUPwr3J6sxato1
Node link format: https://www.figma.com/design/<fileKey>/x?node-id=<id with ":" replaced by "-">

Do NOT touch, message or reuse any session named smartbell-design-system-*.
UI copy is likely Spanish: record labels verbatim (Spanish) and add an English gloss.

## Output
Write ONE markdown file: docs/design-inventory/<your-part>.md (path given in your prompt).
Do not edit any other file. Structure:

1. **Screens** - one H3 per screen/frame (group near-identical state variants under one
   screen and list them as states). For each:
   - Figma link(s) (mobile/web), frame name
   - Purpose (one line)
   - Fields: label (es) / gloss (en) / input type / required? / options or format
   - Actions: buttons, menus, gestures, and where each navigates
   - States: empty, filled, error/validation, loading, success snackbar/modal, confirm dialogs
   - Navigation: entry points and exits
2. **Flow diagram** per flow, as an ordered list of steps (screen -> action -> screen).
3. **Domain notes**: every entity and field the screens imply, enum values (event types,
   statuses, categories, alert kinds), and any business rule visible in copy or dates
   (e.g. "parto esperado = servicio + 283 dias", heat every 21 days, days open,
   alert lead times). Quote the copy that implies each rule.
4. **Shared components seen** (names of Figma component instances reused across screens).
5. **Open questions / inconsistencies** (mobile vs web differences, missing states).

Be exhaustive on fields and rules; be terse in prose. When done, reply to the planner
with the file path and a 5-line summary (hc agent send ... per your spawn message).
