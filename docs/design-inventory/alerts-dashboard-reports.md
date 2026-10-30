# Design inventory: Alerts, Dashboard, History, Reports

Sources:
- MOBILE `gv5ugNqVKPF8N2Ol5cQCyV`: Mobile_Alerts_Tab `1442:69865`, Mobile_Reports_Tab `2315:175535`, Mobile_History_Tab `1442:69867`, Mobile_Dashboard_Tab `1442:69868`
- WEB `6UCRP77ZAdWb1ut1A91yJX`: Web_Alerts to follow up `816:1`, Alerts from different channels `816:1866`, Web_Reports `1091:41467`
- REPORTS `nUJCa7ZxyUPwr3J6sxato1`: web page `1:122903` (same content as Web_Reports, with different node ids), mobile page `0:1`

Link format: `https://www.figma.com/design/<fileKey>/x?node-id=<id with - in place of :>`.
M = mobile file, W = web file, R = reports file.

Coverage caveat: Figma MCP rate limits stopped some calls. Every page above was read in full through `get_metadata` (layer names and text). I took screenshots of about 30 key frames. A few drill-down frames were inferred from their text layers only and are marked *(text-only)*.

Global chrome (every mobile screen): header with `Bell_icon` (notification count badge, e.g. "4"), "- Nombre Usuario -" and `Avatar`. Below it, the `Menu Rancho` dropdown "Nombre del Rancho" (ranch selector). Bottom tab bar `Footer_Mobile`: VACAS / GRUPOS / HISTORIAL / REPORTES / ALERTAS (cows / groups / history / reports / alerts). Web: top nav `Encabezado` with Inicio / Vacas / Grupos / Alertas / Historial / Reportes, a bell with a count, the user name, an avatar and a logout icon. Also a ranch dropdown ("El bigotes") and the `Boton Vacas en Sistema` pill "Vacas en Sistema | 020" (cows in system: count of active cows on the selected ranch).

---

## 1. Screens

### 1.1 Dashboard (Inicio / home), mobile
- Links: M `2137:166175` "Dashboard" (in Alerts tab page); Mobile_Dashboard_Tab `1442:69868` frames `2512:148022` Onboarding_Dashboard plus drill-downs `2512:146824`…`2512:147912`; R `1:126689` (newer variant with milk production).
- Purpose: show at a glance how the ranch is doing and give entry points to the to-do lists.
- Title: "¿Cómo va él rancho?" (How is the ranch doing?). The accent on "él" is a typo.
- KPI tiles (all tappable, each opens a drill-down list as a bottom sheet or overlay):

| Tile (es) | Gloss | Sub-values | Implied formula / data |
|---|---|---|---|
| Celos a confirmar | Heats to confirm | "02 A revisar hoy" (to check today), "00 Para seguimiento" (follow-up) | today: cows whose expected-heat window includes today and have no heat confirmation; follow-up: heat alerts from previous days still unconfirmed. Needs last heat/service/calving date, 21-day cycle, alert status |
| DIM | Days in milk | "185" | average over lactating cows of (today − last calving date). Needs calving dates and lactating status |
| Enfermas | Sick | "002" | count of cows with an open sickness event (not cured). Needs sickness/treatment events |
| Preñadas | Pregnant | "002" | count of cows whose latest pregnancy diagnosis is positive and that have not calved or aborted since |
| Vacunas y tratamientos | Vaccines & treatments | "03 Por vacunar" (to vaccinate), "01 Por tratar" (to treat) | due vaccinations (from the vaccination plan: age, frequency) plus scheduled treatment follow-ups |
| Vacas en Sistema | Cows in system | "035" | count of active animals on the ranch (cows + heifers + bulls?) |
| Calf / Bull counters | Heifers / bulls | "000", "000" (deactivated style) | counts by animal category |
| Add cow (`Add cow_small`, green "+") | Add cow | – | goes to cow registration |

- Variant R `1:126689` (360×868). Adds:
  - "Producción de Leche" (milk production): "16 lts/día promedio por vaca" (litres/day average per cow), with the inline input "Registra tu producción del día" (log today's production) / placeholder "Litros totales del día" (total litres today). Formula: herd daily litres ÷ number of milking cows.
  - "Días Abiertos" (days open): "75". Average over non-pregnant cows of (today − last calving), or for pregnant cows (conception date − calving).
  - "DEL" (días en leche = DIM): "120".
  - "Enfermas 000", "Preñadas 000".
  - Counter row: heifers 000, bulls 000, cows 002 (active).
  - Button "Registrar nueva vaca" (register new cow).
  - Hidden layers: "¿Cómo va el registro de tus vacas?" with "$4,200 Estimado actual" and "$105,000 Total Estimado extra". This looks like a value estimate from registering cows and is not visible in the screenshot.
- Annotation (shared scratch metadata, canvas `2018:179374`): "DIM • Volumen de leche producido del hato • Del día • A consultar periodo • Volumen de leche producido por vaca • Del día • A consultar periodo". Another note: "Considerar para el escenario de rancho de Carne cambiar el indicador de DIM por el de días abiertos" (for beef ranches, replace DIM with days open).
- States: populated only. No empty state for a brand-new ranch was seen on mobile.

#### 1.1.a Dashboard drill-down: Celos a confirmar (heats to confirm)
- M `2512:147249`, `2512:147689`, `2512:147775`, `2512:147834` (filter sheet).
- Overlay card with a pink header "Celos a confirmar", a close (x) button, the big count "000" and a filter icon.
- Segmented radio: "A revisar hoy" / "Para seguimiento".
- Table: ID Vaca / Grupo (both sortable). Example groups: "Alta producción", "Recien paridas" (high production, fresh cows).
- Filter sheet:
  - "Mostrar solo:" (show only) [Vacas] [Vaquillas] (cows / heifers).
  - "Día de seguimiento:" (follow-up day), radio: Hoy / Hace 1 día (6/10/2019) / Hace 2 días (5/10/2019) / Hace 3 días (4/10/2019) / Hace 4 días (3/10/2019) / Hace 5+ días (2/10/2019).
  - Button "Aplicar filtro" (apply filter).
  - Rule: follow-up = an alert generated N days ago and still unresolved, bucketed 0..5+.

#### 1.1.b Drill-down: Enfermas (sick)
- M `2512:147099`, `2512:146824` (filtered), `2512:146901`, `2512:147000` (filters).
- Table: ID Vaca / Enfermedad (disease), e.g. 00001 Mastitis, 00007 Pulmonia.
- Filter: "Mostrar solo: Vacas / Vaquillas", "Filtro por enfermedad" (filter by disease, checkbox list `Boton Text Check_Off`), then "Aplicar filtro".
- Also shows a tile "Vacunación y desarrollo" (`Icon_Vaccine`) that links to the vaccination/development plan (frames `2512:146635`–`2512:148305`). Those frames belong to the onboarding/config part, so they are covered only briefly here.

#### 1.1.c Drill-down: Preñadas (pregnant)
- M `2512:147176`, `2512:147912` (filter).
- Table: ID Vaca / Fecha estimada (estimated calving date), e.g. "05/Febrero/2020".
- Filter: "Mostrar solo: Vacas/Vaquillas", "Siguentes partos entre" (next calvings between) with a `Stepper_Slider` range (days ahead). Fecha estimada = service/conception date + gestation length. No constant appears in this part of the design.

#### 1.1.d Drill-down: Vacunas y tratamientos (vaccines and treatments)
- M `2512:147323`, `2512:147416` (filter), `2512:147525`, `2512:147600`.
- Radio: "Por vacunar" / "Por tratar". Table: ID Vaca / Grupo (e.g. "En desarrollo", "Recien nacidas", "Recien paridas": developing, newborn, fresh).
- Filter "Por vacunar": "Mostrar solo: Vacas/Vaquillas", "Rango de fechas:" (DD/MM/AAAA dropdown), "Vacunas:" ("Nombre de vacuna"). The vaccine list `2512:148305` has: IBR (Rinotraqueítis Infecciosa Bovina), DVR (Diarrea viral bovina), Clostridios, Derriengue (Rabia paralítica…), "Otra raza…" (copy bug, should read "Otra vacuna").
- Filter "Por tratar": Mostrar solo plus Rango de fechas.

#### 1.1.e User menu (avatar tooltip)
- M `2512:147999`: Configurar mi perfil, Configurar mi rancho, Administrar usuarios, Cerrar sesión, Cambiar plan, **Recordatorios** (reminders), Legal, Ayuda.
- Help: Calcula tu eficiencia, Preguntas frecuentes, Correo de soporte, Teléfono, Chat.
- Legal: Aviso de privacidad, Términos y condiciones.
- Web variant (W `1091:41627`): adds "Mensajes recibidos" (received messages). Bell tooltip W `1091:41700`: "4 Mensajes recibidos". A "Configure alerts" item exists (`1091:41706`).

### 1.2 Dashboard (Inicio), web
- Link: W `1091:41524` (R `1:123293`) "Empty_Dashboard" (populated despite the name).
- Title: "Esta es la informacion general de tu rancho." (This is your ranch's general information.) Button "Agregar Vaca" (add cow). Ranch dropdown. "Vacas en Sistema 020".
- Tiles:
  - "Vacas a seguir por celo" (cows to follow for heat): "01 A revisar hoy", "01 Para seguimiento".
  - "DIM 000 Ver más", "Enfermas 003 Ver más", "Preñadas 003 Ver más".
  - **"Distribución del hato"** (herd distribution) donut: total 20 in the centre. Legend: 03 Preñadas (pregnant), 05 Con servicio (inseminated, not yet diagnosed), 12 Abiertas (open), 03 Enfermas (sick). "Ver más".
  - Formula: reproductive status partition Preñadas + Con servicio + Abiertas = total (3+5+12 = 20). Enfermas is an overlapping health flag, not a fourth slice; the design draws it as a slice anyway (see Open questions).
- "Ver más" on DIM opens **DIM - Rangos por días** (W `1150:466`; R `1:123946` is titled "DEL - Rangos por días"; `41:4063` is "Días abiertos - Rangos por días"):
  - Range chips with counts: 0-45 (005), 45-60 (004), 60-90 (002), 90-120 (004), 120-150 (003), 150+ (002).
  - Table: ID / Raza / Estado / DIM / Grupo (sortable), e.g. 00001 Holstein Abierta 55 General.
  - Pagination plus "10 vacas por hoja". "Regresar" (back) link and close (x).
  - Error toast `Alert_Message`: "No hay resultados con los filtros elegidos, pruebe con otros" (no results for the chosen filters, try others). The spec note `2450:2`/`1:124017` confirms this is the empty-filter state.
- Footer: Preguntas Frecuentes, Ayuda, Precios, Calcula tu eficiencia, Aviso de Privacidad, Términos y condiciones.

### 1.3 Alerts list (Alertas por confirmar), mobile
- Links (M): `2149:1039` Alerts (empty / no type), `2149:1290` Alerts_Heat, `2149:1963` Alerts_Heat_Filtered, `2144:168455` Alerts_Pregnant, `2144:168678` Alerts_Delivery, `2144:168898` Alerts_Health. Type options `2149:753` "Treatment Type".
- Purpose: list the cows that the system predicts need confirmation of a reproductive or health event.
- Header: back arrow, ranch dropdown, title "Alertas por confirmar" (alerts to confirm), pill "Vacas en Sistema 035".
- Fields:

| Label (es) | Gloss | Type | Required | Options / format |
|---|---|---|---|---|
| Tipo | Type | dropdown with icon (`Dropdown Mediano`) | yes (Periodo disabled until chosen) | Celos (heats), Preñez (pregnancy), Partos (calvings), Salud (health) |
| Periodo | Period | dropdown | no | default "Todos los días" (all days); other options not drawn |

- List (`Header_Alerts_Mobile` + `Component_Alerts_Mobile` rows): columns ID Vaca ⇅ / Estado ⇅ / DIM ⇅, each sortable. Each row shows a cow icon, ID (00001), Estado ("Lactando" = lactating), DIM (000) and a **toggle switch** on the right.
- Actions: flipping a row's toggle opens the confirmation modal for that alert type (1.4). Back arrow returns to the dashboard.
- States: empty (no type chosen: grey "Selecciona", disabled Periodo, empty table header); filled; filtered (`Alerts_Heat_Filtered`, visually the same as Heat). There is no empty-result state ("no alerts") and no loading state.
- In the `2160:*_Flow` frames the title changes to "Alertas de celo por confirmar" (heat alerts to confirm) and the label to "Periodo de alertas".

### 1.4 Alert confirmation modals (follow-up actions), mobile + web
A modal card sits over the dimmed list. A stepper bar at the top (`Steper Bar n/N card top`) shows that this is the first step of a multi-step registration wizard. The later steps belong to the event-registration part.

| Kind | Frames | Title | Body copy | Buttons | Stepper |
|---|---|---|---|---|---|
| Celo (heat) | M `2160:168403`; W `824:36311` | "Registro de celo" | "La vaca **00004** está dentro de los días estimados para celo" / "¿Quieres confirmar celo?" (cow 00004 is within the estimated heat days; confirm heat?) | ‹ back, "Sí", "No entró en celo" (did not come into heat) | 1/4 |
| Preñez (pregnancy) | M `2160:168615`; W `824:36871` | "Registro de Preñez" | "La vaca **00006** está dentro de los días estimados para diagnóstico de **gestación**" / "¿Quieres confirmar su preñez?" | "No está preñada" (not pregnant), "Confirmar", "‹ Regresar" | 1/3 |
| Parto (calving) | M `2160:169123`; W `824:36593` | mobile "Registro de celo" (copy bug); web "Registro de Parto" | "Estàs confirmando el parto de la vaca **00005**" / "¿Quieres registrar el parto?" | "‹ Regresar", "Sí" | 1/3 |
| Salud (health follow-up) | M `2160:168957`; W `824:35984` | "Seguimiento de tratamiento" (treatment follow-up) | radio: "Tratamiento exitoso" (treatment successful) / "Cambio de tratamiento" (change treatment) | "‹ Regresar", "Registrar" (disabled until an option is chosen) | 1/2 |

- Web success toast (green, bottom, with an x): "Vaca 00000 Celo Registrado" / "Vaca 00000 Preñez Registrada" / "Vaca 00000 Parto Registrado" / "Vaca 00000 Estado de Salud Registrado" (cow 00000 heat / pregnancy / calving / health status registered).
- Mobile frame `2160:168957` contains a frame named "01_Cow_Illness_Diagnostic_Mastitis". The health flow continues into the illness/treatment wizard.
- Follow-up actions in the design: confirm (Sí / Confirmar), negate (No entró en celo / No está preñada), go back (Regresar), treatment outcome (exitoso / cambio). **No snooze, dismiss, "done" or "open cow" action is drawn** (see Open questions).

### 1.5 Alerts list, web
- Links: W `816:297` (Celo), `816:691` (Preñez), `816:1342` (Parto), `816:1604` (Salud); modal frames `824:*`.
- Coloured header bar per type: "Alertas de celo por confirmar" (pink), "Alertas de preñez por confirmar", "Alertas de parto por confirmar", "Alertas de salud para confirmación y seguimiento" (health alerts for confirmation and follow-up).
- Controls:
  - "Periodo de alertas" dropdown (default "Todos los días").
  - "Cambia el tipo de alertas a revisar" (change alert type): tab buttons Celo / Preñada / Parto / Salud with icons. The active one is white and the others are greyed.
  - Date heading "31 / Oct / 19" (the list is grouped by alert date).
- Table: ID Vaca ⇅ / Raza ⇅ / DIM ⇅ / Grupo ⇅ plus a toggle. Example: 00001 Holstein 187 General.
- Pagination (‹ 1 00 00 ›) plus "10 vacas por hoja". Calf/bull counters (008 / 002) top left.
- Annotation W `1497:1` (reminders scope): "Todas aquellas tareas que queden incompletas o requieran seguimiento o recordarle al ganadero: • Alertas por eventos de salud y reproducción • Tareas del onboarding * • Seguimiento de tratamientos en vacas enfermas * • Seguimiento de proceso reproductivo * • Registro/alta de vaquilla en sistema pendiente • Revisar los celos pendientes • Recordatorios de aplicación de vacunas • Fechas de vencimiento de facturación (Plan contratado) * • Mensajes entre usuarios * — * Recordatorios en menú principal". (Everything left incomplete or needing follow-up or a reminder: health and reproduction alerts, onboarding tasks, treatment follow-ups, reproductive follow-ups, pending heifer registration, pending heats, vaccine reminders, billing due dates, user-to-user messages. * = reminders in the main menu.)
- W `1442:69872`: "Agregar indicador para vacas por vacunar" (add an indicator for cows due for vaccination).

### 1.6 Alerts from other channels (email, SMS, WhatsApp, web push)
- Page W `816:1866`.
- **Daily alert email** (W `1045:32` desktop, `1045:792` 320px mobile; M `2361:177314` Gmail mockup):
  - Subject: "Uno de tus ranchos necesita tu atención…" (one of your ranches needs your attention). Sender "SmartBell".
  - Hero: "Te invito a revisar tus ranchos" (I invite you to check your ranches). Other hero variants: "Cuidemos a tus vacas…", "Mejora tu rancho, tus vacas te necesitan".
  - Greeting: "Que tal <Nombre Usuario>, iniciemos juntos un buen día."
  - Intro: "Al ir a revisar tu rancho, encontramos información que es importante que confirmes, así que dirígete cuanto antes a Smartbell y confirma si nuestras sospechas son ciertas."
  - Four sections, each a table ID Vaca / Rancho:
    1. "Vacas enfermas": "Según los registros que tenemos, las siguentes vacas siguen enfermas, o están en periodo fuera de producción, **recuerda separarlas y evitar ordeñarlas.**"
    2. "Vacas en celo": "Según nuestros cálculos las siguientes vacas están en **días de celo.**"
    3. "Vacas gestantes": "…están **probablemente preñadas**."
    4. "Vacas por parir": "…están **próximas a parir**."
  - Closing: "Recuerda que es importante que nos confirmes estos eventos…". CTA button "Ir a Smartbell". Footer with address.
  - Spec `1034:51031`: "Información a mostrar en correos de alertas: 1. Asunto 2. Encabezado e ilustración 3. Descripción de las alertas a atender 4. Listado de ID de vaca y su rancho a atender 5. Boton a SmartBell 6. Footer".
  - The email is **multi-ranch**: a single digest lists cows across ranches (Rancho column).
- **SMS / WhatsApp** (screenshots `818:36889`, `1068:2`; sender "Smartbell Alerts" "+14803002774"):
  - "Buen día <nombre de usuario> !!! Tenemos información de salud y reproducción que es importante confirmar, ve a Smartbell y confirma si nuestras sospechas son ciertas."
  - "Buen día <nombre de usuario> !!! Los registros en tu rancho nos arrojan vacas enfermas ó en periodo fuera de producción, recuerda separarlas y evita ordeñarlas. Ve a Smartbell y confirma si esta información es correcta."
  - Tone variants: "Hey que tal <nombre de usuario> !!! Recuerda que tus vaquitas no se cuidan solas, algunas estan enfermas…" and "A darle <nombre de usuario> !!! Algunas vacas parecen estar enfermas…".
- **Web push** (W `1068:139`, `1068:405`): bell icon, text and two `Boton 48h` buttons (labels not readable). Example: "Don Jacintó, ya tiene una nueva vaquilla en su rancho las pitallas!!! Pedró confirmó que la vaca ID 1059 acaba de parir, felicidades!!! :D".
- **Push templates matrix** (W around `1068:696`–`1068:729`). Categories: Reproducción → Partos, Celos, Gestaciones; Salud → "Enfermedades, tratamientos, vacunas y periodos fuera de producción". Each has three pluralisation variants: one item registered by one user / several by one user / several by several users.
  - Partos: "Don Jacintó, ya tiene <una n=1> nueva vaquilla en su rancho las pitallas!!! Pedró confirmó que la vaca <ID vaca> acaba de parir…"; "…<unas n=2> nuevas vaquillas… <Nombre usuario> confirmó los partos correspondientes…"; "…<Sus colaboradores - usuarios n=2> confirmaron los partos correspondientes…".
  - Celos: "Don Jacintó, <una n=1> vaca en su rancho las pitallas hay que revisarla por celo el día de hoy!!! **Recuerde que cada celo perdido hay que esperar 21 días**" (plural: "<unas n=2> vacas…").
  - Gestaciones and Salud: the template copy is a placeholder (duplicated from Partos).
- Channel cadence specs:
  - `1068:736` "Escenarios para notificaciones vía mail": Alertas de salud y reproducción (**Diario**, daily); Fechas de mantenimiento; Eventos inesperados; Recordatorios de facturación (anual o mensual); Invitación a ver los indicadores y reportes (Mensual).
  - `1068:87` "Escenarios para notificaciones SMS, web y push":
    - Promociones (monthly).
    - Re-engagement "En Smartbell te extrañamos, tu rancho virtual esta casí abandonado" (after 3 months without use; monthly/quarterly).
    - New features (quarterly).
    - Billing reminders.
    - Reports invitation (monthly).
    - Nearby Smartbell events, geolocated (monthly).
    - Maintenance dates.
    - Unexpected incidents.
    - Policy changes and legislation (annual).
    - Industry and partner events (monthly).
    - Government programmes (annual/quarterly).
  - `1068:737` "Boletin Smartbell Digest (Cada mes vía email)": promos, features, events, policy, industry, government programmes.
  - `1068:86` "Escenarios para alertas y mensajes": define send frequency (ask the user after the first month, then every 6 or 12 months); keep a master message file; seasonal/patron-saint illustrations; short and humorous copy so ranchers build the confirmation habit; define the info type (salud, promoción, reproducción, mixto); **limit messages to 260 characters**.
  - `1068:735` "Consideraciones para archivo maestro de notificaciones": priority, frequency, send time, format and channel, target section of the platform (deep link).
- Channel opt-in (onboarding page `2018:179374` "Onboarding_Web_Alerts_Configuration", other agent's scope): "!Genial! Ahora, selecciona el canal para comunicarnos contigo". Options:
  - SMS: "Un mensaje de texto se te hara llegar a tu celular… como parte de tu membresía. Ver membresías". SMS is a paid membership feature.
  - email: "Te enviaremos un correo electronico cuando alguna de tus vacas necesite de tu atencion…"
  - Web alert: "Te aparecera una notificacion en tu navegador… ¡altamente recomendada!"
  - Push notification: "Esto es una notificacion igual a las otras aplicaciones… ¡Super practica!"

### 1.7 History (Historial de eventos), mobile
- Links (M, page `1442:69867`):
  - `2440:122` list
  - `2509:147154`/`2509:147262`/`2509:147836` period picker
  - `2505:399` filter sheet
  - `2505:716`, `2505:1211`, `2505:1490` Reports_UserFilter_Selection
  - `2505:943`, `2509:146673` Reports_UserFilter_Filtered *(text-only)*
  - Dropdown option lists `2505:670`, `2505:690`, `2505:1436`
  - Event cards `2509:146555`, `2511:146306`, `2509:146984`
  - Card type legend `2512:146368`/`69`/`70`
  - Spec `2483:159082`, `2512:146306`
- Purpose: audit log of every action by every user on the ranch.
- Header: "Historial de eventos" (event history), link "Periodo historial" (history period; opens a date-range picker), search field "ID" with a magnifier, filter button `Button_Filter`.
- Table: Usuario ⇅ (avatar + name) / Fecha ⇅ (dd/mm/aaaa) / Evento ⇅. A left colour bar marks the category (pink = reproduction, green = health, light blue = cattle/stall, dark blue = ranch).
  - Examples: Roberto "Alta Rancho nuevo"; Juan "Confirmación Celo"; Sebastian "Preñez"; Ignacio "Cambio potrero"; "Cambio dieta"; "Vacuna"; "Mastitis".
- Filter sheet:
  - "Usarios a revisar" (users to review; typo "Usarios"): dropdown "Todos los usuarios" with Dueño, Adminstrador, Médico, Técnico de campo, Nutriólogo (owner, administrator, vet, field technician, nutritionist).
  - "Eventos realizados" (events performed):
    - "Tipo de evento" dropdown: Todos los eventos / Con Ganado / Con Usuarios / Con Dispositivos / De Reportes / De Finanzas / De Rancho / De Salud.
    - "Evento" dropdown (depends on the type). For "Con Ganado": Alta animales, Baja animales, Edición de animales, Editar potreros, Cambio de potrero, Eliminar potreros, Agregar potreros. Also seen: "Alta vaca", "Alta vaquilla", "Alta toro".
  - "Aplicar filtro" (disabled until a change is made).
- Period picker: "Seleccionar Fecha Inicio", then the end date. Calendar with Borrar / Cancelar / OK.
- Event detail card (`Event_log_card`), opened by tapping a row: "Evento: <name>", Fecha, Tipo de evento, Descripción, Usuario (avatar + full name), then entity links:
  - Type A: list of "Vaca ID" links (e.g. 00003, 00006), each opening the cow profile.
  - Type B: link to an entity (potrero or rancho).
  - Type C: list of users with avatars.
  - Examples: "Evento: Accidente / De salud / Se accidentaron **2** animales"; "Evento: Alta de Usuarios / Con usuarios / Se dieron de alta 2 usuarios" (Sebastian Ignacio, Juan Ardiola); "Evento: Edición de potrero / Se editó el potrero general".
- Scenarios spec `2483:159082` / `2512:146306` (full enumeration in Domain notes 3.5):
  1. Per-user history, entered from the "última actividad" (last activity) user list.
  2. General history.
  3. Filter by user role.
  4. Filter by event type.
  5. Expand the history view.
  6. Change the date range.

### 1.8 Reports, mobile (Básicos)
- Links (M, page `2315:175535`):
  - `2334:5573` main
  - `2398:178592` date picker open
  - `2398:178866` calendar
  - `2361:176828` with range set
  - Category expansions: `2334:6322` (Celo), `2379:1167` (Preñez), `2397:176998` (Enfermas), `2396:176380`/`2398:176920`/`2398:177117`/`2398:177414` (Partos, unit toggles)
  - Details: `2361:176082`, `2380:176756`, `2380:176927`, `2398:177692`, `2398:177933`, `2397:177291`, `2397:177531`, `2379:1534`, `2398:178106`
  - Cow lists: `2380:177190`, `2398:178252`
  - Advanced: `2334:5855`
- R mobile page `0:1` contains the same set (`1:126787`…`1:129207`).
- Header controls:
  - "Periodo de reporte" link. Once set, shows the range pill "13 Mar / 28 Mar". Tapping it opens the calendar "Seleccionar Fecha Inicio" (start date), then the end date. Calendar buttons: Borrar (clear), Cancelar, OK. Days after "today" are disabled.
  - Animal-type counters (`Cow/Calf/Bull Counter_*_mobile`): Vacas 003 (active/selected), heifers 000, bulls 000. These probably filter the report population by category.
  - Toggle "Básicos | Avanzados" (basic / advanced).
- Category cards (each with a chevron ›; expanding shows sub-KPIs, see the KPI catalogue in 3.4):
  - **Celo**: "004 Confirmados / 005 Esperados" (heats confirmed vs expected).
  - **Preñez**: "003 Diagnósticos / 003 Esperados" (pregnancy diagnoses vs expected).
  - **Partos**: "001 Confirmados / 001 Esperados" (calvings confirmed vs expected). The expanded mobile card wrongly reads "Diagnósticos".
  - **Enfermas**: "002 Tratadas / 001 En espera" (treated vs waiting/withdrawal).
- Footer tile "187 DIM" (herd average DIM). Link "Descargar mi reporte ⤓" (download my report), which opens the format modal (W `1166:32`).
- Expanded cards (each sub-KPI has "Ver más", which opens the detail):
  - Celo → "Eficiencia detección de celo 65%" (heat detection efficiency), "Celo a 45-60 días postparto 2" (heats at 45–60 days postpartum).
  - Preñez → "Servicios Realizados 2/4" (services performed), "Tasa de concepción primer servicio 40%" (first-service conception rate), "Servicios por concepción 2" (services per conception).
  - Partos → "Tiempo entre partos 15.6" (calving interval) with a Meses|Días toggle; "Edad Primer Parto 27.6" (age at first calving) with a Meses|Años toggle; "Días entre parto y primer servicio 75" (days calving to first service).
  - Enfermas → "Desechadas total 2" (total culled), "Desechadas por problemas reproductivos 1" (culled for reproductive problems).
  - Some cards show a "Contratar" (subscribe) layer, so certain KPIs are gated by plan.
- KPI detail sheet (common layout):
  - Coloured title bar with close (x).
  - Optional unit toggle.
  - "Mejora en el periodo X% ▲" (improvement in the period).
  - Trend line/area chart over the period.
  - Benchmark gauge (`Stepper_Slider3`) with the value pin and bands "Malo / Aceptable / Bueno / Excelente".
  - Coaching card with a headline and 3 bullets. The headline changes with the band: "Felicidades - Usuario - ¡Vas muy bien!", "Güero ¡Recuerda!", "Hijole güero ¡Hay que mejorar!", "Ah jijo, güero ¡Hay que mejorar!", web "¿Que pasó? ¡Pongalas a trabajar!", "¡Eaah! ¡Ahí la llevas!", "Felicidades mano ¡Vas muy bien!".
  - Optional distribution table/histogram that drills down to a cow list.
- Cow-list drill-down (M `2380:177190`, `2398:178252`, height 990):
  - Title of the KPI, "Vacas en Sistema", `Button_Delete` (x).
  - Table ID Vaca / Estado / DIM (e.g. Lactando 000), or for days-to-first-service: ID Vaca / Fecha 1er servicio / Días (00001 75, 00002 73…).
  - Pagination.
- Avanzados (M `2334:5855`, R `1:129207`): "Ingresos del periodo $ 000,000.00" (income for the period), "Inventario total 0000" (total inventory, i.e. ear-tag devices), "Cría" (breeding/genetics) "Consulta el árbol genealógico de tu hato" (view your herd's family tree). "Contratar" buttons (paid modules).

### 1.9 Reports, web
- Links:
  - W `1091:41926` Básico (R `1:123396`)
  - `1127:349`/`1127:0` toggle variants (R `1:123548`/`1:123698`)
  - `1095:412` Avanzados (R `1:123848`)
  - Detail popovers `1129:42798` (heat efficiency), `1138:43008`/`1137:42951`/`1146:42942` (calving interval months/days), `1146:42860`, `1148:43596` (services), `1148:42886` (services per conception, wide), `1146:43016` (age at first calving), `1144:42852` (days to first service, wide), `8173:164547` (lactation number)
  - Cow lists `1148:43196`, `1150:57`
  - Download modal `1166:32`
  - DIM ranges `1150:466`
- Header:
  - Tile "DIM 187 ver más", which opens DIM - Rangos por días.
  - Ranch dropdown.
  - Period text "Del **31-Oct-19** al **04-Nov-19**".
  - "Vacas en Sistema 020" plus counters heifers 008 / bulls 002.
- Tabs: **Básico** | Avanzados.
- Básico grid (row = category, then its sub-KPIs inline, each with an info "i" dot coloured by band: red, orange, green):
  - Celo 004 Confirmados / 005 Esperados | Eficiencia detección de celo 65% (orange) | Celo a 45-60 días postparto 2.
  - Preñez 003 Diagnósticos / 003 Esperados | Servicios Realizados 2 /4 (red) | Tasa de concepción primer servicio 40% (red) | Servicios por concepción 2 (red).
  - Partos 001 Confirmados / 001 Esperados (red) | Tiempo entre partos 467 (Meses|**Días**) (red) | Edad Primer Parto 2.3 (Meses|**Años**) (orange) | Días entre parto y primer servicio 75 (green).
  - Enfermas 002 Tratadas / 001 En espera | Desechadas 2 | Desechadas por problemas reproductivos 1.
  - Button "Descargar mi reporte".
- Avanzados: three module cards, each with "Leer más" and "Descargar Reporte":
  - **Finánzas**: Ingresos, Egresos, Utilidad Bruta, Impuestos (income, expenses, gross profit, taxes).
  - **Aretes inteligentes** (smart ear tags): Inventario total, Asignados, Por asignar, Con fallas (total, assigned, unassigned, faulty).
  - **Genética**: "Consulta el árbol genealógico de tu hato."
  - A pricing chip appears in R `1:123848`: "Cría $15Usd/Mes Contratar"; other labels "Destete" (weaning), "En producción".
- Download modal (W `1166:32`): "¿En que formato deseas descargar tu reporte?" with checkboxes XLS (checked) and PDF, "‹ Regresar", "Descargar". The spec lists XML, CSV, PDF and XLS.
- "Número de Partos o ciclos de lactancias" (`8173:164547`): histogram of No. de vacas by Lactancia No. 1..9.

---

## 2. Flows

### F1 Confirm a heat alert (mobile)
1. Dashboard → tap "Celos a confirmar" (or tab ALERTAS) → Alertas por confirmar.
2. Tipo = Celos → list loads (Periodo default "Todos los días").
3. Flip a cow's toggle → modal "Registro de celo" (1/4).
4. "Sí" → heat registration wizard (steps 2–4, per annotation: clean heat? → inseminated? → voluntary waiting period? → event saved). Or "No entró en celo" → event "No entró en celo" saved. Or ‹ → closes the modal.
5. Web: a success toast "Vaca 00000 Celo Registrado" and the row leaves the list.

### F2 Confirm pregnancy (diagnosis due)
List with Tipo = Preñez → toggle → "Registro de Preñez" (1/3). "Confirmar" → pregnancy diagnosis wizard. "No está preñada" → negative diagnosis, so the cow returns to open and gets a new heat expectation. "Regresar" → list.

### F3 Confirm calving
List with Tipo = Partos → toggle → "¿Quieres registrar el parto?" (1/3). "Sí" → calving wizard: "¿El parto fue exitoso?" Sí (before / after expected) or "No, abortó" → "¿Cómo sucedió el aborto?" Natural / Inducido. On success it prompts heifer registration. "Regresar" → reminder modal "Recuerda que mantener registros precisos hará que tu rancho sea más rentable" with "Entendido" only.

### F4 Health follow-up
List with Tipo = Salud → toggle → "Seguimiento de tratamiento" (1/2). Choose "Tratamiento exitoso" (cow cured, leaves Enfermas) or "Cambio de tratamiento" (next step: new treatment) → "Registrar" → toast "Estado de Salud Registrado".

### F5 Off-app alert → app
Daily email / SMS / WhatsApp / push → "Ir a Smartbell" (or tap the notification) → app → Alertas por confirmar (deep-link target is not specified) → F1–F4.

### F6 Dashboard drill-downs
Dashboard tile → overlay list (Celos / Enfermas / Preñadas / Vacunas y tratamientos) → filter icon → bottom sheet → "Aplicar filtro" → filtered list → x closes. Web: tile "Ver más" → full-page list (e.g. DIM - Rangos por días) → range chip → table → Regresar.

### F7 Reports
REPORTES tab → (optional) "Periodo de reporte" → calendar start → end → OK → cards update → tap › to expand a category → "Ver más" on a KPI → detail sheet (trend, gauge, advice) → (optional) tap a distribution row (e.g. "No. Servicios 1") → cow list → x. "Descargar mi reporte" → format modal (XLS/PDF) → Descargar. Toggle Avanzados → module cards → Contratar / Descargar Reporte.

### F8 History
HISTORIAL tab → list (default period?) → "Periodo historial" to set the range | search by ID | filter → choose user role, event type and event → "Aplicar filtro" → tap a row → Event_log_card → tap a Vaca ID or potrero link → cow profile or stall.

---

## 3. Domain notes

### 3.1 Alert kinds (enum `AlertType`)
| Value | es (mobile Tipo / web tab / email section) | Trigger (implied) | Confirmation outcomes |
|---|---|---|---|
| HEAT | Celos / Celo / "Vacas en celo" | cow is inside its estimated heat window: "está dentro de los días estimados para celo"; "hay que revisarla por celo el día de hoy" | confirmed (→ clean/dirty, inseminated or not, VWP), "No entró en celo" |
| PREGNANCY_CHECK | Preñez / Preñada / "Vacas gestantes" | due for gestation diagnosis after service: "dentro de los días estimados para diagnóstico de gestación"; "probablemente preñadas" | Confirmar / No está preñada |
| CALVING | Partos / Parto / "Vacas por parir" | estimated calving date approaching: "próximas a parir" | Sí → parto exitoso (before/after expected) / aborto (natural/inducido) |
| HEALTH | Salud / "Vacas enfermas" | cow has an open sickness or is in the milk withdrawal period: "siguen enfermas, o están en periodo fuera de producción, recuerda separarlas y evitar ordeñarlas" | Tratamiento exitoso / Cambio de tratamiento |
| (dashboard) VACCINE_DUE | Por vacunar | vaccination plan: age at first dose ("Se recomienda iniciar a los 90 días") plus frequency ("Cada 6 meses") | not designed |
| (dashboard) TREATMENT_DUE | Por tratar | scheduled treatment application | not designed |
| (reminder) HEIFER_REGISTRATION | bell counter | "Listado de vacas recien paridas con vaquillas por registrar" | go to heifer registration |

Annotation (canvas `2018:179374`) "Escenarios fechas y alertas":
- "Vaca confirmada en gestación - fecha posible de parto" (confirmed pregnant: possible calving date).
- "Vaca enferma - a separ del hato y evitar ordeña" (sick: separate from the herd, avoid milking).
- "Vaca por confirmar celo - fecha próximo celo estimado" (heat to confirm: next estimated heat date).
- "Vaca por confirmar gestación - fecha estimada para diagnóstico de gestación" (pregnancy to confirm: estimated diagnosis date).

Data captured to compute the dates: `lastHeatDate`, `isInHeat`, `pregnantDate`, `isPregnant`, `lastChildBirth`, `lactationCycle`, `reproductiveStage`. Quotes: "Se procede a calcular la fecha estimada del parto"; "Se procede a calcular la siguiente fecha de celo o de chequeo de inseminación".

"Escenarios para alerta de separación de ordeña" (milking-separation alerts): Enfermedad (all), Accidente and Tratamiento médico (only treatments that affect milking).

Withdrawal periods, "Periodo de retiro… por tratamiento" (drive how long a HEALTH alert stays active):

| Treatment | Withdrawal |
|---|---|
| Corticoides | 21 días (264 hrs) |
| Antibiótico | 2–10 días (or 8 milkings) |
| Antiséptico | 3 d |
| Antibacteriano | 1–3 d (or 4 milkings after the last dose) |
| Antimicrobiano | 3–42 d |
| Antiparasitario | 5–42 d |
| Antimicótico | 3 d |
| Quirúrgico | per diagnosis |
| Sincronización celo | 2 d |

Notes on the withdrawal table:
- "Todos los tiempos son adicionales al periodo de tratamiento, desde la última fecha de aplicación" (all periods are added after the last application date).
- When no description is given, "considerar el tiempo máximo" (use the maximum period).
- "tratamientos tópicos no presentan restricción" (topical treatments have no restriction).

### 3.2 Lead times and timing rules (quoted)
- Heat cycle 21 days: "Recuerde que cada celo perdido hay que esperar 21 días" (a missed heat costs 21 days).
- Heat alert fires on the day: "hay que revisarla por celo **el día de hoy**". It stays "Para seguimiento" while unconfirmed, with buckets "Hoy, Hace 1 día … Hace 5+ días".
- Voluntary waiting period (PEV): "0-45 días PEV" (spec `1091:41923`). "¿Se encuentra en periodo de espera voluntario?" in the heat flow.
- Expected heats after calving (spec): "45-70 1er celo, 70-90 2do celo, 90-110 3er celo, 110-130 4to celo, 130 y Más".
- KPI "Celo a 45-60 días postparto" counts first heats inside 45–60 DIM.
- Abortion vs early embryonic death: loss from about 42 days to before 260 days of gestation = aborto; before 42 days = "Muerte Embrionaria Temprana".
- Gestation length for "Fecha estimada" (estimated calving): not stated in these pages; calving copy implies an estimate exists ("Parto dentro/fuera de fecha estimada").
- Pregnancy-check lead time: not specified (needs product decision; typically 30–60 days after service).
- Daily cadence: alert email "Alertas de salud y reproducción (Diario)".
- No user-configurable lead time or send hour appears; the master-file note lists "Horario de envío" (send time) as TBD.

### 3.3 Channels
`IN_APP` (alert list, bell badge, toasts), `EMAIL` (daily digest, multi-ranch), `SMS` (membership-gated, ≤260 chars, sender "Smartbell Alerts"), `WHATSAPP` (screenshots only), `WEB_PUSH` (browser), `MOBILE_PUSH`. User opt-in per channel happens at onboarding. Message variables: `<nombre de usuario>`, ranch name, `<ID vaca>`, n (singular/plural), confirming user(s).

### 3.4 KPI catalogue (reports and dashboard)
"Period" = the selected report range (default the current month: "Descarga tu reporte del Mes… como si fuese un estado de cuenta que consultas cada mes", like a monthly account statement). Global filters: ranch, period, animal category (vacas / vaquillas / toros). Spec "Personalización: Por fecha, Por variables, Por grupos, Por Rancho, Mixtos" (by date, variables, groups, ranch, mixed).

| KPI (es) | en | Implied formula | Unit / display | Bands seen (Malo/Aceptable/Bueno/Excelente) | Data needed |
|---|---|---|---|---|---|
| Vacas en Sistema | cows in system | count active animals (ranch) | int | – | animal status |
| DIM / DEL | days in milk | avg(today − last calving) over lactating cows | days (185/187) | – | calving dates, dry-off |
| DIM rangos | DIM distribution | count of cows per bucket 0-45, 45-60, 60-90, 90-120, 120-150, 150+ | counts plus list (ID, Raza, Estado, DIM, Grupo) | – | as above |
| Días abiertos | days open | avg days from calving to conception (or to today if open) | days (75) | – | calving, conception dates |
| Producción de leche | milk production | herd litres per day ÷ milking cows | lts/día/vaca (16) | – | daily litres input |
| Distribución del hato | herd distribution | count by repro status: Preñadas / Con servicio / Abiertas (+ Enfermas flag) | donut | – | repro status, health |
| Celo Confirmados / Esperados | heats confirmed / expected | confirmed = heat events in period; expected = heat alerts generated in period | 004 / 005 | – | heat alerts, heat events |
| Eficiencia detección de celo | heat detection efficiency | confirmed heats ÷ expected heats ×100 (or services ÷ eligible 21-day cycles) | % (65%) | <45 Malo, 45–60 Aceptable, 60–75 Bueno, 75–95+ Excelente | heats, expected cycles |
| Celo a 45-60 días postparto | heats 45–60 DIM | count of cows with first heat between 45 and 60 days after calving | int (2) | – | heat dates, calving dates |
| Preñez Diagnósticos / Esperados | pregnancy diagnoses / expected | diagnoses registered vs diagnoses due in period | 003/003 | – | services, diagnoses |
| Servicios Realizados | services performed | inseminations or natural services in period, shown as "services / confirmed heats" | "2/4" (chart: "4 celos confirmados", "2 servicios realizados"; daily line chart) | – | service events, heat events |
| Tasa de concepción primer servicio | first-service conception rate | cows pregnant from their 1st service ÷ cows given a 1st service ×100 | % (40%) | <50 Malo, 50–55 Aceptable, 55–65 Bueno, 65–70+ Excelente | service number per lactation, diagnosis result |
| Servicios por concepción | services per conception | total services ÷ number of conceptions (herd avg) | # (2) | (gauge reused from TCPS, bug) | services, conceptions |
| ↳ distribution table | | No. de vacas by No. Servicios 1,2,3,4,5,6,7,8,>8 (e.g. 9,5,4,2,--); rows coloured green (1–2), orange (3–4), red (5+); No. Servicios is a link to the cow list | | | |
| Partos Confirmados / Esperados | calvings confirmed / expected | calvings registered vs calvings due (estimated date in period) | 001/001 | – | estimated calving dates |
| Tiempo entre partos | calving interval | avg days between consecutive calvings per cow | days 467 (web) / months 15.6 (mobile); toggle Meses/Días | days axis 395–480 (lower is better; ticks 420/435/450/465); months axis 13–16 | calving history |
| Edad Primer Parto | age at first calving | avg(first calving date − birth date) | months 27.6 / years 2.3; toggle Meses/Años | 27 / 26 / 25 / 24 months (lower is better) | birth date, first calving |
| Días entre parto y primer servicio | days calving to first service | avg(first service date − calving date) | days (75) | ticks 90 / 80 / 70 (lower is better) | service and calving dates |
| ↳ histogram | | No. de vacas by "Días a primer servicio" bins 70-75 (9), 75-80 (5), 80-90 (4), >90 (2) → list ID Vaca / Fecha 1er servicio / Días | | | |
| Enfermas Tratadas / En espera | sick: treated / waiting | treated = sickness events with treatment in period; en espera = not yet treated or in withdrawal | 002/001 | – | sickness, treatment |
| Desechadas total | total culled | count of exits with reason culling/death/sale-to-slaughter in period | int (2) | – | exit events and reason |
| Desechadas por problemas reproductivos | culled for repro problems | culled with reproductive reason (spec: shown as %) | int (1) / % | – | exit reason |
| Número de partos / ciclos de lactancia | lactation number distribution | count cows by lactation number 1..9+ | histogram | – | lactation count |
| Mejora en el periodo | improvement in period | (KPI this period − KPI previous period) ÷ previous, with ▲/▼ | % | – | previous-period KPI |
| Benchmark copy | – | "Tu rancho detecta 2% mas celos que el rancho promedio de Jalisco" | – | – | regional averages by state |
| Avanzados: Ingresos del periodo, Egresos, Utilidad Bruta, Impuestos | finance | sums of income/cost records in period; gross profit = ingresos − egresos | $ | – | finance module |
| Avanzados: Aretes Inventario total, Asignados, Por asignar, Con fallas | ear tags | device counts by status | int | – | device module |
| Avanzados: Genética | genealogy | sire/dam tree | – | – | parentage |

Spec "Reporte Default/Básico" (`1091:41924`), contents of the download:
- Header: No. Vacas y Vaquillas, DIM general.
- 1st section: Celos estimados, Celos confirmados, # Inseminaciones realizadas, Gestaciones estimadas, Gestaciones diagnosticadas, Partos estimados, Partos confirmados.
- 2nd section: Intervalo entre partos # días, Edad al primer parto # meses, Días entre parto y primer servicio # días, Tasa de concepción a primer servicio %, Servicios por concepción # promedio, Eficiencia de detección de calores %, Vacas en celo entre 45-60 días postparto, Vacas desechadas por problemas reproductivos %.

Spec "Reporte Avanzado" (`1095:411`): No. Vacas y Vaquillas, DIM general; Módulo Finanzas, Módulo Dispositivos, Módulo Genética, Gamificación (user progress level), monthly recommendations to improve productivity, tokens earned for platform use.

Spec "Gestaciones" (`1092:41677`): Tasa de concepción a primer servicio %, Servicios por concepción (herd average). "Reporte General por grupos": by # inseminations, by insemination dates, by diagnosis dates, exitoso / no exitoso, DIM.

Future indicators (`1091:41920`): Calidad del suelo, Dispositivos funcionando, Actividad de las vacas, Rumia de las vacas.

Spec `1118:43686`: efficiency bands vary by module and membership ("según si el usuario cuenta o no con la contratación de los aretes"). Each indicator needs advice copy keyed to its acceptable/excellent thresholds.

### 3.5 History event taxonomy (spec `2512:146306`)
Card types:
- **A** = count plus list of cow IDs.
- **B** = single entity with a link.
- **C** = list of users with avatars.

| Category | Event | Type | Template |
|---|---|---|---|
| Con Ganado | Alta animales | A | "Se dieron de alta N animales" |
| | Baja animales | A/B | "…de baja N animales por venta a rastro / por venta a otro rancho / por muerte" (A); "…por error en registro" (B) |
| | Edición de animales | A | "Se editaron N animales" |
| | Agregar potrero | A | "Se agregaron N animales al potrero X" |
| | Editar potrero | B | "Se editó el potrero X" (link opens the potrero) |
| | Eliminar potrero | B | "Se eliminó X potrero y las vacas se enviaron a potrero Y" (link to Y) |
| | Cambio de potrero | A | "Se cambiaron N vacas de potrero X a potrero Y" |
| Con Usuarios | Alta / Baja / Edición de usuarios | C | "Se dieron de alta/baja N usuarios", "Se editaron N usuarios" |
| Con Dispositivos | Alta, Baja, Asignación, Cambio de batería, Mantenimiento | TBD | e.g. "Se asignaron N dispositivos, a N vacas" (table cow ID ↔ device ID) |
| De Salud | Cambio de dieta, Enfermedades, Accidentes, Tratamientos | A | "Se cambió la dieta a N animales", "Se enfermaron N animales", "Se accidentaron N animales", "Se aplicó tratamiento a N animales" |
| | Eventos de reproducción | A | "N animales se identificaron en celo", "…se diagnosticaron preñadas", "N vacas tuvieron parto" |
| | Seguimiento eventos | A | "N animales que estaban enfermas, se les cambió el tratamiento", "…se curaron exitosamente" |
| De reportes | Descarga reportes | TBD | "Descargó el reporte general / financiero / de dispositivos / de genética del periodo fecha 1 a fecha 2" |
| De finanzas | Registro ingresos | TBD | "$N ingresos por venta de N litros de leche / suero / N animales…" |
| | Registro costos | TBD | "$N gastos por compra de N kilos de concentrado / silo / forraje / animales / semen (ID toros) / maquinaria" |
| | Descarga reportes | TBD | flujo de efectivo, balance general, estado de resultados |
| De Rancho | Alta / Baja / Cambios | B | "Se dio de alta / de baja el rancho X", "Se editó el rancho X" |

- Future: "Contemplar a futuro registros en REEMO, SIINIGA y Declaraciones fiscales" (Mexican livestock/tax registries).
- User roles (enum): Dueño, Administrador, Médico, Técnico de campo, Nutriólogo.
- Bitácora rule (annotation): events the user **cannot delete**: Alta en sistema, Celo, Preñez, Parto. Events the user **can edit or delete**: Cambio Dieta, Baja, Urgencia Médica, Accidente, Enfermedad, treatment follow-ups, Cambió potrero.

### 3.6 Entities and fields implied
- **Alert**: id, ranchId, cowId, type (HEAT, PREGNANCY_CHECK, CALVING, HEALTH, VACCINE_DUE, TREATMENT_DUE), generatedAt / dueDate (list grouped by date "31 / Oct / 19"), window start/end, status (pending, confirmed, negated, follow-up), resolvedBy (userId), resolvedAt, resultingEventId, followUpDay (0..5+).
- **Notification**: channel, template id, priority, frequency, send time, deep-link section, locale vars, sentAt, userId (from the master-file spec).
- **NotificationPreference**: userId, channels[] (SMS gated by membership).
- **Cow (list projection)**: id (5-digit "00001"), raza (Holstein), estado (Lactando, Abierta…), DIM, grupo (General, Alta producción, Recien paridas, En desarrollo, Recien nacidas), category (vaca, vaquilla, toro), disease, estimated calving date, service count, first service date.
- **ReportPeriod**: start, end. **ReportExport**: format (XLS, PDF; spec also lists XML, CSV), type (general, financiero, dispositivos, genética), period.
- **HistoryEvent**: id, ranchId, userId, role, category, eventType, date, description (templated with N), refs (cowIds[], potreroId, userIds[], ranchId).
- **MilkProduction**: ranchId, date, totalLitres.
- **Vaccine plan**: vaccine (IBR, DVR, Clostridios, Derriengue, otra), first-dose age, frequency ("Cada 6 meses"), dose ("2 ml por kg").

---

## 4. Shared components seen
`Bell_icon`, `Avatar`, `Icon_KPI_Event`, `Menu Rancho`, `Footer_Mobile`, `Grid/Mobile_Smartbell_Official`, `Boton Vacas en Sistema`, `Calf Counter_deactivated`, `Bull Counter_deactivated`, `Cow Counter_activated_mobile` (and the `_mobile` variants), `Add cow_small`, `Add cow`, `Header_Alerts_Mobile`, `Component_Alerts_Mobile`, `Dropdown Mediano`, `Dropdown Chico`, `Switch Off`/`Switch On`, `Boton 40h`, `Boton 40h Deactivated`, `Boton 48h`, `Boton Regresar`, `Boton Text On`/`Boton Text Off`, `Boton Text Check_Off`, `Steper Bar 1/4|1/3|1/2 card top`, `Calendar_OneDate`, `Date_Picker_Define`, `Stepper_Slider`, `Stepper_Slider3`, `Stepper_Counter`, `Pagination`, `Button_Filter`/`Filter_Icon`, `Button_Delete`/`delete 1`, `Download`, `Event_log_card`, `Tarjeta de eventos tipo A/B/C`, `Header Table`, `Component Table`, `Alert_Message`, `more_info_icon`, `Checkbox-On`/`Checkbox-Off`, `Format_Icon`, `Encabezado`, `Footer System`, `Boton Registrar Vaca`.

Icons:
- `Icono Cows in Heat`/`Icon_Cows_Heat`, `Icon_Pregnated_Cows`/`Icono Pregnant cows`, `Icon_Calf`/`Icono Calf`, `Icon_Sick_Cows`/`Icono Sick Cows`, `Icono DIM`, `Icon_Vaccine`, `Icon_Cow_Adult`/`Vaca adulta`, `Stall`, `Report_Icon`, `Cow_Dancing`, `Cow_Glass_Milk`, `Smartbell_Logo`, `Toro`, `Cow calf`.

Category colour coding:
- Celo = pink/magenta.
- Preñez = mid blue.
- Partos = navy.
- Salud/Enfermas = mint green.

---

## 5. Open questions / inconsistencies
1. **No snooze, dismiss, "done" or "open cow" on alerts.** The only actions are confirm, negate or back. Decide whether rows link to the cow profile and whether alerts can be postponed. "Para seguimiento" with "Hace N días" buckets implies unconfirmed alerts persist indefinitely.
2. The "Periodo" / "Periodo de alertas" dropdown shows only "Todos los días"; the other options (Hoy, Esta semana, …?) are undefined.
3. Lead times are not defined for the heat window (days before/after the 21-day date), the pregnancy-check window, the calving pre-alert, or the gestation constant behind "Fecha estimada".
4. Copy bugs:
   - Mobile calving modal titled "Registro de celo"; web says "Registro de Parto".
   - "Estàs" (wrong accent).
   - "¿Cómo va él rancho?" (accent on "él").
   - "Usarios a revisar".
   - "Siguentes partos".
   - "Otra raza…" in the vaccine list.
   - "No Sigue las recomendaciónes" (mobile; web reads "Sigue las…").
   - Mobile Partos expanded card shows "Diagnósticos" instead of "Confirmados".
5. Servicios por concepción detail reuses the % gauge (40%, 50–70% ticks) from first-service conception rate, while the KPI is a ratio (≈1.5–2.5). Its real bands are missing. Same for "Edad Primer Parto" in years (2.0–2.5 axis).
6. Herd distribution donut draws Enfermas as a slice, but 3+5+12 = 20 already. Is sickness an overlay or a partition?
7. Calving interval unit: web shows 467 days, mobile 15.6 months. Pick a default and a conversion (÷30.4).
8. DIM ranges UI (0-45, 45-60, 60-90, 90-120, 120-150, 150+) differ from the spec ranges (0-45 PEV, 45-70, 70-90, 90-110, 110-130, 130+). The R file titles the same screen "DEL" and also "Días abiertos", so it is unclear whether the screen is DIM or days open.
9. "Celo Esperados" and "Partos Esperados" definitions (alerts generated vs. due dates in period) need confirmation, as does "Enfermas En espera" (untreated vs. in withdrawal).
10. "Servicios Realizados 2/4": the denominator is confirmed heats (from chart copy). Confirm that it is not eligible cows.
11. Mobile alerts list shows Estado/DIM; web shows Raza/DIM/Grupo. Mobile has no pagination; web has 10 per page.
12. Mobile alert type is a dropdown; web uses tab buttons. The web header colour changes per type.
13. Push notification buttons (`Boton 48h` ×2) have unreadable labels. Gestaciones/Salud push templates are placeholder copies of Partos.
14. The SMS/WhatsApp sender number "+14803002774" is a US number in mockups. WhatsApp is shown only as screenshots (no template spec).
15. Advanced reports: "Contratar" pricing ("Cría $15Usd/Mes") and the module gating rules are undefined. The ear-tag card has an empty illustration.
16. Benchmarks ("rancho promedio de Jalisco") imply cross-ranch regional aggregates. A data source and privacy approach are needed.
17. History: default period, pagination, and whether Médico/Técnico roles can see all events are not shown. The device, finance and report event templates are marked TBD.
18. No loading, offline or error states for alerts, reports or history, other than the web empty-filter toast.
19. The dashboard's hidden "$4,200 Estimado actual / $105,000 Total Estimado extra" (value of registering cows?) is unexplained.
20. Coverage: several drill-down frames (history filtered states `2505:943`/`2509:146673`, `2398:178106` histogram, `2397:177531`) were read only from text layers because of Figma MCP rate limits.
