# Web: onboarding, registry, ranch/user/vaccine/alert configuration, history

Source: WEB Figma file `6UCRP77ZAdWb1ut1A91yJX`. Link base: `https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=<id>`.

Pages covered:

| Page | id | Notes |
|---|---|---|
| Onboarding_Web_Complete | 49:1364 | Master page; holds all onboarding frames, filter dropdown parts, vaccine config, error notes and the big "Notas de escenarios" board (743:30290) |
| Onboarding_Web_Alerts_Configuration | 2018:179374 | Subset copy of Complete (alert channels, login, signup, cards) |
| Onboarding_Web_Cows_registry | 2018:104156 | Subset copy (cow list + filters + New Log Cows) |
| Onboarding_Web_Stalls_Registry | 2018:260881 | Subset copy (Cow Group Configuration, KPI stall selection, stall list) |
| Onboarding_Web_User_Ranch_And_Vaccines_configuration | 2018:336099 | Subset copy (UserConfig, RanchConfig, Vaccination) |
| Web_System_Cows_Bulls_Calfs_Stalls_And_filters_and_New_Cow_Registry | 2018:877618 | System (post-onboarding) cows/heifers/bulls lists, potreros, cow profile |
| Web_System_Cow_Registry_and_Filters | 2018:622410 | Subset of the page above; no new copy |
| Web_User configuration_n_History | 850:36739 | Profile, ranch CRUD, users and permissions, plans and billing, messages, activity history |

The sub-pages are mostly duplicated frames, with node ids renumbered under `2018:*`. Below, each screen gets the Complete-page id first and a system-page id where one exists.

Method: I read metadata text layers for all 8 pages in full. I screenshotted about 25 key frames. Figma rate limits stopped further screenshots, so the remaining frames were inventoried from text layers only. Copy that sits inside component instances, such as table cell labels, is known only for the frames I screenshotted.

---

## 0. Web app shell (navigation)

Seen at [49:1443](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1443) and on every system frame. Instances: `Encabezado` (topbar), `Menu Rancho`, `Footer System` / `Footer Onboarding`.

- **Topbar (`Encabezado`, 1366x60, dark blue):**
  - Left: Smartbell bell logo and wordmark.
  - Main nav tabs, with an underline on the active tab: **Inicio** (Home), **Vacas** (Cows), **Grupos** (Groups/Potreros), **Alertas** (Alerts), **Historial** (History), **Reportes** (Reports).
  - Bell icon with a red count badge, e.g. "4". Its tooltip, "Tooltip for alerts/reminders" (600:1983), lists onboarding reminders: *Configurar alertas / Registrar mis vacas / Organizar mis potreros / Configurar mi perfil*. The variant 888:45 shows "4 Mensajes recibidos".
  - User display name ("-nombre usuario-" / "Don José Guadalupe").
  - Avatar. It opens the **user menu** "Tooltip for user configurations" (600:3470): *Configurar mi perfil* (configure my profile), *Configurar mi rancho* (my ranch), *Administrar usuarios* (manage users), *Vacunación y desarrollo* (vaccination and development), *Cambiar plan* (change plan), *Cerrar sesión* (log out). Variant 850:38974 adds *Mensajes recibidos* (Message Inbox).
  - Logout icon (exit arrow) at the far right.
  - During onboarding the nav tabs are hidden: only logo, bell, name, avatar and logout show.
- **Ranch switcher:** a dropdown "Nombre del Rancho" centered under the topbar on every screen (`Menu Rancho`). Ranch-menu variant 1010:41532 / 974:42067 lists ranches ("El Bigotes", "La Trajinera") and *Agregar Rancho +*.
- **Left sidebar:** a mint-green column 0-240px on system screens. It is **empty** in every design, a reserved area with no items. Onboarding screens have no sidebar.
- **Context row under the topbar:** a left primary CTA (e.g. "Agregar Vaca", "Agregar Usuario", "Agregar Rancho") or the Vacas/Vaquillas/Toros counter chips. On the right, a counter pill such as "Vacas en Sistema | 001", "Usuarios en Sistema | 007", "Ranchos en Sistema | 001", "Vacas en Potrero | 015" or "Potreros en Sistema | 005".
- **Footer (`Footer System`):** *Preguntas Frecuentes* (FAQ), *Ayuda* (Help), *Precios* (Pricing), *Calcula tu eficiencia* (efficiency calculator), *Aviso de Privacidad* (privacy notice), *Términos y condiciones* (terms).
- **Onboarding bottom bar:** `Boton Regresar` ("< Regresar", Back), `Boton Omitir Paso` ("Omitir Paso", Skip step), and `Boton Continuar` ("Continuar >" or a named next step such as "Configurar potreros >" or "Selección de indicador >").
- **Vacas tab section switcher:** the list header title is a dropdown (`Listado Vacas ⌄`). Options (2018:907759): *Listado vacas / Listado vaquillas / Listado toros*. In Grupos (2018:907776): *Potreros vacas / Potreros vaquillas*. The header colour changes per entity: vacas dark blue, vaquillas light blue, toros navy.
- **Animal-type counter chips** (`Calf Counter`, `Bull Counter`): two icon chips at the top left, "🐄 008" (vaquillas) and "🐂 002" (toros). The active chip is filled and acts as a switch between lists.

---

## 1. Screens

### 1.1 Log-In
- Frames: [49:1933](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1933), 854:31, 2018:901364.
- Purpose: authenticate a returning user.
- Fields:
  - *Correo* / email / text / required.
  - *Contraseña* / password / password with show/hide eye (`No show`) / required.
- Copy:
  - "¡Qué tal! Nos da gusto verte de regreso." (Hi! Good to see you back)
  - "Bienvenido de nuevo Nombre Usuario, recuerda que estamos para apoyarte a mejorar tu establo" (welcome back)
  - Side panel: "Digitalizar tu rancho aumenta tu rentabilidad" (digitizing your ranch raises profitability)
- Actions:
  - `Boton Iniciar Sesion` leads to the Dashboard, or to Onboarding cards on first login.
  - "¿Olvidaste tu contraseña?" (forgot password; no screen designed).
  - "¿Aún no tienes cuenta? Da click aquí" leads to Signup.
- Errors (note 2460:2031):
  - "Falta tu correo"
  - "Falta tu cotraseña" [sic]
  - "Formato de correo no valido"
  - "Correo y contraseña no coinciden con una cuenta registrada" (shown under the password field)
  - "Correo no registrado"

### 1.2 Signup: Form for New Account registry
- Frames: [49:1982](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1982), 2018:207073.
- Purpose: create an owner account and the first ranch together.
- Header: "Bienvenido, estás tomando una excelente decisión."
- Fields, all placeholder-labelled:

| Label (es) | Gloss | Type | Req | Format |
|---|---|---|---|---|
| Nombre de tu rancho | ranch name | text | yes | |
| Nombre (s) | first name(s) | text | yes | |
| Apellido (s) | last name(s) | text | (no error defined) | |
| Direccion de tu rancho | ranch address | text | not stated | |
| MX + 52 | country dial code | select | | default +52 |
| Telefono | phone | tel | yes | |
| correo | email | email | yes | unique |
| (password) •••• | password | password + eye | yes | min length ("muy corta") |

- Left panel value props:
  - "Digitaliza tu rancho y mejora tu rentabilidad"
  - "Mejora tu identificación de celos e incrementa tu productividad"
  - "Lleva un registro más preciso de los partos en tu hato"
  - "Identifica tus vacas enfermas, y mejora la calidad de tu leche"
  - "Mejora los días en leche"
- Actions:
  - `Registrarme` leads to Onboarding cards.
  - "¿Ya tienes cuenta? Inicia sesión aquí" leads to Login.
- Errors (2443:173787):
  - "Falta el nombre del rancho"
  - "Falta tu nombre"
  - "Falta tu teléfono"
  - "Falta tu correo"
  - "Formato de correo no valido"
  - "Correo previamente registrado"
  - "Contraseña muy corta"

### 1.3 Onboarding cards (task hub)
- Frames: [53:28](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=53-28), 2018:206497.
- Purpose: first-run hub. "Bienvenido nuevamente -nombre usuario- comienza seleccionando una tarea".
- Cards (CTA, then description):
  1. **Configurar mi rancho**: "Completa los datos de tu perfil, rancho y programa de vacunaciones". Leads to UserConfig, then RanchConfig, then Vaccination.
  2. **Registrar mis vacas**: "Registra los datos de cada una de tus vacas". Leads to New Log Cows.
  3. **Organizar mis potreros**: "Creá los potreros digitales que tiene para sus vacas". Leads to Cow Group Configuration.
  4. **Configurar alertas**: "Selecciona los canales que prefieras para recibir alertas." It shows channel icons SMS / email / Alerta Web / Notificación. Leads to Alert Selection.
- The bell tooltip mirrors the same 4 tasks as pending reminders.

### 1.4 UserConfig: profile (Datos cuenta)
- Frames:
  - [49:1365](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1365): read-only view.
  - 369:6280: editing.
  - 370:6668: errors.
  - 369:5931 / 370:6157: photo upload.
  - 369:6506 / 370:6878: change password.
  - System copies: 850:38289, 850:38193, 850:38241, 850:38355/38376/38404.
- Tabs variant 1315:53819: **Datos cuenta / Datos Rancho / Vacunación y Desarrollo** (account / ranch / vaccination). These are the 3 steps of "Configurar mi rancho".
- Header: "Aquí puedes editar la informacion de tu cuenta."
- Fields (Datos Generales):

| Label | Gloss | Type | Req | Rule/error |
|---|---|---|---|---|
| Nombre(s) | first names | text | yes | "Es necesario tu nombre" |
| Apellidos / Apellido(s) | last names | text | no | |
| Teléfono | phone | tel | yes | "Agrega un número telefónico"; "Al teléfono ingresado le faltan dígito(s)"; only digits and "+": "Agrega sólo dígitos"; dial codes come from an automatic list |
| Correo Electrónico | email | email | yes | "Agrega tu correo"; "Formato incorrecto" |
| Foto | profile photo | image upload | no | JPG/PNG only, max 2MB |
| Cambiar contraseña | change-password link | link | | "Recomendación usa una contraseña segura que no uses en ningún otro sitio." |

- System version (850:38289) adds:
  - Role badge **Dueño** (owner).
  - **Alertas Activas** (active alert channels, checkboxes: Notificación / email / Alerta Web / SMS).
  - **Plan Activo** with a progress bar: "Llevas 45 vacas de 50" (45 of 50 cows used).
- Photo upload states:
  - Drop zone: "Agrega tu foto de perfil", "Arrastra tu archivo aquí ó usa el explorador", "Tamaño máximo de archivo 2MB".
  - Progress: "Nombre del archivo: Mifotodeperfil12498.jpg", "Tamaño: 1.87MB", "75% completado".
- Change-password sub-screen:
  - Fields: *Contraseña Actual* (current), *Nueva Contraseña* (new), *Confirme su Nueva Contraseña* (confirm). All are password fields with an eye toggle.
  - Rules (2449:173794):
    - Current password must match.
    - New password ≠ current.
    - Confirm = new.
    - "Guardar" is enabled only when all three are valid.
    - Minimum 8 characters.
  - Success: "Felicidades!!! -Nombre usuario- acabas de actualizar tu contraseña".
  - Note 2448:173792 suggests the reset may happen by emailed link instead.
- Actions:
  - `Editar` (pencil) makes fields editable; `Guardar` (save) is disabled until something changes.
  - `Agregar Foto`.
  - Onboarding bar: Regresar / Omitir Paso / Continuar, which leads to RanchConfig.

### 1.5 RanchConfig: ranch data (Datos Rancho)
- Frames:
  - [1315:56000](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1315-56000).
  - System: 973:40897 (view), 973:41324 (La Trajinera), 974:41621 / 974:41733 (new ranch form), 974:42103 (Eliminar Rancho), 974:42223 / 989:0 (delete confirm), 974:41847 (success), 989:129 / 989:166.
- Header card: "Rancho: El bigotes" (dark slate bar).
- Context row: `Agregar Rancho` (add ranch) on the left, counter "Ranchos en Sistema | 001" on the right.
- Fields:
  - *Nombre del Rancho* / ranch name / text / required. Error: "Escribe el nombre".
  - *Dirección* / address / text / required. Error: "Escribe la direccion".
  - Map preview with a pin; geolocation implied.
  - Read-only counter "Vacas en Sistema | 045".
- Logic (2448:173891):
  - "Guardar" is disabled when nothing has changed.
  - "Guardar" is disabled when either field is empty.
- Actions:
  - Editar / Guardar.
  - Agregar Rancho opens a new form: "Rancho: Nombre Nuevo Rancho", placeholders "Escribe el nombre" / "Escribe la direcciòn".
  - Eliminar Rancho.
- Delete confirm:
  - "¿Quieres borrar el rancho: El Bigotes?"
  - "Recuerda que una vez borrado este rancho, la información que hayas registrado no podrá recuperarse." (irreversible)
  - Buttons: Regresar / confirm.
- Add success: "El Rancho La Trajinera se registró con Éxito!!! Tu nuevo rancho está listo para recibir sus vaquitas."
- Dashboard banner (5225:163500), ranch migration: "Se solicitó la migración de los datos de este rancho al rancho “Mis potreros”" (data migration between ranches was requested).

### 1.6 Vaccination & Development wizard (Vacunación y Desarrollo)
- Frames:
  - [1416:52](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1416-52): intro.
  - [1416:218](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1416-218): step 1 Desarrollo.
  - [1426:53248](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1426-53248): step 2, vaccine list, empty.
  - [1426:54137](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1426-54137): vaccine card.
  - [1426:53985](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1426-53985): add-vaccine modal.
  - [1426:54240](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1426-54240): step 3, plan summary ("cartilla").
  - System copies: 2018:371568…371896.
- Progress bar at the top of the card: `Steper Bar 1/3`.
- Intro copy: "Configura tu programa de desarrollo, vacunación y tratamientos para tu ganado. Un registro adecuado ayudara a evitar brotes de enfermedades, las cuales ocasionan pérdidas. Considera que este será tu plan de prevención para el desarrollo exitoso y rentable de tu rancho al contar con un hato saludable..."

**Step 1: Desarrollo (development).**

| Label | Gloss | Type | Hint / rule |
|---|---|---|---|
| Peso para primera inseminación | weight at first insemination | number (Kg), max 3 digits | "(Rango recomendable entre 330-380Kg)"; error "Ingresa el peso" |
| Edad de destete vaquillas | heifer weaning age | number (días), 3 digits | "(Rango recomendable entre 60-90 días)"; "Ingresa la edad" |
| Edad primera desparasitación | first deworming age | number (días), 3 digits | "(Rango recomendable entre los 90 y 180 días)"; text input gives "Ingresa sólo dígitos" |
| Tipo de calostro a proporcionar | colostrum type | radio | **Directo Madre** (direct from mother) / **Calificado** (qualified). Info tooltip: "Es un calostro limpio que ha sido analizado por anticuerpos y cantidad de sangre presente." |
| Frecuencia de desparasitación | deworming frequency | radio | **Cada 6 meses** / **Cada año** |

**Step 2: Vacunas a Aplicar (vaccines to apply).**
- Card grid. The `Agregar vacuna` (+) card opens the modal.
- Each saved card shows:
  - Vaccine name.
  - *Dosis*, e.g. "2 ml por kg".
  - *Frecuencia*, e.g. "Cada 6 meses", with dose-circle indicators.
  - *Aplicar a partir de:*, e.g. "3 meses de nacida".
  - Actions *Editar* (pencil) and *Eliminar* (trash).
- **Add-vaccine modal.** The title is the vaccine name, picked from a predefined dropdown that also allows free text: "Listado desplegable predefinido de vacunas y agregar otra que permita entrada de texto". The main menu is blocked while the modal is open.

| Field | Gloss | Type | Error |
|---|---|---|---|
| Nombre de la vacuna | vaccine name | select + "other" free text | |
| Dosis | dose | number + "ml" | "Ingresa la dosis" |
| Inicio aplicación | start of application | radio **Edad** (age) / **Peso** (weight) + number "meses" | "Ingresa la edad" |
| Frecuencia | frequency | select: **Única aplicación** / **Refuerzos** / **Cada 6 meses** / **Cada año** | |
| No. Refuerzos | number of boosters (Refuerzos only) | number | "Ingresa no. de refuerzos" |
| Tiempo entre refuerzos | interval between boosters (Refuerzos only) | number "meses" | "Ingresa tiempo entre refuerzos" |

- Modal buttons: Regresar / `Guardar`.
- Predefined vaccine list:
  - Brucela
  - Tuberculosis
  - Pulmonías
  - Fiebre aftosa
  - Carbón Sintomático (Ántrax)
  - Diarrea Viral Bovina (DVR)
  - Rinotraqueítis Infecciosa Bovina (IBR)
  - Derriengue (Rabia paralítica bovina)
  - Clostridios
  - Salmonella
- The designer spec (1426:53737) also lists a "first application" trigger event: *Edad (Meses)* / *Primer celo* / *Primera inseminación* / *Diagnóstico gestación* / *Secado (60 días a parto)*. The summary shows "Despues del primer celo", so event-based start exists in the model even though the modal only shows Edad/Peso.

**Step 3: Plan de vacunación y desarrollo (summary / cartilla).**
- Read-only Desarrollo values: 360Kg, Calificado, 70 días, 90 días, Cada año.
- Vaccination table. Columns: *Nombre vacuna*, *Frecuencia* (rendered as dose circles with a caption such as "Cada 6 meses", "Cada 12 meses", "Aplicación única", "3 refuerzos cada 6 meses"), *Inicio aplicación* ("A los 3 meses de nacida", "Despues del primer celo", "A los 6 meses de nacida"), *Dosis* ("1 ml", "0.5 ml", "0.2 ml").
- Actions:
  - Regresar.
  - **Guardar** (save as draft).
  - **Aprobar** (approve the plan, with a calendar-check icon).
- Leave-incomplete rule (2448:173869): if the user switches ranch or navigates away before finishing, reminders show "Plan de Vacunación y Desarrollo pendiente" and the entered data is kept as pending approval. "Flujo podrá ser interrumpido para continuar posteriormente - habrá que enviar recordatorios".

### 1.7 Alert Selection (channels)
- Frames:
  - Onboarding: [49:1877](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1877).
  - System: [2018:901224](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-901224) "Configura los canales para comunicarnos contigo".
  - Channel tiles: 58:150 / 58:151 / 58:155 / 58:159 (`Email|Activado`, `AlertaWeb|Activado`, `SMS|Activado`, `Notificacion|Activado`).
- Header: "!Genial! Ahora, selecciona el canal para comunicarnos contigo".
- Fields (multi-select checkboxes, at least 1 required):

| Channel | Copy |
|---|---|
| email | "Te enviaremos un correo electronico cuando alguna de tus vacas necesite de tu atencion, para registrar el evento." |
| Alerta Web | "Te aparecera una notificacion en tu navegador cuando suceda algo ¡altamente recomendada!" |
| SMS | "Un mensaje de texto se te hara llegar a tu celular cuando, como parte de tu membresía. **Ver membresías**" (plan-gated; link to plans) |
| Notificación (push) | "Esto es una notificacion igual a las otras aplicaciones que tienes en tu celular. ¡Super practica!" |

- Error: a red banner "Selecciona al menos un canal" with a close (x).
- System rule (2448:173896): "El usuario no podrá desactivar todas las alerta".
- Navigation: Regresar / Omitir Paso / Continuar.

### 1.8 Cow list, onboarding variant (Cows log in System Onboarding screen)
- Frames:
  - [49:1514](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1514).
  - Filter states: 120:1428 *Grupo*, 118:552 *Raza*, 118:677 *Reproducción* (empty-result alert), 118:802 *Salud*, 118:927 *Bajas*.
  - Copies: 2018:105363…105501.
- Header: "Esta es tu lista de vacas. Continua agregando tus vacas al sistema".
- Top: `Agregar Vaca` and "Vacas en Sistema | 001".
- Search: *Buscar vaca por ID*, placeholder "ID Vaca", search box.
- Filters: *Filtros disponibles*. First dropdown **Categoría**; second dropdown **Variable**, disabled until a category is chosen (`Dropdown Medium deactivated`). See §3 for the values.
- **Table columns (cows):**

| Column | Content |
|---|---|
| ☐ checkbox | select all / row select |
| ID Vaca ↕ | animal icon + ID, e.g. 00001 |
| Raza ↕ | breed, e.g. Normando Francés |
| Estado ↕ | state, e.g. Lactando |
| DIM ↕ | days in milk, e.g. 000 |
| Grupo ↕ | group/potrero, e.g. Alta producción |
| Acciones | ⇄ move to another potrero, 🗑 delete/baja |

- Empty filter result (Group 200 / 2468:174983): an alert row "No encontramos animales con el filtro aplicado". Rules:
  - Salud filter with no sick cows: "se asumirá que todas están saludables".
  - Bajas filter with no records: "se asumirá que todas están vivas y en el rancho".
- Bottom: "Comenzar" (start) and "Configurar potreros >" (next step).

### 1.9 New animal registration (Onboarding New Log Cows | Vaca / Vaquilla / Toro)
- Frames:
  - Vaca: [49:1657](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1657).
  - Vaquilla: [49:1594](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1594).
  - Toro: [1301:353](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1301-353) (errors), 1315:52572 (success).
  - Vaca reproductive variants: 532:9319 (0 eventos, 0 ciclos), 532:9592 / 532:9727 (1 evento), 532:9457 (0 eventos, 1 ciclo de gestación).
  - Filled: 248:1216 / 248:1248.
  - Success: 164:2436 (vaquilla), 164:2469 (vaca).
  - Photo upload: 248:0 / 248:41 / 290:5035 / 290:5086; processing: 248:347 / 248:391.
  - System copies: 2018:878917…901153.
- Header: "Registra tu hato en el sistema, comienza por tu primer vaca | vaquilla | toro".
- Type selector: radio tiles **Vaca** (cow) / **Vaquilla** (heifer) / **Toro** (bull). The form changes per type.
- Photo panel: `Agregar Foto`.
  - Drop zone "Agrega la foto de tu vaca/vaquilla", "Arrastra tu archivo aquí ó usa el explorador", "Tamaño máximo de archivo 2MB", "Procura que la foto capture sus manchas distintivas" (capture distinctive spots).
  - Progress: "Nombre del archivo: MiVacaPinta298745.jpg / Tamaño: 1.87MB / 75% completado".
  - JPG/PNG only.

**Datos Generales (all types)**

| Label | Gloss | Type | Req | Rule |
|---|---|---|---|---|
| Raza | breed | select (§3 list) | default Holstein | "si no seleccionan, se dejará por default Holstein" |
| Potrero (Vaca/Vaquilla) | paddock/group | select | default "Potrero General" | |
| Nombre (Toro only) | bull name | text | | |
| ID control interno | internal ID | text, placeholder "0000-0000-0000" | yes | Empty: "Registra un ID para la vaca/vaquilla/el toro". Unique: "El ID ingresado está repetido". Allowed chars: hexadecimal plus "ñ" and spaces, else "El ID contiene caracteres no válidos" |
| Fecha de nacimiento | birth date | date DD/MM/AAAA | editable if unknown | Vaca: not less than 24 months / 720 days old. Vaquilla: not more than 24 months / 720 days (note says "mayor"). Vaquilla over 30 months / 900 days logs advice "Te recomendamos que el animal se sacrifique o venda para carne, pues no ha sido fértil" |
| ID SINIIGA | national ear-tag ID | text, mask "MX-00-AGS(01)-0000-0000" | optional for Vaca and Toro ("(opcional)"); no "opcional" label on Vaquilla | Max 8 digits. Fewer than 4: "Se necesitan al menos 4 dígitos". Exactly 4 digits are formatted as "MX-00-00-0000-1234". Duplicate: "Este número ya lo tiene otra vaca / otra vaquilla / otro toro" |

**Datos Reproductivos (Vaca only)**

| Label | Gloss | Type | Rule |
|---|---|---|---|
| Fecha último Parto | last calving date | date | Required. "Registra una fecha aproximada, si no ha parido, registrala como vaquilla". Must be at least 22 months / 660 days after birth date |
| Etapa Reproductiva | reproductive stage | select: Vacia, En celo, Servida, Gestante (plus Secas, Recién paridas per filter) | drives conditional fields |
| ↳ Fecha último celo | last heat date | date | when stage = En celo / Servida (532:9727) |
| ↳ Fecha diagnóstico | pregnancy diagnosis date | date | when stage = Gestante (532:9592) |
| Estado de Lactancia | lactation status | select: Lactando, (Seca implied) | |
| # Lactancia | lactation number | select 1..n | |

**Datos adicionales opcionales (Vaquilla only)**

| Label | Gloss | Type |
|---|---|---|
| Vaca Madre | dam | select from registered cows ("Selecciona") |
| Toro Padre | sire | select from registered bulls |
| Tamaño al nacer | birth size | number, Centímetros |
| Peso al nacer | birth weight | number + unit dropdown, Kilogramos |

- Actions:
  - `Registrar Vaca / Registrar Vaquilla / Registrar Toro` (primary).
  - Regresar. Note: "AL dar click en regresar... comunicando que no se ha registrado la vaca y sus datos" (confirm before discarding).
  - Omitir Paso.
- Success modals, each with an illustration:
  - "Felicidades!!! -Nombre usuario- acabas de agregar tu primer vaca a tu rancho virtual" (Cow_Dancing).
  - "...primer vaquilla..." (Cow_Sitted).
  - "...primer toro..." (Bull_Glass_Milk).
- Bull data per spec note: "Datos del toro: Nombre + ID, Edad, Raza, No. SINIIGA".

### 1.10 Potrero (group/stall) creation wizard (Cow Group Configuration)
- Frames:
  - Preconfigured + Automático + Raza: [129:1430](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=129-1430).
  - Empty variants: 49:1739, 129:1388, 129:1472, 129:956, 129:1040, 129:623.
  - Filled variants: 129:1346, 129:914, 129:372, 129:998, 129:566.
  - Manual cow selection: [164:629](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-629), 165:968 ("Agrega vacas para tu primer potrero.").
  - Copies: 2018:263040…264423.
- Header: "Separa tu ganado en potreros. Crea tu primer potrero."
- Fields (Creación del potrero):

| Label | Gloss | Type | Rule |
|---|---|---|---|
| Tipo de potrero | potrero type | radio **Preconfigurado** / **Personalizado** | If no preconfigured group is chosen, default is General |
| Nombre del potrero | name | Preconfigurado: select (General, Alta producción, Secas o en reto, Recién paridas, Enfermas). Personalizado: text, placeholder "Ejemplo: Potrero general" | Required: "Es necesario el nombre". Max 60 chars (counter "0/60") |
| Descripción | description | textarea, counter "0/120" | Max 120 chars. Default copy for General: "Este es el grupo general... ¡Aquí están todas las vacas en tu rancho!" |
| Selección de vacas | cow selection method | radio **Automático** / **Manual** | |
| Filtro a aplicar a la selección | filter | dropdown 1 (`Filter for cow section for stalls`): **Edad (años)** / **Raza** / **# Lactancias**. Dropdown 2: value (breed list; or 3,4,5,6,más for lactations and age) | "Selecciona al menos una casilla". Action "Borrar datos" (clear) |

- Manual selection (164:629): title "Potrero General" with editable description (pencil).
  - "Selecciona o arrastra las vacas a agregar al potrero" (select or drag cows into the potrero).
  - Left table **Vacas filtradas**: ☐, ID Vaca ↕, Grupo ↕.
  - Arrow → right table **Vacas en potrero | 000**: ID Vaca ↕, Grupo ↕.
  - Rule: "Mientras no se seleccione una vaca a agregar al grupo, el botón de selección de indicador, estará inactivo".
- Next: "Selección de indicador >" leads to 1.11.

### 1.11 KPI stall selection (indicator for potrero)
- Frames: [164:1426](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-1426), 164:1898 / 164:2105 (automated filter), 164:2072 (success). Copies 2018:288090…288466.
- Header: "Selecciona un indicador para tu primer potrero".
- Single-select radio cards:
  - **Vacas en Celo**: "Indicador para seguimiento de las fechas de celo para la inseminación de las vacas".
  - **Vacas preñadas**: "Indicador para seguimiento de las fechas posibles de parto".
  - **Vacas enfermas**: "Indicador para dar seguimiento a los tratamientos necesarios".
  - **Días en leche**: "Indicador de seguimiento de el periodo entre partos y productividad del hato".
- Rule: "Dar la opción al usuario de no seleccionar ningún indicador" (choosing an indicator is optional).
- Action: `Agregar Potrero` (`Boton Registrar Grupo`). Success: "Felicidades!!! -Nombre usuario- acabas de agregar tu primer potrero a tu rancho virtual" (Cow_Glass_Milk).

### 1.12 Ranch Stall List (potreros list)
- Frames: onboarding [164:2822](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-2822) ("Continua agregando potreros a tu rancho"); system [2018:901267](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-901267) (Grupos tab, "Potreros Vaquillas").
- Layout: header dropdown (Potreros Vacas / Potreros Vaquillas), `Agregar Potrero`, counter "Potreros en Sistema | 005".
- Potrero card:
  - Title.
  - Description.
  - "Vacas en Potrero | 020".
  - Optional KPI widget, e.g. "Vacas en Celo 000".
  - "Ver más 👁".
  - Edit/delete menu (*Editar*, *Eliminar*).
- Heifer potreros (automatic by development stage):
  - **Recien Nacidas**: "Grupo especial para vaquillas recien nacidas y hasta 6 meses, ¡Cuidalas mucho!"
  - **En desarrollo**: "Vaquillas a partir de 6 meses, hasta haber tenido su primer servicio."
  - **Servidas**: "Vaquillas que ya han tenido su primera monta o servicio registrado en sistema."
  - **Preñadas**: "Vaquillas preñadas con éxito"
  - **Enfermas**: "Todas las vaquillas enfermas"
- Uses `Group Chip`.

### 1.13 Potrero detail (system)
- Frames:
  - Cows: [4163:164994](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=4163-164994) "Alta Producción".
  - Heifers: 4163:164634 "Recien Nacidas".
- Top: "< Regresar" and "Vacas en Potrero | 015".
- Header: potrero name, with a ✎ rename.
- Left panel:
  - *Descripción* (textarea, 0/120).
  - *Buscar vaquilla por ID*.
  - *Filtros disponibles*: Estado + Variable.
  - `Traer Vacas` (bring cows into this potrero).
- **Table columns:**
  - Cow potrero: ☐, ID vaca ↕, Raza ↕, DIM ↕, Acciones (⇄ move, 🗑).
  - Heifer potrero: ID vaquilla, Raza (e.g. Normando Francés), ☐.
- Pagination: "10 vacas por hoja" plus pager.
- Potrero scenarios (note):
  - Add cows from existing groups.
  - Move to another group.
  - Delete (= baja).
  - Delete potrero asks where its cows go.
  - Bulk actions activate when 2 or more cows are selected.
  - Rename, create, delete.

### 1.14 System animal lists (Vacas tab)
- Frames:
  - **Listado Vacas** [2018:878545](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-878545). Filter variants: 2018:878587, 878711, 878752, 878794, 878835, 878876.
  - **Listado Vaquillas** [2018:878629](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-878629).
  - **Listado Toros** [2018:878672](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-878672).
  - Same set in 2018:623337…623586.
- Common layout: entity CTA, *Buscar <entidad> por ID*, *Filtros disponibles*, sortable table, per-page select "10 vacas por hoja", pager (‹ 1 00 00 ›), vertical scroll.

| List | CTA | Filter | Columns |
|---|---|---|---|
| Vacas | Agregar Vaca | Categoría → Variable | ☐ · ID Vaca · Raza · Estado · DIM · Grupo · Acciones (⇄, 🗑) |
| Vaquillas | Agregar Vaquilla | Estado (Recien nacidas / En desarrollo / Servidas / Preñadas / Enfermas) | ID Vaquilla · Raza · Estado · DIM* · Grupo · Acciones (🗑) |
| Toros | Agregar Toro | Raza | ID Toro · Raza · Nombre · DIM* · SINIIGA (MX-00-00-0000-0000) · Acciones (🗑) |

\*The DIM column on heifers and bulls shows age-like values (1, 8, 12, 18, 23), so it is probably age in months, mislabelled.

- Sample heifer rows:
  - Recien Nacida/1
  - En desarrollo/8, 12
  - Servida/18, 17
  - Preñada/23
- The heifer Estado and Grupo columns are equal: the group is automatic by stage.

### 1.15 Cow Profile | Heifer (system)
- Frame: [2018:907783](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-907783). Covered in depth by the profile inventory; summarized here.
- Header:
  - "ID 00008", name "Cadillac 20088".
  - *Etapa de desarrollo*: Recien Nacida.
  - *Tamaño y peso al nacer*: 100 cm, 100 kg.
  - Birth date: 12•Ago•2019.
  - Status chips: Celo, Preñada, Sana.
  - "Próximo evento según edad: Tratamiento antiabortivo" (next event by age).
- **Bitácora de Eventos** (event log) table: Tipo / Fecha / Evento, with 🗑. Rows:
  - Nacimiento 12/08/2019
  - Nutrición "Calostro primera calidad" 13/08/2019
  - "Prevención enfermedades respiratorias" 07/09/2019
  - Link "Ampliar bitácora".
- Tabs/sections:
  - *Genealogía*.
  - *Monitor de Actividad*: Nivel de Actividad 90%, Minutos de Rumia 420. Period options Histórico / Año / Mes / Semana / 72hrs; "Periodo de consulta: 30/septiembre - 1O/octubre 2019".
  - *Alertas o eventos*: counters 03 Tratamientos Médicos, 0 Cambios de dieta.
  - "Baja de ganado".
- Teaser: "Collar y arete inteligentes disponibles próximamente. Conoce con mayor precisión a tus vaquillas", with "Registrarme en la lista de espera" (waitlist).

### 1.16 Dashboard (Inicio) and KPI drill-downs
- Frames:
  - [49:1443](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1443) (also 2018:877619).
  - Drill-downs: 314:5906 / 313:6591 (Celos a confirmar), 314:6614 (Para seguimiento), 1670:94528 / 1669:1830 (Por vacunar), 635:26271 (Enfermas), 640:0 (Preñadas).
- Header: "Esta es la informacion general de tu rancho."
- KPI tiles:
  - **Celos a confirmar**: 02 A revisar hoy / 01 Para seguimiento.
  - **DIM**: 000, Ver más.
  - **Enfermas**: 000.
  - **Preñadas**: 000.
  - **Vacas por vacunar y dar tratamiento**: 02 Por vacunar / 01 A dar tratamiento.
  - **Distribución del hato** donut: Preñadas, Con servicio, Abiertas, Enfermas; total 01.
- Drill-down tables:
  - Celos a confirmar "- A revisar hoy -": ID Vaca · Grupo · Confirmar (switch on/off).
  - "Vacas a seguir por celo - Para Seguimiento -": ID Vaca · Grupo · Confirmar, plus a "Día de seguimiento" check chip.
  - Por vacunar: "Filtro por vacuna" dropdown and "Rango de fechas" dropdown. Columns ID Vaca · Vacuna / Grupo · Confirmar (switch). Link "Vacunación y desarrollo".
  - Enfermas: "Filtro por enfermedad" (illness list §3). Columns ID Vaca · Enfermedad · Se curó (cured toggle).
  - Preñadas: "Siguentes partos entre:" with a range slider (`Stepper_Slider2`). Columns ID Vaca · Fecha estimada · Parto, e.g. "04/Octubre/2019".

### 1.17 Users: list, create, permissions
- Frames:
  - List: [871:28](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=871-28) "Listado de Usuarios en Sistema"; delete confirm 920:0.
  - Create: [894:37699](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=894-37699), plus role variants 894:37981, 894:38150 (Administrador), 894:38319 (Médico), 894:38488 (Nutriólogo), 894:38657 (Técnico de campo).
  - Plan-limit variant: 850:38322 (Cow Counter for Plan - Red).
  - Permissions: [906:38180](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=906-38180), 912:39073, 905:38742 / 38620 / 38498 / 38374, 906:38435.
- **User list.** Top: `Agregar Usuario` and "Usuarios en sistema | 007".
  - Columns: (avatar, colour bar by role) · Nombre ↕ · Usuario ↕ (role) · Última actividad ↕ (date link that opens the History filtered to that user) · Acciones (✉ message, ✎ edit, 🗑 delete).
  - Pagination: "10 usuarios por hoja".
  - Delete confirm: "¿Dar de baja -nombre usuario- ?" / "Recuerda que eliminar usuarios evitará que estos puedan trabajar en tu rancho virtual, pero su historial se mantendrá en registro." (soft delete: history is kept).
- **Create user.** Header dropdown "Tipo de usuario ⌄" plus link "Personalizar permisos".

| Field | Type | Req |
|---|---|---|
| Foto (Agregar Foto) | image | no |
| Nombre(s) * | text | yes |
| Apellidos | text | no |
| Teléfono | tel | no |
| Correo Electrónico * | email | yes |
| Contraseña * ("Usa una contraseña segura.") | password + eye | yes |
| Confirmar Contraseña | password + eye | yes |
| Canales Alertas | checkboxes email / SMS / Alerta Web / Notificación | |

  - "Plan Activo — Llevas 1 usuario de 3" with link "Mejora tu plan".
  - Button `Crear Usuario`. It is disabled when no permission is selected: "Selecciona al menos un permiso".
- **Roles:**
  - Dueño (owner)
  - Administrador
  - Médico (vet)
  - Nutriólogo (nutritionist)
  - Técnico de campo (field technician)
- **Permissions** ("Permisos para: Pedro Navajaz"). Header shows the role, e.g. "Dueño ⌄". Tabs and checkboxes:
  - **Ganado:**
    - Agregar vacas al sistema
    - Consultar inventario vacas
    - Editar información vacas
    - Eliminar vacas del sistema
    - Agregar grupos al sistema
    - Consultar grupos
    - Editar grupos
    - Eliminar grupos del sistema
  - **Usuarios:**
    - Agregar usuarios al sistema
    - Eliminar usuarios del sistema
    - Consultar listado de usuarios
    - Consultar actividad de usuarios
  - **Dispositivos:**
    - Agregar dispositivos al sistema
    - Asignar dispositivo a vaca
    - Consultar inventario dispositivos
    - Eliminar dispositivo de sistema
  - **Salud:**
    - Confirmación de alertas de reproducción
    - Seguimiento de eventos de salud
    - Registro de eventos de salud
  - **Reportes:**
    - Ver Reportes - resumen de estadísticas
    - Generar reportes personalizados para imprimir
    - Generar reportes personalizados para descargar
  - **Finanzas:**
    - Registros de ingresos y egresos
    - Envío de declaración
    - Consulta y manejo de registros en REEMO y SIINIGA
    - Facturación planes smartbell
- Permission-type taxonomy (886:228 "Mapeo de permisos"):
  - Administración de Ganado
  - Administración Dispositivos
  - Salud y Reproducción
  - Rendimiento e indicadores
  - Información financiera y fiscal
  - Administración de Usuarios

### 1.18 Plans, billing, cancellation
- Frames:
  - Plans: [1010:41973](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1010-41973) (monthly), 1010:42316 (annual toggle), 1034:41705 (thank-you).
  - Modules: 1022:41836.
  - Billing: [1099:171](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1099-171).
  - Payment methods: 1118:42574.
  - Invoice download: 1118:43322.
  - Cancel: 1118:42060.
  - Payment options: 2524:146534.
- Plans (Mx/Mes + I.V.A.; toggle Mensual / Anual):

| Plan | Price | Cows | Alerts | Support | Users | Extras |
|---|---|---|---|---|---|---|
| Cría | $549 | Hasta 50 | e-mail | 72hrs | 1 | Bitácora, Historial permanente |
| Destete (Recomendado) | $1,049 | Hasta 150 | e-mail y SMS | 48hrs | 3 | idem |
| Producción | $1,549 | 150 o más | 4 canales | 24/7 | 5 | idem |

  - Plan buttons: "Plan activo" (disabled) / `Contratar`.
  - "Usuario adicional $49 Mx/mes".
  - "Módulos adicionales".
- Module pricing notes:
  - Genealogía/husbandry: $5,000/año.
  - Finanzas y fiscal: preventa, $1,500/año (presale $1,000). Mexico only; AGAPE tax regime.
  - Dispositivos inteligentes: $70/mes/vaca, $35,000 installation, $350/mes internet per antenna.
- Thank-you: "Muchas gracias por tu preferencia Tu rancho se actualizará para contar con las funciones del - plan o módulo - que acabas de contratar". Payment uses Paypal; also "Efectivo" (cash, instant credit), "Pago electrónico" (credit within 1 hour), "Depósito y transferencia bancaria" (credit within 1 hour).
- **Billing (Dueño):**
  - Plan Activo bar "Llevas 45 vacas de 50" (red near the limit).
  - `Mejora tu Plan`.
  - Plan card.
  - *Facturación*: Mensual / Anual.
  - *Ultima fecha de pago*, *Fecha de renovación* (dd/mm/aaaa).
  - "Agregar Usuario $49 Mx/mes".
  - **Mis Facturas** table: Descripción ↕ · Monto ↕ · Fecha de pago ↕ · › (e.g. "Membresía “cría” - 50 vacas $00,000.00 04/Nov/2017"). Link "Ver todas mis facturas".
  - Links: "Ver mis módulos adicionales", **Eliminar mi cuenta**, **Cancelar membresía**.
- Payment methods: card list (•••• 5689 Mastercard, •••• 3465 Visa, expiry "mm • aaaa"), "Agregar Método de pago", "Fin de membresía".
- Download data: "¿En que formato deseas descargar tu información?" with formats Excel / CSV / PDF / TXT.
- Cancel modal:
  - "¿Seguro quieres cancelar tu membresía? Te vamos a extrañar!!!" (Cow_Sad).
  - *Razón de cancelación* dropdown: Precio / Servicio y/o Soporte / No es lo que esperaba / No me dió resultados / Otro (free text).
  - "Al cancelar tu membresía, tendrás hasta el dd/mm/aaaa para realizar la descarga de los datos de tus vacas."

### 1.19 Messages (internal user messaging)
- Frames:
  - [923:38945](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=923-38945) inbox.
  - 934:0 / 961:2540 thread.
  - 960:40665 / 960:41356 reply.
  - 960:39678 delete confirm.
  - 960:40866 sent.
- Tabs: *Mensajes Recibidos* / *Mensajes enviados*. Search box with filter. `Nuevo mensaje`.
- Columns: Nombre · Asunto · Fecha · Acciones (👁 show, 🗑).
- Thread: dated messages, `Responder`; compose actions "Descartar Mensaje" and "Enviar". Both are disabled while the text is empty.
- Delete confirm: "¿Quieres borrar el mensaje?" / "Recuerda que una vez borrado el mensaje, este no podrá recuperarse."
- Sent: "Mensaje Enviado!!! En breve el -Nombre usuario destino- recibirá tu mensaje".
- Empty filter result: "No se encontraron mensajes con los filtros seleccionados, pruebe con otros filtros".

### 1.20 Historial de eventos (activity history)
- Frames:
  - [960:41601](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=960-41601).
  - Variants: 974:40373, 974:40732 (cattle events), 974:41245 (Reducir historial), 970:40497 (per-user "Historial de eventos: Don Ignacio"), 974:41013, 970:40240 (reports).
  - Date widget: 972:40200.
- Filters:
  - *Selecciona Usuario a revisar* (Todos los usuarios / by user / by role category).
  - *Buscar* search.
  - *Eventos realizados*: **Tipo de evento** (Con Ganado / Con Usuarios / Con Dispositivos / De Reportes / De Finanzas / De Salud), then **Evento** (dependent).
  - Date range "Del 31-Oct-19 al 04-Nov-19 ⌄" (calendar range picker with Reset/Done).
  - "Ampliar historial" / "Reducir historial" (expand/collapse).
- Columns:
  - Usuario ↕ (avatar + name, colour bar).
  - Vaca ID ↕ (link to the cow, or "--").
  - Tipo ↕ (Salud / Reproducción / Con usuarios ...).
  - Fecha ↕.
  - Evento ↕ ("Mastitis diagnosticada", "Celo confirmado: Inseminada", "Preñez confirmada", "Cambio de numero telefonico", "Alta de vaca", "Baja de vaca: Venta", "Agregar vaca", "Eliminar ganado", "Editar vaca", "Cambio de potrero", "Cambio de potrero - 10 vacas", "Editar potrero", "Editar Grupo", "Cambio a potrero secas", "Edición de usuarios", "Reporte Celo Octubre - Descarga", "Reporte Inseminación Octubre - Impresión", "Reporte Partos Octubre - Impresión").
- Pagination: "10 eventos por hoja".
- Event taxonomy note (972:40518):
  - **Con Ganado:** cambio de potrero, alta, baja, edición de animales, agregar / editar / eliminar grupos.
  - **Con Usuarios:** alta, baja, edición.
  - **Con Dispositivos:** alta, baja, asignación, cambios de batería, mantenimiento.
  - **De Salud:** cambio de dieta, enfermedades, accidentes, tratamientos, eventos de reproducción, seguimiento.
  - **De reportes:** descarga.
  - **De finanzas:** ingresos, costos, descarga; future REEMO, SIINIGA, declaraciones.
  - **De Rancho:** alta, baja, cambios.

---

## 2. Flow diagrams

**F1 Signup → onboarding**
1. Log-In → "Da click aquí" → Signup.
2. Signup → Registrarme → Onboarding cards.
3. Cards → *Configurar mi rancho* → UserConfig (Datos cuenta) → Continuar → RanchConfig (Datos Rancho) → Continuar → Vacunación y Desarrollo intro.
4. Then: Desarrollo (1/3) → Vacunas a Aplicar (2/3; Agregar vacuna modal → Guardar) → Plan summary (3/3) → Aprobar. Leaving early saves the plan as pending plus a reminder.
5. Cards → *Registrar mis vacas* → New Log (Vaca/Vaquilla/Toro) → Registrar → success modal → Onboarding cow list ("Continua agregando") → Agregar Vaca (loop) or "Configurar potreros".
6. "Configurar potreros" / card *Organizar mis potreros* → Creación del potrero → (Manual: Cow selection) → Selección de indicador → Agregar Potrero → success → Ranch Stall List ("Continua agregando potreros").
7. Cards → *Configurar alertas* → Alert Selection (≥1 channel) → Continuar → Dashboard.
8. Any step → Omitir Paso → next card. Pending tasks stay in the bell tooltip.

**F2 System cow registry**
1. Topbar Vacas → Listado Vacas.
2. Switch to Vaquillas or Toros via the header dropdown or counter chips.
3. Search by ID, or pick Categoría → Variable → filtered table (or the empty alert).
4. Row ⇄ → move to potrero. 🗑 → baja (reasons: error / rastro / otro rancho / muerte). Row click → Cow Profile.
5. Agregar Vaca/Vaquilla/Toro → New Log form → back to the list.

**F3 Potreros**
1. Grupos → Potreros Vacas/Vaquillas cards.
2. Ver más → Potrero detail → Traer Vacas / ⇄ / 🗑 / rename.
3. Agregar Potrero → wizard (F1 step 6).

**F4 Users & permissions**
1. Avatar → Administrar usuarios → User list.
2. Agregar Usuario → Create user (role) → Personalizar permisos → Permission tabs → Crear Usuario.
3. ✉ → Messages compose. Última actividad → Historial filtered to that user. 🗑 → "¿Dar de baja…?"

**F5 Plan & billing**
1. Avatar → Cambiar plan → Software Plans.
2. Contratar → Paypal/payment → Thank-you modal.
3. Profile (Dueño) → Billing → Mis Facturas / Métodos de pago / Download data / Cancelar membresía (reason) / Eliminar mi cuenta.

**F6 Ranch CRUD**
1. Avatar → Configurar mi rancho → RanchConfig.
2. Then one of:
   - Editar → Guardar.
   - Agregar Rancho → New ranch form → success.
   - Eliminar Rancho → confirm.
3. The ranch switcher in the header changes the context.

---

## 3. Domain notes

**Entities and fields**
- **User:** nombre(s), apellidos, teléfono (with dial code; default MX +52), correo (unique), contraseña (min 8), foto, rol, permisos[], canales de alerta[], última actividad.
- **Ranch:** nombre, dirección (+ geo pin), owner. A user can have multiple ranches (switcher, "Ranchos en Sistema"). Ranch data can migrate to another ranch.
- **Animal (Vaca / Vaquilla / Toro):**
  - ID control interno (unique per ranch; hex + ñ + space).
  - ID SINIIGA (4 to 8 digits; format MX-00-00-0000-1234).
  - raza, potrero, fecha nacimiento, foto (JPG/PNG ≤2MB).
  - Toro: nombre.
  - Vaca: fecha último parto, etapa reproductiva (+ fecha último celo / fecha diagnóstico), estado de lactancia, # lactancia.
  - Vaquilla: vaca madre, toro padre, tamaño al nacer (cm), peso al nacer (kg).
- **Potrero (Group):** nombre (≤60), descripción (≤120), tipo (preconfigurado / personalizado), selección (automático / manual), filtro (edad / raza / # lactancias + value), indicador KPI (optional), animals[].
- **Vaccination & development plan (per ranch):**
  - peso primera inseminación (kg)
  - edad destete (días)
  - edad primera desparasitación (días)
  - frecuencia desparasitación (6 meses / anual)
  - tipo calostro (directo madre / calificado)
  - vacunas[]: nombre, dosis ml (or ml/kg), inicio por edad (meses) / peso / evento, frecuencia, # refuerzos, intervalo refuerzos
  - status: pendiente / aprobado
- **Alert channel preference:** email, web, sms, push. At least 1 required. SMS is plan-gated.
- **Subscription:** plan (Cría / Destete / Producción), billing period, last payment, renewal, invoices, payment methods, add-on users, modules.
- **Message:** from, to, asunto, body, fecha, thread replies.
- **Activity log entry:** user, vaca id?, tipo, fecha, evento.

**Enums**
- Filter categories: Sin filtro, Grupo, Raza, Reproducción, Salud, Bajas.
- Grupo values: General, Alta producción, Secas o (en) reto, Recién paridas, Enfermas.
- Raza (filter): Holstein, Jersey, Simmental, Otras razas.
- Raza (form): Holstein, Jersey, Simmental, Pardo Suizo, Guernsev [sic], Ayrshire, Shorthorn, Normando Francés, Otra raza..., Raza Mixta.
- Reproducción: Vacía, En celo, Servida, Gestante, Secas (60 días antes de parto), Recién paridas (menor a 45 días).
- Salud: Saludables, Enfermas.
- Bajas: Venta a otro rancho, Venta al rastro, Muertas (a desecho). The baja reason also has "Eliminación de registro del sistema (Corrección de error)".
- Heifer stage / group: Recién nacidas, En desarrollo, Servidas, Preñadas, Enfermas.
- Lactation status: Lactando (Seca implied).
- Illness (Cow_Illness_dropdown), with descriptions:
  - Mastitis
  - Brucelosis: "enfermedad infectocontagiosa, producida por una bactéria"
  - Pulmonía: "Infección de uno o ambos pulmones…"
  - Cetosis: "Alteración del metabolismo de los carbohidratos"
  - Tuberculosis: "…Mycobacterium bovis"
  - Cojera: "Afección en la capacidad de movimiento"
  - Fiebre aftosa
  - Envenenamiento: "Ingesta de alguna sustancia dañina"
  - Otro
- KPI indicators: Vacas en Celo, Vacas preñadas, Vacas enfermas, Días en leche (for beef ranches: swap DIM for Días abiertos).
- Vaccine frequency: Única aplicación, Refuerzos (limits future applications), Cada 6 meses (lifelong), Cada año (lifelong).
- Vaccine start: Edad (meses) / Peso / Evento (Primer celo, Primera inseminación, Diagnóstico gestación, Secado).
- Roles: Dueño, Administrador, Médico, Nutriólogo, Técnico de campo.
- Permission groups: Ganado, Usuarios, Dispositivos, Salud, Reportes, Finanzas.
- History event types: Con Ganado, Con Usuarios, Con Dispositivos, De Salud, De Reportes, De Finanzas, De Rancho.
- Event types (bitácora): Alta en sistema; Reproducción (Celo, Preñez, Parto); Baja (Venta: a otro rancho / a rastro; Desecho); Salud (Accidente, Enfermedad, Detección e inicio de tratamiento, Seguimiento, Éxito, Fracaso); Cambio Dieta (por enfermedad / por etapa reproductiva); Tratamiento médico (Sincronización hormonal para celo, Hormonas de crecimiento, Reducción de producción de leche, Vacunas, Otros); Cambió potrero/establo/corral.
- Treatment types: Antibiótico, Antibacteriano, Antiséptico, Antimicrobiano, Antiparasitario, Antimicótico, Anti-inflamatorios, Corticoide, Quirúrgico, Vacunas, Otros, No ordeñar.
- Cancellation reasons: Precio, Servicio y/o Soporte, No es lo que esperaba, No me dió resultados, Otro.
- Report export formats: PDF (print = table only; download = with charts), XML, CSV, XLS; data export Excel/CSV/PDF/TXT.

**Business rules (quoted)**
- Default breed: "En raza, si no seleccionan, se dejará por default Holstein".
- Cow age: "no pueden poner una fecha menor a 24 meses o 720 días". Heifer: "…mayor a 24 meses".
- Infertile heifer: "no debería ser mayor a 30 meses ó 900 días… “Te recomendamos que el animal se sacrifique o venda para carne, pues no ha sido fértil”".
- First calving: "Fecha ultimo parto… No puede ser menor a 22 meses o 660 días desde de la fecha de nacimiento".
- Reproductive filter thresholds: "Recién paridas (menor a 45 días)", "Secas (60 días antes de parto)".
- Heifer stages (2018:907744):
  - "Recien nacidas - hasta los 6 meses para cambio a desarrollo".
  - "En desarrollo - de 6 meses hasta los 16 meses - alertas de celo… primera alerta a los 13 meses, última alerta de celo en caso que no haya preñez es a los 18 meses, desbloquea botón a los 12".
  - "Servidas - a partir de la primera monta".
  - "Cambio de vaquilla a vaca (Automática, posterior al parto)".
- Development reference ranges:
  - Weight at first insemination 330-380 kg (spec note says 300-360 kg).
  - Weaning 60-90 days (note: milk-diet period 45-70 days).
  - First deworming 90-180 days.
  - "Edad para primera vacuna (Se recomienda iniciar a los 90 días)".
- Development stages (8091:164540): 0 a 6 meses; 6 meses a 1 año; 1 año a Inseminación; Inseminación a Parto.
- Abortion definition: "a partir del periodo fetal (aprox. 42 días) hasta antes de los 260 días… antes de los 42 días… Muerte Embrionaria Temprana".
- Milk withdrawal periods (time out of milking for human consumption), counted from the last application:
  - Corticoides 21 días
  - Antibiótico 2-10 días
  - Antiséptico 3 días
  - Antibacteriano 1-3 días
  - Antimicrobiano 3-42 días
  - Antiparasitario 5-42 días
  - Antimicótico 3 días
  - Sincronización celo 2 días
  - Quirúrgico per diagnosis
  - Topicals: no restriction
  - Unknown: use the maximum
- Milk-separation alert: "Enfermedad - todas; Accidente - Solo tratamientos que afecten la ordeña; Tratamiento médico - idem".
- Alert copy samples:
  - "Parto estimado entre los días 01 al 04 de septiembre"
  - "Confirma preñez entre…"
  - "Próximo celo entre…"
  - "Esta vaca lleva 5 días enferma. Evita ordeñar para producción."
  - All are shown as 4-day windows.
- Heat follow-up: days 1-6 tracking ("día 1…día 6"), "Registro celo no observado", "Sistema ya no envía alertas".
- Non-deletable log events: Alta en sistema, Celo, Preñez, Parto. Editable/deletable: Cambio Dieta, Baja, Urgencia Médica, Accidente, Enfermedad, tratamientos, Cambió potrero.
- SINIIGA: 4 to 8 digits; 4 digits are expanded to "MX-00-00-0000-1234".
- Potrero: name ≤60, description ≤120. Default General. Indicator optional. "Selecciona al menos una casilla".
- Users: deleting a user keeps their history. "Crear usuario" is disabled without permissions. "Llevas 1 usuario de 3" (plan cap).
- Plan cap: "Llevas 45 vacas de 50". On non-renewal "el sistema regresa la membresía a una gratuita, considerando solamente las primeras 20 [vacas]… el resto solo se visualizan".
- Alerts: at least 1 channel at onboarding; the user cannot disable all alerts later.
- Vaccination wizard: modal blocks the main menu; leaving early gives "Plan de Vacunación y Desarrollo pendiente".
- Images: JPG/PNG only, ≤2MB.
- Phone: digits and "+" only.

---

## 4. Shared components seen
- Shell: `Encabezado`, `Menu Rancho`, `Footer System`, `Footer Onboarding`, `Smartbell_Logo`, `Bell_icon`, `Avatar`.
- Buttons:
  - `Boton Continuar`, `Boton Omitir Paso`, `Boton Regresar` / `Boton Regresar 1`
  - `Boton Registrar Vaca`, `Boton Registrar Grupo`, `Boton Vacas en Sistema` (counter pill)
  - `Boton agregar foto`, `Boton Imagen`, `Boton Save` / `Boton Save 1`, `Boton Edit` / `Boton Edit 1`
  - `Boton 40h`, `Boton 48h`, `Boton Iniciar Sesion`
  - `Boton Text On/Off`, `Boton Text Check_On/Off`
  - `Boton Vaca-On/Off`, `Boton Vaquilla-On/Off`, `Boton Toro-On/Off`
  - `Boton Responder` / `Boton Answer`, `Health Button`
- Inputs:
  - `Textbox Mediano` (1-5), `Textbox Main-Grande`, `Textbox Main-Mediano`, `Textbox Chico`, `Textbox Nano`
  - `Dropdown Mediano`, `Dropdown Chico`, `Dropdown Nano`, `Dropdown Medium deactivated`
  - `Search Box 40h`, `Search Box 40h with filter`
  - `Checkbox-On/Off`, `Radio-on/off`, `Switch On/Off/Deactivated`
  - `Icono Ojo 1` / `No show` (password eye)
  - `Stepper_Slider2`, `Steper Bar 1/3 card top`, `Calendar Widget`
- Tables: `Header Table`, `Component Table`, `Pagination` / `Pagination 1`, `Scroll` / `Scroll2` / `Scroll 3`, `Group Chip`, `Calf Counter_deactivated`, `Bull Counter_deactivated`, `Cow_counter_for_plan`, `Cow Counter for Plan - Red`.
- Feedback: `Alert_Message`, `Alert_icon`, `Red_Mark`, `Alerts_Icon`, `more_info_icon`, `KPI event level individual cow`.
- Icons:
  - `Icono Cows in Heat`, `Icono Pregnant cows`, `Icono Sick Cows`, `Icono DIM`, `Icono Calf`
  - `Icono Email`, `Icono Web Alert`, `Icono SMS`, `Icono Notificacion`
  - `Vaca adulta`, `Cow calf`, `Toro`, `vaccine`, `Stall`, `Report_Icon`
  - `Pencil`, `Garbage`, `delete`, `add`, `Show`, `Download`, `Format_Icon`, `Email`, `Mastercard`, `Visa`, `Paypal`
- Illustrations: `Cow_Dancing`, `Cow_Sitted`, `Cow_Glass_Milk`, `Bull_Glass_Milk`, `Cow_Sad`, `Cartilla_Ilustración`.
- Dropdown parts:
  - `cow filter dropdown category *`, `Group filter dropdown category *`, `Race filter dropdown category *`, `Reproductive State filter dropdown category *`
  - `Drop_down_races`, `Drop_down_stalls_400w`, `Filter for cow section for stalls`, `Cow_Illness_dropdown*`
  - `Frecuency_Vaccine` (+ `_UniqueAplication`, `_Reinforcment`, `_6months`, `_EveryYear`)
  - `Tooltip for user configurations`, `Tooltip for alerts/reminders`, `Tooltip for qualified colostrum`

---

## 5. Open questions / inconsistencies
1. **Empty left sidebar.** The mint 240px column has no content on any web frame; navigation lives only in the topbar. Is the sidebar dropped, or still to be designed?
2. **Pricing mismatch.** Plan screenshots show $549 / $1,049 / $1,549 Mx/Mes. Text layers in 1022:41836 / 4019:163049 say $15 / $45 / $79 Usd/Mes. Module notes give MXN annual prices.
3. **"DIM" column on heifers and bulls** holds age-like numbers. Should it be "Edad (meses)"?
4. **Toro list** search placeholder says "ID Vaquilla" (copy bug).
5. **Heifer birth-date rule.** "no pueden poner una fecha mayor a 24 meses" contradicts the 30-month infertility warning. The intended max age needs confirming.
6. **Weight for first insemination.** UI says 330-380 kg; the spec note says 300-360 kg.
7. **Vaccine start options.** The modal shows Edad/Peso only, but the summary shows "Despues del primer celo" and the spec lists event triggers. The modal is missing an "Evento" option.
8. **Dose units.** "ml" in the modal, "2 ml por kg" on the card. Is dose per kg body weight or absolute?
9. **Etapa Reproductiva options** in the form are only partially visible (Vacia, En celo, Gestante). Do they match the filter enum (adds Servida, Secas, Recién paridas)?
10. **Estado de Lactancia options** other than "Lactando" are not shown.
11. **Signup** has no confirm-password field; Create-user does. Signup has an address field, but the error list does not say whether it is required.
12. **Forgot-password flow** is not designed (link only). Note 2448:173792 hints at a reset by emailed link.
13. **Potrero filter** offers Edad / Raza / # Lactancias, while the cow list filter offers Grupo / Raza / Reproducción / Salud / Bajas. The two filter models are inconsistent.
14. **Lactation and age values** show "3, 4, 5, 6, más". Are 1 and 2 missing?
15. **Toro registration** has no potrero field; bulls are absent from potrero flows.
16. **Typos** in copy: "cotraseña", "Guernsev", "Repodrucción", "Siguentes partos", "Creá los potreros digitales que tiene", "nombe".
17. **Gated SMS.** The SMS channel is offered at onboarding, but plan Cría includes e-mail alerts only. Behaviour when the plan does not include SMS is not designed.
18. **Duplicate sub-pages.** Web_System_Cow_Registry_and_Filters (2018:622410) is a subset of 2018:877618 with no unique copy, so it can be treated as a duplicate.
19. **Coverage.** Screenshot coverage was limited by Figma MCP rate limits. Frames not screenshotted (e.g. 1118:42574 payment methods, 1022:41836 modules, 923:38945 messages, 1315:53819 config tabs) were inventoried from text layers only, so their layout is unverified.
