# UI Kit (Copy): product content: positioning, store listing, shipped FlutterFlow screens

Source: "Smartbell UI Kit (Copy)", fileKey `61o8icnDCev7fz5IN4irtj` (call it **K**). It is a Moon design
system kit with a Smartbell cover, which was used to build the **FlutterFlow** app.
Link format: `https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=<id with - for :>`.

**Coverage:** I read the layer and text metadata for all 17 assigned pages (about 24 Figma calls in
total). I screenshotted the Spanish phone store set (whole section, then each of 4 frames at 2048px)
and the paywall. The iPad and English sets have the same text as the Spanish phone set (checked
against metadata), so I did not screenshot them separately.

## 0. Which pages hold Smartbell content

| Page | id | Verdict |
|---|---|---|
| 00 - Cover | 73:2 | Smartbell branding only: "SmartBell" + "Components UI-Kit and Style Library" with the bell logo (2 cover variants) |
| 00 - Appstore screenshots | 40935:489 | **Smartbell: the main source.** Store images for iPhone and iPad in EN and ES, two rounds (original + "Appstore images 2025.08.27"), paywall captures, Play feature graphics, the OneSignal welcome header, the app icon, and the "Flutter flow Android Smartbell app icon" |
| 00 - One Pager - resumen ejecutivo | 40899:33 | **Smartbell: the grant proposal.** 2 versions |
| 01 - User Guide & Mission | 27802:8449 | Generic Moon content (Mission/Vision of "Ambitious Labs Design Lab", values Efficiency/Agility/Quality, colour how-to). **No Smartbell content** |
| 04 - Templates | 39718:53585 | Generic FlutterFlow/Moon templates (Auth, Onboarding, Paywall, Profile, Social, E-commerce, Calendar, E-Learning, Maps, Cab booking, Music, Alarm). No Smartbell terms among 350 layer names |
| List of pages/templates | 31405:1884 | Empty page |
| Auth form 39718:53586, Login and Signup 30847:20992, Onboarding 30845:19931, Profile 30848:22194, Dashboard 30848:46674, Charts 39783:23610, Empty state 39718:60375, Sidebar 39718:58514, Date picker 39783:22482, Menu 30848:25338 | | All generic kit samples. A keyword scan (vaca, celo, rancho, parto, leche, milk, cow, tarea, registro, hato, dairy, ranch, potrero…) returned 0 hits. Some copy is placeholder ("@vishnukoux", "Crafted with love ❤️ and sulaimani", "Improve my EQ") |
| Payment and Subscription | 30848:44460 | Generic. Its "Pro Plan $59/", "$199/Month", "$1499/Year" are template placeholders, **not** Smartbell pricing |

**So:** this file holds no designed Smartbell screens as editable frames. The Smartbell UI exists only
as **device captures of the shipped FlutterFlow app** embedded as images in the store screenshots
(`tabbed milk productionESP`, `Milk production log ESP`, `task creation ESP`, `task list`,
`IMG_0759`/`IMG_0761` paywall captures taken from a TestFlight build). The screens below are
reconstructed from those captures.

---

## 1. Screens (shipped FlutterFlow app, from the store captures)

App shell, seen on S1 and S4:
- **Header** (blue): bell logo button (left); ranch dropdown, which shows the English placeholder
  **"My ranch"** even in the ES build; user avatar with a green online dot (right).
- **Bottom tab bar** with 3 tabs: **Leche** (milk drop icon) · **Tareas** (clipboard icon) ·
  **Perfil** (person-circle icon, no label visible).

### S1. Leche › Producción (milk production dashboard)
- Capture: `tabbed milk productionESP` in Screens_ESP_01 [41112:13663](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=41112-13663); EN Screens_01 41112:4086; iPad 41112:32821 / 41112:23241
- Purpose: the home screen. Shows the milk production trend and today's production entry.
- Top tabs (segmented, with icons): **Producción** (selected) · **Vacas Ordeña** / cows being milked (table icon) · **Lista Vacas** / cow list (cow icon). Only Producción is shown.
- Fields:
  | Label (es) | Gloss | Type | Req | Options / format |
  |---|---|---|---|---|
  | Intervalo de registro de producción de leche | Milk-log interval | dropdown, placeholder "Seleccionar..." | ? | values not visible (probably 7 days / month, like S2's "Últimos 7 días") |
  | Producción de leche de hoy › **Tanque** | Today's milk: bulk tank | number, suffix "Lts" | ? | litres |
  | › **Becerras** | Milk fed to calves | number "Lts" | ? | litres |
  | › **Antibiotics** (sic, English label in the ES UI) | Milk discarded from cows on antibiotics | number "Lts" | ? | litres |
- Display:
  - Line/area chart. Y axis "Producción diaria de leche" (daily milk production), shown scale 0.040–82. X axis "Time Period: [1]". 3 series with legend "[1]" (green, tank), "[Becerras]" (blue), "[Antibióticos]" (pink/red). The bracketed names are unbound FlutterFlow placeholders.
  - KPI card: tile **"Leche en tanque"** (milk in tank, drop icon) + big number **"20"** + **"lt/día por vaca"** (litres per day per cow).
- Actions: **"Registrar mi producción de hoy"** (log today's production; primary, full width) saves the 3 values for today. FAB **"+ Más"** (green, "more") opens unknown target, probably more log types or S2. Tapping the tank tile probably opens S2 (inferred).
- States: only the filled/demo state is shown. No empty, error or success states are visible.
- Navigation: entered from the Leche tab (the default tab). Exits: S2 (history), the Vacas Ordeña and Lista Vacas tabs, the header ranch switcher, the avatar, and the Tareas and Perfil tabs.

### S2. Registros de leche en tanque (tank milk log history)
- Capture: `Milk production log ESP` in Screens_ESP_02 [41112:9874](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=41112-9874); EN 41112:297; older version `milk_log_history` in 40935:510
- Purpose: list, filter, edit and delete past daily milk records. Store claim: "Consulta cualquier registro cuando lo necesites." / "Todos tus registros. Siempre organizados."
- Fields: **Filtro de registros de producción de leche** (filter of milk records), a dropdown whose value is **"Últimos 7 días"** (last 7 days). Other options not shown.
- Table columns: **Fecha** (date, d/m/yyyy, e.g. 27/8/2025) · **Lts Leche** (litres) · **Acciones** (actions).
- Actions per row: **edit** (blue pencil) opens an edit form, not shown. **Delete** (red trash): any confirm dialog is not shown.
- States: filled only. The demo shows 4 rows with the same date 27/8/2025, which suggests either more than one record per day or test data.
- Navigation: back arrow in the header returns to S1.

### S3. Crear una tarea (create task)
- Capture: `task creation ESP` in Screens_ESP_03 [41112:11769](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=41112-11769); EN 41112:2192
- Purpose: create a task or reminder. Store claim: "Crea y da seguimiento a tareas para mantener el control total." / "Tareas claras, vacas sanas, rancho productivo".
- Heading: "Llena el formulario para crear tu nueva tarea" (fill in the form to create your new task)
- Fields:
  | Label (es) | Gloss | Type | Req | Options / format |
  |---|---|---|---|---|
  | Nombre de la tarea | Task name | text, placeholder "Escribe el nombre de tu tarea" | likely yes | max **60** chars (counter 0/60) |
  | Descripción de la tarea | Task description | multiline, "Escribe la descripción de tu tarea..." | ? | max **150** chars (0/150) |
  | Categoría | Category | single-select chips with icons | ? | **Cambio de potrero** (group/pen change) · **Dieta** (diet) · **Reproducción** (reproduction) · **Salud** (health) · **Otra** (other) |
  | Fecha finalización | Due / end date | date, "dd--mm--yyyy" | ? | date picker |
- Actions: **"Crear tarea"** (clipboard icon, primary, bottom) creates the task and probably returns to S4. The back arrow cancels.
- States: empty form only.
- Navigation: entered from S4 "Agregar nueva tarea". Exits back to S4.

### S4. Tareas (task list)
- Capture: `task creation ESP` / `task list` in Screens_ESP_04 [41112:15559](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=41112-15559); EN 41112:5982; older `task list 1/2` 40935:516/518
- Purpose: daily checklist. Store claim: "Lleva el control diario y actúa a tiempo para evitar pérdidas." / "No olvides registrar, Smartbell te lo recuerda." (don't forget to log, Smartbell reminds you)
- Fields: **Filtro de la lista de tareas** (task-list filter), a dropdown with "Seleccionar...". Options not visible (probably pending / completed / by category).
- List item: clipboard icon · **[task_name]** · **dd/mm/yyyy** (due date) · **checkbox** (mark done). The values are unbound placeholders in the capture.
- Actions: tap the checkbox to complete the task. **"Agregar nueva tarea"** (add new task; pill button at the bottom) opens S3. Tapping a row probably opens the detail (not shown).
- States: filled-placeholder only. No empty state shown.
- Navigation: Tareas tab. Header has bell, ranch dropdown and avatar.

### S5. Membership (paywall)
- Capture: `IMG_0759`, `IMG_0761` in "Paywall - Inglés" [41112:38610](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=41112-38610) (also 41080:282). These are real iPhone screenshots: the status bar shows "◀ TestFlight", i.e. a TestFlight iOS build. They exist in **English only**.
- Purpose: subscription upsell.
- Content: header "Membership" with a back arrow. Hero photo of a farmer in a milking parlour.
  - Title: "Begin your journey to a more profitable farm"
  - Subtitle: "Unlock the peace of mind and support you've been looking for your farm."
  - Benefits ✓: "Full access to all premium features" · "Daily reminders related to important events in your ranch" · "A supportive, engaged community via WhatsApp"
- Fields: one toggle that switches between **"Monthly membership"** (on) and **"Annual membership"** (off). A price card shows **"Monthly 24.99"** or **"Annual 249.99"**. No currency symbol is shown; these look like store price tiers (USD 24.99 / 249.99 or local equivalent).
- Actions: **"Subscribe"** (primary) starts the store purchase. Footer links: **Privacy · Terms and Conditions · User Agreement**.
- States: the monthly and annual toggle states are shown. Purchase success/failure and restore purchases are not shown.
- Navigation: entry point unknown (probably from Perfil or from a gated feature). Back arrow exits.

### S6. Store and marketing assets (not app screens)
- Screens_ESP_05 / Screens_05 (41112:17453 / 41112:7876): mascot illustration "Vaquitas felices" (3 cartoon cows with milk) + logo. No copy.
- Ipad_04 / Ipad_ESP_05 (41112:27032 / 41112:36612): logo + illustration.
- **"Gráfico de funciones"** 1024×500 (41080:301, 41112:38926 ENG, 41113:38993 ESP): this is the **Google Play feature graphic** size. It shows the dairy farm photo, logo, 3 screen captures, and the taglines "Visualiza al instante la tendencia de tu producción" and "Tareas claras, vacas sanas, rancho productivo". The layer names are swapped: the "ENG" frame carries the ES copy and vice versa.
- **"Onesignal_welcome_header"** 1275×450 (41150:934): the same composition, sized as an email/in-app header for **OneSignal**, the push and email provider.
- **"Smartbell app icon"** 512×512 (41080:332) and **"Flutter flow Android Smartbell app icon"** 56×56 (41081:295).
- Store screenshot sizes: 1290×2796 (iPhone 6.7") and 2064×2752 (iPad 13"), in EN and ES.

### Store copy (verbatim, both languages)
| # | ES headline / sub | EN headline / sub | Screen |
|---|---|---|---|
| 1 | ¿Cuánta leche estás dejando de producir sin saberlo? / Visualiza al instante la tendencia de tu producción | How much milk are you not producing without knowing? / Visualize in realtime your production trend | S1 |
| 2 | Consulta cualquier registro cuando lo necesites. / Todos tus registros. Siempre organizados. | Consult any log when you need it. / All your logs. Always organized. | S2 |
| 3 | Crea y da seguimiento a tareas para mantener el control total. (iPad: "…para un control total.") / Tareas claras, vacas sanas, rancho productivo | Create and follow up your tasks to keep total control. / Clear tasks, healthy cows, profitable ranch | S3 |
| 4 | Lleva el control diario y actúa a tiempo para evitar pérdidas. / No olvides registrar, Smartbell te lo recuerda. | Keep a daily control and avoid loses (sic) by acting swiftly on time. / Never forget to log , (sic) Smartbell will remind you. | S4 |
| 5 | (illustration + logo) | (same) | Vaquitas felices |

---

## 1b. One-pager: "Resumen ejecutivo" (grant proposal)

Page 40899:33. There are two 612×792 (US Letter) versions, both headed "Propuesta para participar en la
co(o)nvocatoria para acceder al **Fondo Especial para la Ganadería y el Sector Lechero ejercicio 2025**"
(a proposal for the 2025 Jalisco special fund for livestock and dairy).

**Shared content**
- **Problemática** (problem): It cites the Plan Estatal de Desarrollo y Gobernanza 2024-2030 (Gobierno de Jalisco), the Danone "proyecto Margarita" and Prolea. The causes it lists are limited technification, limited technical and financial assistance, not knowing financial break-even points (v1 only), and the need for at least 3 years of intervention. Unión Ganadera de Jalisco estimates that **at least 25% of producers have abandoned the activity**.
- **Impactos esperados** (expected impact): Beneficiarios **600 productores** · Mejoras en rentabilidad **2-3x más utilidades** · Organizaciones consideradas: **Prolea San Miguel el Alto**, **San Juan de los Lagos Cooperativa Pedro Ezqueda**.
- **Equipo** (team): Juan Bordes, "Fundador, 8+ años Diseño UX" (founder, 8+ years of UX design).

**v1 "Resumen Ejecutivo_Simulador"** (40899:34): a different product
- Solución: under Modalidad 6 (emergency fund for milk-market effects), build "las interfaces amigables de un **simulador-optimizador**" (friendly interfaces for a simulator-optimiser) so that Jalisco producers can design their most profitable **marketing strategy**, maximising profit and minimising cost. It includes 4 months of training and technical support after validation.
- Presupuesto **$3.5 MdP** (MXN millions): Desarrollo de simulador $2.5MdP (72%) · Extensionismo técnico $1MdP (28%), over 4 months.

**v2 "Resumen Ejecutivo"** (40915:451): Smartbell
- Solución: same fund modality, "proporcionar **Smartbell** como herramienta de inteligencia para mejorar la **administración, gestión reproductiva y rentabilidad** de los pequeños y medianos establos" (Smartbell as an intelligence tool to improve the administration, reproductive management and profitability of small and medium dairies). It commits to **lifetime licences** and **3 years of technical support** for participating producers, and to expanding Smartbell development further.
- Presupuesto **$12 MdP**: **600 Licencias vitalicias $6MdP (50%)**, noted as "(50% descuento sobre valor comercial)" (50% off commercial value) · Extensionismo técnico $5MdP (41%) over 3 years · Vinculación Universitaria $1MdP (9%) as "Soporte científico de validación de resultados" (scientific validation of results).
- Mockups: images named "Logs", "tasks" and "02_iPhone_16_Pro_Mockup", the same captures as the store set.
- Implied price: $6MdP / 600 = **$10,000 MXN per lifetime licence at 50% off**, i.e. a commercial value of about **$20,000 MXN** per lifetime licence.

**Positioning summary.** Target user: small and medium dairy producers (pequeños y medianos establos)
in Jalisco (Los Altos: San Miguel el Alto, San Juan de los Lagos), organised through co-ops and
Prolea. Value proposition: profitability ("rancho productivo", "2-3x más utilidades", "avoid losses",
"more profitable farm"), daily control, and reminders. Channel: co-ops, technical extension, and a
WhatsApp community.

---

## 2. Flows

**F1. Log today's milk:** Leche tab (S1) → fill Tanque / Becerras / Antibiotics (Lts) → "Registrar mi producción de hoy" → chart and lt/día/vaca update (inferred).
**F2. Review/edit milk history:** S1 → (tank tile or "+ Más", inferred) → S2 → filter "Últimos 7 días" → pencil (edit) or trash (delete) → back to S1.
**F3. Create a task:** Tareas tab (S4) → "Agregar nueva tarea" → S3 → name, description, category, end date → "Crear tarea" → S4.
**F4. Complete a task:** S4 → tick the checkbox → the item is marked done (filter probably hides it).
**F5. Subscribe:** (entry unknown) → S5 Membership → toggle monthly/annual → "Subscribe" → store purchase sheet (iOS/Android IAP).
**F6. Reminder:** push notification (OneSignal) or "Daily reminders related to important events in your ranch" → probably opens S4 or S1 (deep link not shown).

---

## 3. Domain notes (as implied by the shipped app)

| Entity | Fields implied | Source |
|---|---|---|
| Ranch | name (switcher "My ranch") | S1/S4 header |
| **DailyMilkRecord** | ranch_id, date, **tank_liters**, **calves_liters** ("Becerras"), **antibiotic_liters** ("Antibiotics": milk withheld from treated cows) | S1 form, chart legend |
| Derived KPI | **lt/día por vaca** = tank litres / cows in milking (the "Vacas Ordeña" tab implies a count of milking cows) | S1 KPI "20 lt/día por vaca" |
| Cow (minimal) | lists "Vacas Ordeña" (milking cows) and "Lista Vacas" (all cows) | S1 tabs |
| **Task** | name (≤60), description (≤150), category, due_date ("Fecha finalización"), done (bool), ranch_id, created_by | S3/S4 |
| Task category enum | CAMBIO_DE_POTRERO, DIETA, REPRODUCCION, SALUD, OTRA | S3 chips |
| Subscription | plan MONTHLY (24.99) / ANNUAL (249.99; about 2 months free) | S5 |
| Premium entitlements | "all premium features", "daily reminders", "WhatsApp community" | S5 |
| Licence (grant) | lifetime licence, commercial value ≈ $20k MXN | One-pager v2 |

Rules quoted:
- "No olvides registrar, Smartbell te lo recuerda": daily logging reminders exist (push via OneSignal).
- "Daily reminders related to important events in your ranch": reminders are a **premium** benefit.
- Milk filter "Últimos 7 días": history defaults to a 7-day window.
- Character limits: task name 60, description 150.
- Annual price = 10 × monthly.

There are no reproductive rules (heat, service, calving), cow identifiers (SINIIGA) or alerts in the shipped captures.

---

## 4. Shared components seen

In the captures (FlutterFlow widgets, not Figma instances): blue app bar with back arrow; header
with bell logo + ranch dropdown + avatar with status dot; 3-tab bottom nav (Leche, Tareas, Perfil);
segmented icon tabs (Producción / Vacas Ordeña / Lista Vacas); outlined dropdown with floating label;
outlined text fields with floating label and character counter; number field with "Lts" suffix; selectable
icon chips (category); date field "dd--mm--yyyy"; full-width primary button; pill FAB "+ Más"
(mint green); KPI tile; data table with edit/delete icon buttons (blue / pink); checkbox list item
with clipboard icon; membership toggle + price card.

Figma-side instances (store artboards): `Logo` (SmartBell wordmark + bell), `Frame 243` caption
band, `Frame 227` cow-pattern background, iPhone/iPad device mockups.

---

## 5. Open questions / inconsistencies

1. The **"My ranch"** and **"Antibiotics"** labels are English inside the ES build, and the chart legend shows unbound placeholders ("[1]", "Time Period: [1]"). The shipped i18n is incomplete.
2. The paywall exists only in **English** and only as TestFlight captures. Is there an ES paywall? What currency and store tier does 24.99 / 249.99 map to?
3. The pricing models conflict. The store has 24.99/month or 249.99/year. The older web designs have Cría $15 / Destete $45 / Producción $79 USD by herd size. The grant offers a ≈$20k MXN lifetime licence. Which is current?
4. What do "+ Más" and the Vacas Ordeña / Lista Vacas tabs contain? No captures exist.
5. What is in the Perfil tab? Not captured.
6. Milk history shows 4 rows on the same date. Is more than one record per day allowed (per milking: AM/PM)?
7. Do tasks link to a cow? There is no cow field in S3, even though the categories (potrero, dieta, reproducción, salud) are per-animal concepts in the older designs.
8. Two grant one-pagers: v1 is a market "simulador-optimizador", v2 is Smartbell. Was either submitted, and is any licence commitment (600 lifetime licences, 3 years of support) binding?
9. Is the Android build live? The Play feature graphic and the Android icon exist, but there is no Android screenshot set (the iPhone set may have been reused).

---

## 6. Reconciliation with previous analysis

Compared against `docs/screen-inventory.md`, `docs/domain-model.md` and `docs/decision-memo-stack.md`.

### 6.1 What the FlutterFlow app appears to have shipped
| Feature | Evidence | Status in previous docs |
|---|---|---|
| Daily milk logging (tank / calves / antibiotics) + trend chart + lt/día/vaca KPI | S1, store shot 1, feature graphic | `MilkRecord` is "(later)", total_liters only. The memo's v1 scope (Q5) lists milk logging as "**scheduled last or parked**" |
| Milk record history with edit/delete and a date-range filter | S2 | Not in the inventory |
| Manual tasks with category + due date + completion checkbox | S3, S4 | No equivalent. The closest are `Reminder` (system-generated kinds) and the onboarding "Task hub" (A5/1.3) |
| Push reminders | OneSignal header, store copy "Smartbell te lo recuerda" | Memo puts web push second and treats mobile push as a weakness of a PWA |
| Ranch switcher, avatar/profile tab | S1/S4 header | Matches the older header pattern (bell, ranch dropdown, avatar) |
| Cow lists (milking / all) | S1 tabs | Matches Registry › Animal lists, but probably much thinner |
| Monthly/annual subscription via app stores | S5 (TestFlight) | Plans and billing are "parked" with a different price model |
| iOS (iPhone + iPad) and Android distribution | store sizes, TestFlight, Play feature graphic, Android icon | Memo assumes no app exists yet |
| WhatsApp community (human, not a notification channel) | S5 | Older docs treat WhatsApp only as a plan-gated alert channel |

Not shipped (absent from every capture): the reproductive state machine, the 7 event flows, heat,
pregnancy and calving alerts, groups/potreros management, SINIIGA registry, roles and permissions,
vaccination plan, reports/KPI catalogue, history log, dashboard "¿Cómo va el rancho?".

### 6.2 Screen-by-screen relation to the older designs (M/W/R files)
| Shipped screen | Relation | Older counterpart | Note |
|---|---|---|---|
| S1 Leche › Producción | **EXTENDS** (new module) | Dashboard tile "lts/día/vaca" (A16/A17, adr 1.1) | Milk becomes a first-class tab with 3 litre buckets, an interval filter and a chart. The older designs had only a single dashboard tile |
| S2 Registros de leche en tanque | **EXTENDS** | none | New list + CRUD |
| S3/S4 Tareas | **CONFLICTS / overlaps** | Reminders (mobile-core F), Alerts (adr 1.3-1.4), onboarding Task hub | The older designs drive work from *system alerts tied to cow events*. The shipped app uses *free-form user tasks* whose categories mirror event types (Cambio de potrero ≈ GROUP_CHANGE, Dieta ≈ DIET_CHANGE, Reproducción, Salud ≈ ILLNESS/TREATMENT). Decide whether Task is kept as a separate manual entity alongside Alert/Reminder (recommended: add `Task` to the domain model) |
| Bottom nav Leche · Tareas · Perfil | **CONFLICTS** | VACAS · GRUPOS · HISTORIAL · REPORTES · ALERTAS | Different information architecture. The older nav has no milk or task tab, and the shipped app has no groups, history, reports or alerts tab |
| S5 Membership | **CONFLICTS** | Plans E3–E5 / web 1.18 (Cría / Destete / Producción by herd size) | Flat monthly/annual store subscription versus herd-size tiers. The store subscription is what is actually live |
| Header (bell, ranch switcher, avatar) | **SUPERSEDES in style only** | Global header | Same pattern. The shipped build adds a green online dot |
| Auth / onboarding | unknown | A1–A6, web 1.1–1.7 | No captures. The kit's auth/onboarding pages are generic samples |

Nothing in this file **supersedes** the reproductive-management designs: they remain the target scope.
The shipped app is an earlier, narrower **milk + tasks MVP**.

### 6.3 Domain-model changes to propose
- Promote **MilkRecord** from "(later)" to v1. Its fields are `date, tank_liters, calves_liters, antibiotic_liters` (not just `total_liters`). Note that `dairy-milk-tracker`'s `MilkProduction` (date, amount_liters, fat %, protein %) is also milk-centric: the old web prototype, the FlutterFlow app and the KPI tile all centre on milk.
- Link `antibiotic_liters` to the existing `milk_withdrawal_until` / treatment `withdrawal_days` rule. Later this could be auto-suggested from cows under withdrawal.
- Add a **Task** entity (name ≤60, description ≤150, category enum above, due_date, done_at, created_by, optional animal_id/group_id). Optionally, tasks of category Reproducción/Salud/Dieta/Cambio de potrero could later convert into the matching Event.
- Make the billing model an open question with three candidates: store subscription 24.99/249.99, herd-size tiers, and a lifetime licence (≈$20k MXN, grant). Store IAP must be used for in-app digital subscriptions on iOS/Android.

### 6.4 Impact on the stack decision (decision-memo-stack.md)
- **The memo's premise is incomplete.** It frames the choice as "dairy-milk-tracker vs fresh". A third, **live** codebase exists: a **FlutterFlow (Flutter) app** distributed through TestFlight/App Store and with Android assets, plus OneSignal push and store subscriptions. The memo should add an option:
  - **F. Continue in Flutter** (export the FlutterFlow code, or keep building in FlutterFlow) with a backend shared with the web. *For:* existing store presence, subscribers and push are kept; it is native mobile (offline, camera, push, which suits field use); and Flutter web can cover the web designs, though not well for dense desktop tables. *Against:* FlutterFlow lock-in and generated code is hard for agent cards to maintain; Dart is a third language; and the 960+ web designs are a poor fit for Flutter web.
- **Store presence changes option A's trade-offs.** A PWA cannot replace the App Store listing or take over the IAP subscribers without a migration plan. Apple's in-app purchase rules mean a PWA would sell subscriptions on the web (Stripe) instead. If existing subscribers matter, A needs either (a) a thin native wrapper (Capacitor) to keep the store listing and IAP, or (b) a deliberate sunset/migration of the FlutterFlow app.
- **Option C (native mobile) gets stronger.** Push reminders are a headline feature ("Smartbell te lo recuerda", "Daily reminders" as the premium benefit), and on iOS web push only works when the PWA is installed.
- **Questions to add to the memo:** Which backend does the FlutterFlow app use (Firebase/Firestore or Supabase are typical)? How many active users and subscribers does it have? Must its data be migrated? Is the FlutterFlow project still editable and exportable? Is the Android app published?
- Suggested framing for the user: keep recommendation **A (or B) for the full reproductive product**, plus an explicit decision on the FlutterFlow app. Either (1) freeze it as the milk + tasks MVP and migrate its users once the new app reaches parity on milk logging, tasks and push (then publish the new app via Capacitor to keep the store listings), or (2) adopt Flutter as the mobile client (option F) with the new FastAPI backend serving both.
- Also re-open memo Q5 (v1 scope): **milk logging and tasks should not be "last/parked"**, because they are the shipped, marketed core. Parity with them is the minimum for migrating existing users.
