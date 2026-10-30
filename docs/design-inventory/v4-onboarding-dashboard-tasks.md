# v4 inventory: onboarding, task-based dashboard, task log (tareas), OTO offer, WhatsApp support

Source: Figma **Smartbell - 4.0**, fileKey `hmrArjwi6iI4cOlPkR5hQD`, page `0:1` "Nuevo flujo y formularios".
Link format: `https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=<id with - >`. Below, `[3099-9569]` means that link.

Method: text layers were parsed from the saved page XML. Screenshots were checked for the onboarding section (2901:5564), the post-onboarding flow section (2951:10188), the dashboards (3049:9523, 3282:10240), task details (3099:10595, 3282:10075) and web onboarding (5:695, 5:963). Animal-registration forms (`2955:9420`, `2955:8971` "Primer animal" detail, `3845:9789`) are out of scope; another agent covers them.

**Visibility matters in this file.** Hidden frames are superseded or parked work:
- **Hidden:** `417:3241` Empty_Dashboard (with the label "Futuro"), `769:5136` New dashboard (with the label "Futuro - Intermedio"), `2904:8729` (an earlier post-onboarding dashboard), `2908:8984`, the mobile Felicidades `2901:5613`, and `3263:9032` (the "Cuántas vacas", "Éxito estimado" and video-tutorial screens).
- **Visible (the current v4 design):** the mobile onboarding, OTO, the task dashboards, task detail, new task, the WhatsApp notes and web `417:2212`.

---

## 1. Screens

### 1.1 Splash
- [2901-5671](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5671) `Splash` (360x750).
- Purpose: launch screen with a blue gradient, the bell logo "Smartbell" and a cow-and-calf line drawing. No text and no actions; it auto-advances to Home.

### 1.2 Home / landing
- [2901-5663](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5663) `Home`.
- Copy: "Soluciones **inteligentes** para aumentar la **rentabilidad** de tu rancho" (smart solutions to raise your ranch's profitability). The background is a barn photo.
- Actions:
  - **Iniciar Sesión** (log in) goes to Login (1.4).
  - **Crear Cuenta** (create account) goes to Sign up (1.3).

### 1.3 Sign up (mobile)
- [2901-5565](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5565) `Sign up` (360x982).
- Purpose: create the user account. **No ranch fields anymore.**
- Social sign-in, under "Acceder con:" (access with): **Google** and **Facebook** buttons.
- "O proporciona tus datos:" (or enter your details):

| Label (es) | Gloss | Type | Req | Placeholder / format |
|---|---|---|---|---|
| Nombre | Name | text | not marked | "Nombre" |
| Teléfono | Phone | dial code + tel | not marked | "+52" (separate box) and "33-3456-7890" |
| Correo electrónico | Email | email | not marked | the placeholder wrongly reads "Nombre" |
| Contraseña | Password | password | not marked | "***********" |
| Confirmar contraseña | Confirm password | password | not marked | "***********" |
| Acepto los Términos y condiciones | I accept the T&C | checkbox + link | implied | unchecked by default (`Checkbox-Off`) |

- Actions:
  - **Crear Cuenta** goes to Primera vaca (1.6).
  - "¿Ya tienes cuenta? Da click aquí" (already have an account? click here) goes to Login.
- States: only the empty state is drawn. No validation or error states in v4.

### 1.4 Login (mobile)
- [3291-9399](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3291-9399) `Login`.
- Social sign-in: "Acceder con:" **Google** and **Facebook**.
- Fields:
  - **Usuario** (user): text, placeholder "Nombre". It does not say whether this is an email or a phone number.
  - **Contraseña** (password): the placeholder wrongly reads "Nombre".
- Actions:
  - **Ingresar** (log in) goes to the Dashboard (1.9).
  - The footer link "¿Ya tienes cuenta? Da click aquí" was copied from Sign up and should read "¿Aún no tienes cuenta?" (copy bug).
- There is no "forgot password" link. A hidden `Group 94` may have held it.

### 1.5 Sign up (web, `Sign up` 1:146) and the legacy web onboarding wizard
- [1-146](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=1-146) (1366x768).
- Header: "Bienvenido, estás tomando una excelente decisión." (welcome, you're making an excellent decision).
- Value props:
  - "Digitaliza tu rancho y mejora tu rentabilidad" (digitize your ranch and improve your profitability)
  - "Lleva un registro más preciso de los partos en tu hato" (keep a more accurate record of your herd's calvings)
  - "Mejora los días en leche" (improve days in milk)
  - "Identifica tus vacas enfermas, y mejora la calidad de tu leche" (identify your sick cows and improve your milk quality)
  - "Mejora tu identificación de celos e incrementa tu productividad" (improve your heat detection and raise your productivity)
- Form: "Nombre", "Registrarme con" (sign up with) a social option, "ó" (or). Button `Boton 48h`. Link "¿Ya tienes cuenta? Inicia sesión aquí" (already have an account? log in here).
- The web wizard frames are all visible and sit in a row:
  - [5-434](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=5-434) **Felicidades**: "Felicidades!!! [Nombre usuario] al registrar tus vacas, estarás en camino a contar con un rancho más rentable, gracias por tu confianza" (congratulations, by registering your cows you'll be on your way to a more profitable ranch, thank you for your trust). One button.
  - [5-695](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=5-695) **Cuantas Vacas**:
    - Question: "¿Cuántas vacas en producción tienes? -- No vaquillas, terneras ó novillonas --" (how many producing cows do you have? not heifers, calves or young heifers).
    - Field: "En mi rancho hay:" (my ranch has), number input, placeholder "Número de vacas que tienes" (number of cows you have).
    - Buttons: **Omitir** (skip) and **Registrar** (register).
  - [5-847](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=5-847) **Primera vaca**: "Registra tu primer vaca" (register your first cow). Fields:
    - Raza (breed): Holstein
    - Potrero (stall): General
    - ID Interno (internal ID): 123
    - Fecha nacimiento (birth date): YYYY-MM-DD
    - Ciclo de lactancia (lactation cycle): 1
    - Último parto (last calving): YYYY-MM-DD
    - "Estapa reproductiva" [sic] (reproductive stage): Ninguno
    - ID SINIIGA: 12345678990
    - Two buttons.
  - [5-963](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=5-963) **Exito estimado** (estimated success):
    - A slider from $2,100 to $63,000.
    - Copy: "Al registrar una vaca adicional de tu rancho, en tu cuenta, estimamos te genere **$2,100 pesos** extras de utilidad al año en tu rancho." (each additional cow you register in your account, we estimate, brings $2,100 MXN extra profit a year to your ranch.)
    - "¿Quieres registrar otra vaca?" (do you want to register another cow?) with **No** and **Sí**.
- The web wizard was not redrawn in v4. Mobile v4 drops the Cuántas vacas and Éxito estimado steps (they are hidden in `3263:9032`).

### 1.6 Primera vaca (first cow, mobile onboarding)
- Frames:
  - [2951-8750](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-8750): the visible, current version.
  - [2901-5972](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5972): the earlier version with all fields, plus the success modal.
  - [2913-12490](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2913-12490): the variant in the flow section, with a Macho/Hembra toggle.
- Title: "Registra tu primera vaca" (register your first cow).

| Label (es) | Gloss | Type | Req | Placeholder |
|---|---|---|---|---|
| Nombre o Número interno * | Name or internal number | text | yes | 123 |
| Raza | Breed | select | no | Holstein |
| Fecha nacimiento * | Birth date | date | yes | YYYY-MM-DD |
| Potrero | Stall/group | select | no | General |

- In 2913:12490 there is also a sex toggle, **Macho / Hembra** (male / female), and a link to "Tengo más datos de mi animal" (I have more data on my animal), which expands to the full form (out of scope).
- Action: **Registrar** (register) opens the success modal (in 2901:5972, group `2901:6018`):
  - Copy: "**Felicidades!!!** -Nombre usuario- acabas de agregar tu primer **vaca** para hacer tu rancho más rentable." (congratulations, you just added your first cow to make your ranch more profitable.)
  - Illustration: `Cow_Dancing`.
  - Button: **Ir a mi cuenta** (go to my account), which leads to OTO (1.7). Per the arrows, the dashboard follows OTO.
- The earlier 2901:5972 fields also included Ciclo de lactancia, Último parto, Etapa reproductiva and ID SINIIGA. The v4 minimum is 4 fields.

### 1.7 OTO: 50% discount offer (one-time offer)
- Section: [2901-6385](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-6385) "OTO - 50% de descuento". Frame `2901:6386`, named "Exito estimado" (a leftover name).
- Purpose: an upsell shown once, right after the first cow, before the dashboard.
- Copy: "Contrata tu membresía ahora con un 50% de descuento en tu primer año usando el siguiente código: **50Primero** y comienza a mejorar la rentabilidad de tu rancho desde hoy" (sign up for your membership now with 50% off your first year using the code 50Primero, and start improving your ranch's profitability today).
- Card (frame named `Paypal`):
  - "Pago electrónico de membresía básica" (electronic payment for the basic membership).
  - "Pagas, y se acredita en menos de 1 hora. Contrata tu membresía ahora" (you pay, and it is credited in under 1 hour; sign up now).
  - Price options (link-styled buttons):
    - **$250 mx Mensual** (monthly; dark, primary)
    - **$2,500 mx Anual** (yearly; outline)
  - Note: "Ahorra $500 mx pagando anualmente" (save $500 MXN by paying yearly).
- Illustration: `Vaquitas felices` (happy cows).
- Exit link: **Omitir e ir a mi cuenta** (skip and go to my account), which goes to the Dashboard.
- It does not show where the code is entered, nor the payment provider screens. The frame name implies PayPal.

### 1.8 Onboarding_OTO: "Contrata tu membresía" (from the "Contratar mi plan" task)
- [2951-8498](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-8498).
- Annotation: "Mostrar modal presentando membresía básica únicamente" (show a modal presenting the basic membership only).
- Content: the same price card without the discount. Card copy: "Pago electrónico de membresía…", "$250 mx Mensual", "$2,500 mx Anual", "Ahorra $500 mx pagando anualmente".
- Support block: "Para asistencia comunícate al whatsapp: **333•405•6398**" (for help, contact us on WhatsApp), with an agent photo.
  - Linked WhatsApp prefill [2955-7989](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-7989): "Me interesa contratar la membresía, quisiera conocer si tienen otros métodos de pago" (I want to buy the membership; I'd like to know whether you have other payment methods).
- Link: **Regresar a mi cuenta** (back to my account) goes to the Dashboard. A hidden "left arrow" and a hidden "Servicio de registro de vacas" (cow registration service) option are parked.

### 1.9 Dashboard = task list (Dashboard actualizado)
- Frames:
  - [3099-9569](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3099-9569): steady state, with the progress banner hidden.
  - [3049-9523](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3049-9523): with the registration progress banner.
  - [3099-10145](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3099-10145): banner below the list.
  - [3282-10240](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3282-10240): automatic heat task.
  - [2951-7886](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-7886): annotated flow version, with day chips.
- Purpose: **the home screen is now a dated to-do list.** The KPI tiles are gone from the MVP home.
- Header (`Encabezado`):
  - `Bell_icon` (logo)
  - ranch dropdown "Nombre del Rancho" (`Menu Rancho`)
  - `Avatar` with an `Icon_KPI_Event` red count badge (e.g. 4), which opens the avatar menu (1.13)
- Optional `Date Picker`, mostly hidden:
  - month dropdown "Mayo-2024" (May 2024)
  - calendar grid with Local Actions (Clear / Secondary / Primary), all hidden in the latest frames
- Registration progress banner (`Progress bar`), close (x):
  - Title: "Termina el registro de tus vacas para lograr mejorar tu rentabilidad" (finish registering your cows to improve your profitability). The older title was "¿Cómo va el registro de tus vacas?" (how is your cow registration going?).
  - Cow counter `Cow Counter_activated_mobile` showing "002".
  - Slider with a `$` coin (the `Money` icon 3036:8533). Left: "$4,200 Estimado actual" (current estimate). Right: "$105,000 Total Estimado extra" (total extra estimate).
  - Annotation 2951:10146: "Banner persistente al momento de abrir sesión, si el usuario no ha llegado a terminar de registrar todas sus vacas" (persistent banner when opening a session, if the user hasn't finished registering all their cows).
- Task list (`Listado de tareas`):
  - Grouped by **month** with a blue bar "Tareas Mayo 2024" (May 2024 tasks), then by **day**: "Martes 4 de Mayo de 2024" (Tuesday, May 4, 2024), "Miércoles 5 de Mayo de 2024".
  - Earlier variant 2951:7886 / 2904:7980: a day chip on the left ("04 Mar", "05 Mie") and a weekly heading "Semana del 2 al 8 de Mayo de 2024" (week of May 2 to 8, 2024).
  - Example rows (component `Cows in Heat`, 343 wide), with right-side affordances:

| Row text (es) | Gloss | Kind (inferred) | Right side |
|---|---|---|---|
| Da click para terminar tu primera tarea | Click to finish your first task | onboarding tutorial | checkbox |
| Registrar animales / Registrar mis vacas | Register animals / my cows | onboarding / system | (cow icon hidden) |
| Contratar mi plan | Buy my plan | promotion/sales | **red border**, no icon |
| Registrar primer evento de mi primer vaca - {vaca ID} | Log the first event of my first cow | automatic, animal-related | cow icon + checkbox |
| Observar parto vaca 3455 | Watch for calving, cow 3455 | automatic repro | – |
| Observar celo vaca 123 / "Observar el celo de vaca {ID interno vaca}" | Watch for heat | automatic repro (heat) | cow icon |
| Separar a seca vaca 3387 | Separate cow 3387 for dry-off | automatic repro (dry-off) | – |
| Inseminar vaca 3357 | Inseminate cow 3357 | repro | – |
| Hacer inventario de farmacia | Do the pharmacy inventory | user-created, not animal | – |
| Preparar dieta para vacas frescas | Prepare a diet for fresh cows | user-created, not animal | – |
| Tarea personalizada 1 | Custom task 1 | user-created (2904 variant) | cow icon + checkbox |

- Bottom actions:
  - **Nuevo animal** (new animal; light blue) goes to the animal registration form.
  - **Nueva tarea** (new task; pink/red) goes to New task (1.10).
- Footer tab bar (`Footer_Mobile`): **Tareas** (tasks) | **Vacas** (cows) | **Grupos** (groups) | **Reportes** (reports) | **Ranchos** (ranches).
- Annotations in 2951:10188 tie to these elements:
  - "Desaparece al momento de dar click en el check box" (disappears when the checkbox is clicked): the tutorial task.
  - "Seguirá apareciendo hasta terminé el número de animales que declaró o que contrate su membresía" (keeps appearing until they finish the number of animals they declared, or buy the membership): the "Registrar animales" task.
  - "Mostrar modal presentando membresía básica únicamente": "Contratar mi plan" goes to 1.8.
  - "Dependiendo los datos registrados del primer animal, mostramos celo, confirmación último parto, confirmación preñez, separación para secado o reto" (depending on the first animal's registered data, we show heat, last-calving confirmation, pregnancy confirmation, separation for drying off, or "reto"/close-up): the automatic task for the first animal.
  - Footer: Tareas = "Pantalla inicial" (home screen); Vacas = "Listado actual de animales (No hay cambios de momento)" (current animal list, no changes for now); Grupos / Reportes / Ranchos = "Muestran pantalla modal para contactarnos vía whatsapp inicialmente para conocer más detalles" (they show a modal to contact us on WhatsApp, at first, to learn more). See 1.14.
- States:
  - New user: tutorial task, Registrar animales, Contratar mi plan, plus the first cow's automatic task.
  - Steady (3099:9569).
  - Only one automatic task (3282:10240).
  - **No empty state** ("no tasks today") is drawn.
- Hidden earlier variants:
  - 2904:7980 / 2904:7318: shortcut rows above the list:
    - "Celos a observar" (heats to observe)
    - "Seguimiento vacas enfermas" (sick-cow follow-up)
    - "Seguimiento vacas preñadas" (pregnant-cow follow-up)
    - "Registro producción del día" (today's milk production log)
  - These look like task category filters or KPI shortcuts. They were dropped from the visible v4.

### 1.10 New task (Nueva tarea)
- Frames:
  - [3049-9969](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3049-9969) `Onboarding_Dashboard` (375)
  - [3023-8355](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3023-8355) (360)
  - [2908-8984](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2908-8984) (hidden duplicate)
- Header bar: "× Nueva tarea" (close returns to the Dashboard).

| Label (es) | Gloss | Type | Req | Placeholder / options |
|---|---|---|---|---|
| Nombre de la tarea | Task name | text | implied yes | "Nombre de la tarea" |
| Fecha de la tarea | Task date | date | implied yes | YYYY-MM-DD |
| Frecuencia | Frequency | dropdown | ? | default "Diaria" (daily). Other options not drawn |
| Animal relacionado a la tarea | Related animal | animal picker | no | "Selecciona un animal si es necesario" (select an animal if needed) |
| Asignar | Assign to | user picker | no | "Selecciona un usuario" (select a user) |
| Notas | Notes | textarea | no | "Notas importantes de la nueva tarea a crear, como pudieran ser compras a realizar, llamadas, etc." (important notes for the new task, such as purchases to make, calls, etc.) |

- Action: **Guardar tarea** (save task; pink) goes back to the Dashboard. No validation, no success toast and no time-of-day field.

### 1.11 Task detail (manual / generic)
- [3099-10595](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3099-10595) `Detalle tarea`.
- Header bar: "× Observar parto vaca 3455". Annotation 3099:10968: "Encabezado: Nombre tarea + ID animal" (header: task name + animal ID).
- Fields (read-only display; the hidden fields Nombre, Frecuencia and Animal can appear):
  - **Fecha de la tarea** (task date): YYYY-MM-DD
  - **Usuario asignado para la tarea** (user assigned to the task): e.g. "Administrador"
  - **Notas** (notes): "Indicaciones capturadas al momento de crear la tarea para referencia del usuario a quien se le haya asignado." (instructions captured when the task was created, for the assignee's reference.) Annotation 3099:10945: "A mostrar solo si el usuario registró notas" (show only if the user entered notes).
- Actions:
  - **Eliminar** (delete; red, trash icon). No confirm dialog is drawn.
  - **Completada** (completed; green). Annotation 3099:10959: "Marca la tarea como realizada y la elimina de la lista" (marks the task as done and removes it from the list).
  - × closes.
- No edit action.

### 1.12 Task detail: automatic heat task
- [3282-10075](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3282-10075) `Detalle tarea automática celo`.
- Entry: tap the row "Observar el celo de vaca {ID interno vaca}" on 3282:10240.
- Header: "× Observar el celo de vaca {ID interno vaca}".
- Body:
  - "**Registro de Celo**" (heat record)
  - "Estas a punto de registrar un evento de celo" (you are about to record a heat event)
  - "¿Este animal entró o no en un periodo de celo?" (did this animal come into heat or not?)
- Actions:
  - **No entró** (did not come into heat; red). Records a "no heat" outcome.
  - **Sí, confirmar** (yes, confirm; green). Continues into the heat-registration wizard (clean? inseminated? and so on; see the event flows).
- So an automatic task's detail **is** the event-confirmation prompt, not a generic task card. Presumably the task completes when its event is recorded.

### 1.13 Avatar menu (Menú desplegable)
- Frames: [3133-9247](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3133-9247) and section [805-5447](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=805-5447).
- Items:
  - **Mi perfil** (my profile)
  - **Mis ranchos** (my ranches; 3133 has the typo "Mi ranchos")
  - **Mensajes recibidos** (received messages)
  - **Administrar usuarios** (manage users)
  - **Soporte** (support)
  - **Cerrar sesión** (log out)
- The hidden `Frame 293` "M" is an avatar initial.
- Annotation 3133:9263 "Descripción soporte": "Soporte — Enlace de soporte a WhatsApp Smartbel" (Support: WhatsApp support link).
- Annotation 3133:9276: "Botón de soporte (Enlace de whatsapp)" (support button, WhatsApp link).
- Annotation 3133:9277, the WhatsApp prefill: "Necesito que me ayuden a usar Smartbell." (I need help using Smartbell.)
- A nearby label 3133:9274 reads "**MVP 2da etapa**" (MVP 2nd stage). Its exact target is ambiguous; it probably marks some menu items (messages, users, ranches) as phase 2.

### 1.14 "Funcionalidad en construcción" modal (feature under construction)
- Inside [2951-7886](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-7886) as `2951:8340`, drawn over a dimmed dashboard.
- Copy:
  - "Funcionalidad en construcción" (feature under construction)
  - "Me interesa conocer más detalles" (I'd like to know more)
- Button: **Contactar en WhatsApp** (contact on WhatsApp), with a WhatsApp icon.
- Prefill 2955:7982: "Me interesa la funcionalidad {nombre}, quisiera conocer más acerca de la misma" (I'm interested in feature {name}; I'd like to know more about it).
- Triggered by the Grupos, Reportes and Ranchos tabs (per the annotation). It works as a demand-validation "fake door".

### 1.15 Web dashboard (v4 visible) `417:2212`
- [417-2212](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=417-2212) `Empty_Dashboard` (1366).
- Left nav: **Tareas | Vacas | Grupos | Reportes | Usuarios | Ranchos**.
- Visible content:
  - progress banner "¿Cómo va el registro de tus vacas?" (500 wide)
  - button **Nuevo animal**
- The KPI tiles (Preñadas, Enfermas, DIM, Cows in Heat x2, Distribución del hato labels) are **hidden** in group `2908:8771`.
- No web task list is drawn.

### 1.16 Parked KPI dashboards (hidden, labelled "Futuro")
- [417-3241](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=417-3241) and [420-2728](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=420-2728) (web).
  - Nav: Inicio | Vacas | Grupos | Alertas | Historial | Reportes.
  - Title: "Esta es la informacion general de tu rancho." (this is your ranch's general information.)
  - **Producción de Leche** (milk production): "16 lts/día promedio por vaca" (litres/day average per cow), and "Registra tu producción del día" (log today's production) with the input "Litros totales del día" (total litres today).
  - **Celos a confirmar** (heats to confirm): "02 A revisar hoy" (to check today) / "01 Para seguimiento" (for follow-up).
  - **Vacas por vacunar y dar tratamiento** (cows to vaccinate and treat): "02 Por vacunar" (to vaccinate) / "01 A dar tratamiento" (to treat).
  - KPIs with "Ver más" (see more):
    - Días Abiertos 75 (days open)
    - DEL 120 (days in milk)
    - Enfermas 001 (sick)
    - Preñadas 016 (pregnant)
  - **Distribución del hato** (herd distribution) donut: Preñadas, Con servicio, Abiertas, Enfermas.
  - Progress bar: "$4,200 Utilidad extra estimada actual" (current estimated extra profit).
- [769-5136](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=769-5136) "New dashboard" (label "Futuro - Intermedio"). Mobile `722:2884` and `555:2921`:
  - Title "¿Cómo va él rancho?" (how is the ranch doing?)
  - tabs VACAS / GRUPOS / REPORTES / HISTORIAL / ALERTAS
  - Celos a confirmar, Producción de Leche, Días Abiertos, DEL, Enfermas, Preñadas
  - calf/bull/cow counters and Add cow
  - progress banner (722 only)
- **Status: future/intermediate.** It is not part of the v4 MVP home.

---

## 2. Flow diagrams

**F1. New user onboarding (mobile, v4)**
1. Splash → (auto) → Home.
2. Home → **Crear Cuenta** → Sign up (Google | Facebook | form) → **Crear Cuenta**.
3. → Primera vaca (4 fields; optional Macho/Hembra; optional "Tengo más datos…" full form) → **Registrar**.
4. → Felicidades modal → **Ir a mi cuenta**.
5. → OTO 50% (code `50Primero`; $250/mo or $2,500/yr) → pay, or **Omitir e ir a mi cuenta**.
6. → Dashboard (task list) with the seeded tasks: "Da click para terminar tu primera tarea", "Registrar animales", "Contratar mi plan", plus 1 automatic repro task for the first cow and the progress banner.

**F2. Returning user**: Home → **Iniciar Sesión** → Login (Google | Facebook | Usuario + Contraseña) → **Ingresar** → Dashboard. The banner persists while declared cows > registered cows.

**F3. Legacy web onboarding** (visible, not redrawn): Sign up (web) → Felicidades → Cuántas vacas (Omitir | Registrar) → Primera vaca → Éxito estimado ("¿Quieres registrar otra vaca?" Sí loops to Primera vaca, No goes to the Dashboard).

**F4. Create a manual task**: Dashboard → **Nueva tarea** → form (name, date, frequency, animal?, assignee?, notes?) → **Guardar tarea** → Dashboard (the task appears under its month/day).

**F5. Work a manual task**: Dashboard row → Detalle tarea → **Completada** (marked done and removed from the list) | **Eliminar** (deleted) | × (back). The tutorial task can also be checked inline; checking the row's checkbox removes it.

**F6. Work an automatic heat task**: Dashboard row "Observar el celo de vaca {ID}" → Detalle tarea automática celo:
- **Sí, confirmar** → heat registration wizard → event logged → task closed.
- **No entró** → "no heat" logged → task closed (and presumably the next heat task is scheduled at +21 d).

**F7. Upsell from a task**: "Contratar mi plan" row → Onboarding_OTO (basic membership only) → pay | WhatsApp 333-405-6398 (prefill about payment methods) | **Regresar a mi cuenta**.

**F8. Fake-door tabs**: tab Grupos / Reportes / Ranchos → "Funcionalidad en construcción" modal → **Contactar en WhatsApp** (prefill with the feature name) or dismiss.

**F9. Support**: Avatar → menu → **Soporte** → opens WhatsApp with "Necesito que me ayuden a usar Smartbell."

**F10. Register more animals**: Dashboard → **Nuevo animal** → animal form (other inventory) → Dashboard; the banner counter and the $ estimate rise.

---

## 3. Domain notes

### 3.1 Task (Tarea): implied entity
| Field | Source |
|---|---|
| id, ranch_id | ranch switcher on every screen |
| title | "Nombre de la tarea"; for automatic tasks a template + animal ID ("Observar el celo de vaca {ID interno vaca}"; "Encabezado: Nombre tarea + ID animal") |
| due_date (date only) | "Fecha de la tarea" YYYY-MM-DD; the list groups by month then day |
| frequency | "Frecuencia", default "Diaria". Enum guess: ONCE, DAILY, WEEKLY, MONTHLY (only "Diaria" is drawn). "Tareas recurrentes" appears in the priority list |
| animal_id (nullable) | "Animal relacionado a la tarea … si es necesario" |
| assignee_user_id (nullable) | "Asignar / Selecciona un usuario"; detail "Usuario asignado para la tarea: Administrador" (a role name shown, so it may be user or role) |
| notes (nullable) | "Notas"; shown only if present |
| source | MANUAL (user-created) / AUTOMATIC ("Calculadas automaticamente") / SYSTEM-onboarding / PROMO |
| kind / category | see 3.2 |
| status | OPEN → DONE ("Completada … la elimina de la lista") or DELETED ("Eliminar"). No snooze, overdue or skipped state is drawn |
| completed_by, completed_at | implied by Completada |
| linked_event_id | the automatic heat task resolves by recording a HEAT event ("Estas a punto de registrar un evento de celo") |
| completion_rule | some tasks close on a condition, not a click: "Registrar animales" stays "hasta [que] terminé el número de animales que declaró o que contrate su membresía" |

### 3.2 Task categories (annotation 3099:10935, "Categorías de tareas")
Verbatim, with a gloss:
- "Relacionadas a un animal (con ícono)": related to an animal, shown with a cow icon
- "Creadas por el usuario": created by the user
- "Calculadas automaticamente": calculated automatically
- "No relacionadas a un animal": not related to an animal
- "No asignadas a un usuario": not assigned to a user
- "Asignadas a un usuario (con ícono)": assigned to a user, shown with an icon (probably the hidden `Frame 303` on each row)
- "De promoción o ventas (sin ícono) Con borde color rojo-smartbell": promotion/sales, no icon, red Smartbell border (e.g. "Contratar mi plan")

These are three independent facets plus one style rule:
- **origin**: user / automatic
- **animal link**: yes / no
- **assignment**: yes / no
- **promo**: red border

### 3.3 Display priority (annotation 3099:9118, "Prioridades/Orden para mostrar las tareas"), verbatim order
1. Terminar de registrar mis animales (finish registering my animals)
2. Eventos de Salud (health events): Tratamientos (treatments), Cambios de dieta (diet changes)
3. Eventos reproductivos (reproductive events):
   - Celo (heat)
   - Preñez (pregnancy): Confirmación diagnóstico (diagnosis confirmation), Confirmación 90 días, Confirmación 180 días
   - Secado (dry-off)
   - Reto (close-up / transition, pre-calving)
   - Parto (calving)
4. Tareas creadas por el usuario (user-created tasks): Relacionadas a animal (animal-related), Asignadas a usuario (assigned to a user), Eventos de Salud, Tratamientos, Cambios de dieta
5. Tareas recurrentes que no estén relacionadas con las anteriores (recurring tasks not related to the above)
6. Otras tareas de marketing (other marketing tasks): "Puede ser un banner que rote la información como la tiene la otra aplicación adicional a las tareas" (could be a banner that rotates the information, as the other app does, in addition to the tasks)
   - Contratar plan (buy a plan)
   - Agregar a mi equipo / Invitar a otros usuarios (add to my team / invite other users)
   - Mostrar ofertas de socios comerciales (show commercial partner offers)
   - Mostrar ofertas de marketing para descuentos (show discount marketing offers)
   - Mostrar invitaciones a eventos (show event invitations)

The list is grouped by date, so the priority presumably orders tasks **within a day**. The mock shows "Contratar mi plan" (promo) on the same day under the onboarding tasks, consistent with that.

### 3.4 Automatic task kinds (what generates tasks)
From the priority list, the annotation 2951:10130 and the mock rows:

| Kind | Title template seen | Trigger (rule implied) |
|---|---|---|
| ONBOARDING_TUTORIAL | "Da click para terminar tu primera tarea" | new account; closes on checkbox |
| REGISTER_ANIMALS | "Registrar animales" / "Registrar mis vacas" | registered < declared herd size and no membership |
| BUY_PLAN (promo) | "Contratar mi plan" | no active membership |
| FIRST_EVENT | "Registrar primer evento de mi primer vaca - {vaca ID}" | first cow registered; kind depends on her data ("mostramos celo, confirmación último parto, confirmación preñez, separación para secado o reto") |
| HEAT_OBSERVE | "Observar celo vaca 123" / "Observar el celo de vaca {ID interno vaca}" | expected heat window (cycle 21 d, from the domain model) |
| PREG_CONFIRM | (Confirmación diagnóstico / 90 días / 180 días) | days after service; **new: 90 d and 180 d re-confirmations** |
| DRY_OFF | "Separar a seca vaca 3387" | expected calving − 60 d |
| CLOSE_UP ("Reto") | – | pre-calving transition; the day count is not stated (industry ~21 d before calving) |
| CALVING_OBSERVE | "Observar parto vaca 3455" | expected calving window |
| INSEMINATE | "Inseminar vaca 3357" | heat confirmed and not inseminated? Or a user task. Unclear |
| LAST_CALVING_CONFIRM | ("confirmación último parto") | onboarding cow with a last-calving date |
| HEALTH_TREATMENT / DIET_CHANGE | – | follow-up of health events |
| USER custom | "Hacer inventario de farmacia", "Preparar dieta para vacas frescas", "Tarea personalizada 1" | manual |

### 3.5 Onboarding / monetisation rules
- **Profit estimate**: $2,100 MXN extra profit per registered cow per year ("estimamos te genere $2,100 pesos extras de utilidad al año").
  - Banner: current = registered × 2,100 (2 cows → "$4,200 Estimado actual").
  - Total = declared × 2,100 (50 cows → "$105,000 Total Estimado extra").
  - The web slider max of $63,000 equals 30 cows.
- **Declared herd size**: "¿Cuántas vacas en producción tienes? -- No vaquillas, terneras ó novillonas --" counts producing cows only. In mobile v4 this step is hidden, yet the REGISTER_ANIMALS rule still depends on "el número de animales que declaró".
- **Pricing (basic membership)**:
  - $250 MXN/month, or $2,500 MXN/year ("Ahorra $500 mx pagando anualmente"; 12 × 250 = 3,000).
  - "Pagas, y se acredita en menos de 1 hora" suggests a non-instant method or manual crediting.
- **OTO**: 50% off the **first year**, code `50Primero`, shown once after the first cow. It is skippable.
- **WhatsApp support number**: 333-405-6398 (Guadalajara area). Prefilled messages:
  - "Necesito que me ayuden a usar Smartbell." (general support)
  - "Me interesa contratar la membresía, quisiera conocer si tienen otros métodos de pago" (payment)
  - "Me interesa la funcionalidad {nombre}, quisiera conocer más acerca de la misma" (fake door)
- **Sign-up account**:
  - Fields: name, phone (+52), email, password + confirm, T&C; or Google / Facebook OAuth.
  - **Ranch name and address are no longer collected at sign-up.** The ranch must be auto-created, e.g. "Nombre del Rancho" as a placeholder in the header.

### 3.6 Navigation model (v4 MVP)
- Mobile tabs: Tareas (home) | Vacas | Grupos* | Reportes* | Ranchos*. *Fake-door modal for now.
- Web nav: Tareas | Vacas | Grupos | Reportes | Usuarios | Ranchos.
- **Alertas and Historial tabs are removed** in both.

---

## 4. Shared components seen
- **Layout:** `Grid/Mobile_Smartbell_Official`, `Grid/Iphone_8`, `Grid/Desktop_regular`
- **Branding:** `Smartbell_Logo`, `Bell_icon`
- **Header and footer:** `Encabezado`, `Header`, `Footer_Mobile`, `Footer System`, `Footer Onboarding`
- **Header controls:** `Avatar`, `Icon_KPI_Event` (badge), `Menu Rancho` (dropdown)
- **Buttons:** `Boton Iniciar Sesion`, `Boton 40h`, `Boton 48h`, `Add cow` / `Add task` (bottom CTA pair), `Boton Registrar Vaca`, `Boton Vacas en Sistema`
- **Form controls:** `Checkbox-Off`, `Material/Content/clear`, `Filtro 6` (row checkbox), `Filtro 7` (radio)
- **Task rows:** `Cows in Heat`. This is reused as the generic **task row and annotation card** component, so the name is misleading.
- **Date picker** (Material 3: `Building blocks/Menu button`, `Icon button`, `Calendar grid`, `Local Actions`, `Primary/Secondary/Clear button`)
- **Progress and counters:** `Progress bar` (registration estimate), `Cow Counter_activated_mobile`, `Calf/Bull Counter_deactivated_mobile`, `Money`
- **Icons:** `Icon_Cow_Adult`, `Icon_Cows_Heat`, `Icon_Sick_Cows`, `Icon_Pregnated_Cows`, `Icono DIM`, `Alerts_Icon`, `Report_Icon`, `Stall`, `Garbage`, `Toro`, `Vaca`
- **Illustrations:** `Cow_Dancing`, `Cow_Glass_Milk`, `Vaquitas felices`
- **Payment:** `Paypal` (price card)

---

## 5. Open questions / inconsistencies
1. **Declared herd size**: the "Cuántas vacas" step is hidden in mobile v4, but the banner total ($105,000) and the "Registrar animales" completion rule depend on it. Is it still asked? Where?
2. **Ranch creation**: sign-up no longer asks for a ranch name or address. Is a default ranch auto-created, and where is it named?
3. **Login**: is "Usuario" an email or a phone number? There is no forgot-password link. The footer link copy is wrong. The Login and Sign up password placeholders say "Nombre".
4. **Task frequency options**: only "Diaria" is drawn. Is there an end date for recurrence? Does completing one occurrence create the next one?
5. **Overdue tasks**: the list is grouped by future month/day. What happens to past-due open tasks (carry over to today, or stay on their date)? There is no overdue style.
6. **Automatic task closure**: does "No entró" close the heat task and schedule the next one? What do automatic non-heat tasks look like in detail (only heat is drawn)? Can automatic tasks be deleted (the generic detail has Eliminar)?
7. **Assignee**: the detail shows "Administrador" (a role), not a person. Is it user or role? Do assignees get notified?
8. **Priority vs date**: the priority list ignores dates. Confirm it orders tasks within a day and that the promo rows always sink to the bottom.
9. **"Inseminar vaca 3357"**: automatic (after a confirmed clean heat) or manual?
10. **"Reto"** and **pregnancy confirmations at 90 / 180 days** are new rules with no day constants given.
11. **OTO**: where is the code `50Primero` entered? Payment provider (PayPal per the frame name)? "Se acredita en menos de 1 hora" implies an async activation state that is not drawn.
12. **Pricing conflict**: $250 MXN/mo vs the domain model's CRIA $15 USD / DESTETE $45 / PRODUCCION $79 tiers. v4 shows a single "membresía básica".
13. **Web**: there is no web task list or web new-task form. The KPI tiles are hidden but the web wizard (Cuántas vacas / Éxito estimado) is still visible. Is the web onboarding out of date?
14. **"MVP 2da etapa"**: unclear which avatar-menu items it covers.
15. **Empty states**: no "no tasks" state. No error states for sign-up or the task form. No delete confirmation.
16. The hidden shortcut rows (Celos a observar / Seguimiento vacas enfermas / preñadas / Registro producción del día) may return as task filters. They are not in the visible v4.

---

## 6. Reconciliation with previous analysis
Legend:
- **SUPERSEDES**: v4 replaces the old design.
- **EXTENDS**: v4 adds to it.
- **CONFLICTS**: needs a decision.
- **UNCHANGED**

### Headline: tasks vs alerts vs reminders
- **v4 replaces the alert and reminder *surfaces* with one task list, and keeps the alert *logic* as the generator.**
  - The Alertas tab and the Recordatorios hub are gone from the nav.
  - The heat alert reappears as the automatic task "Observar el celo de vaca {ID}", whose detail is the same confirm prompt ("¿Este animal entró o no en un periodo de celo?" with No entró / Sí, confirmar), mirroring the old alert modal "¿Quieres confirmar celo?" with Sí / No entró en celo.
  - Onboarding tasks, billing ("Contratar mi plan") and repro follow-ups (the old Reminder kinds) also become tasks.
- Recommendation for the domain model:
  - Keep **Alert** as the internal scheduled-window record, or fold it into Task with `source=AUTOMATIC` and `linked_event_type`.
  - Add **Task** as the single user-facing to-do (manual and automatic), with status OPEN / DONE / DELETED.
  - Replace **Reminder** with Task kinds.
  - Off-app **Notification** channels are not shown in v4 (see A6).
- **Decision needed: merge Alert into Task, or keep both.**

### mobile-core.md
| Item | Verdict | Note |
|---|---|---|
| A1 Splash | UNCHANGED | Logo-only splash, restyled with a gradient and a cow illustration |
| A2 Home | UNCHANGED | Same tagline. Buttons are now labelled Iniciar Sesión / Crear Cuenta |
| A3 Sign up | **SUPERSEDES** (and CONFLICTS on the ranch) | Adds Google/Facebook and confirm-password. Drops Apellido, Nombre de tu rancho and Dirección. Ranch creation is undefined → decision |
| A4 Log in | SUPERSEDES | Adds social login. "Correo" becomes "Usuario". The forgot-password link is gone (likely an omission) |
| A5 Onboarding task hub (4 cards) | **SUPERSEDES** | The card carousel (Configurar alertas / Registrar mis vacas / Organizar mis potreros / Configurar mi rancho) is replaced by a linear flow (first cow → OTO → task list). The onboarding to-dos live on as **tasks** in the list ("Registrar animales", "Contratar mi plan", tutorial task). Potreros, ranch config and alert setup are no longer onboarding steps |
| A6 Alert channel selection | **SUPERSEDES (removed from onboarding)** / CONFLICTS | No channel picker in v4. WhatsApp appears only as support. Decide whether channel preferences survive (push for due tasks?) or are deferred |
| A16 Dashboard KPIs | **SUPERSEDES** for MVP | Home = task list. The KPI dashboard is parked as "Futuro" / "Futuro - Intermedio" (417:3241, 769:5136). The progress/estimate banner, previously hidden, is now primary |
| A17 KPI drill-downs | SUPERSEDES (deferred) | No drill-downs in v4. "Celos a confirmar" today/follow-up is replaced by dated heat tasks |
| F Reminders (scope + hub) | **SUPERSEDES** | The Recordatorios hub is gone from the avatar menu. Its kinds map to tasks: onboarding → REGISTER_ANIMALS / tutorial; reproductive follow-up and pending heats → automatic repro tasks; sick-cow follow-up → "Eventos de Salud / Tratamientos"; billing due → "Contratar plan" (promo). **Not yet mapped** (decide): heifer-to-register, vaccine reminders, user messages ("Mensajes recibidos" remains in the avatar menu) |
| A16 user menu | SUPERSEDES | New menu: Mi perfil, Mis ranchos, Mensajes recibidos, Administrar usuarios, Soporte (WhatsApp), Cerrar sesión. Dropped: Cambiar plan, Vacunación y desarrollo, Recordatorios, Ayuda (FAQ / email / phone / chat → WhatsApp), Legal |

### web-onboarding-registry.md
| Item | Verdict | Note |
|---|---|---|
| 1.1 Log-In | SUPERSEDES (mobile); web not redrawn | Mobile v4 login has social and "Usuario". Old web error copy is still usable |
| 1.2 Signup | CONFLICTS | The v4 web Sign up (1:146) keeps the value props and adds "Registrarme con" social sign-up, but the old form had ranch name/address. Mobile v4 drops them. Align web and mobile |
| 1.3 Onboarding cards | SUPERSEDES | As A5. The v4 web wizard instead is Felicidades → Cuántas vacas → Primera vaca → Éxito estimado (mobile hides the middle steps) |
| 1.16 Dashboard + drill-downs | SUPERSEDES for MVP | The v4 web dashboard (417:2212) hides the KPIs and shows the banner + "Nuevo animal". The nav becomes Tareas / Vacas / Grupos / Reportes / Usuarios / Ranchos (Inicio, Alertas, Historial removed). The full KPI page is "Futuro" |

### alerts-dashboard-reports.md
| Item | Verdict | Note |
|---|---|---|
| 1.1 Mobile dashboard | SUPERSEDES for MVP (deferred) | See A16. The milk-production tile and Días Abiertos/DEL survive only in the hidden "Futuro" frames |
| 1.1.a–d drill-downs | SUPERSEDES (deferred) | Replaced by dated tasks |
| 1.1.e Avatar menu | SUPERSEDES | See the A16 user menu. Help → WhatsApp |
| 1.2 Web dashboard | SUPERSEDES for MVP | "Distribución del hato" etc. hidden / "Futuro" |
| 1.3 Mobile alerts list (type + period + toggle rows) | **SUPERSEDES** | No Alertas tab. Each alert becomes a task row dated on its due day. Filtering by type is replaced by the priority ordering. The type/period filters are gone |
| 1.4 Confirmation modals | **EXTENDS** (heat) / UNCHANGED (logic) | The heat confirm now lives in the task detail ("Registro de Celo … No entró / Sí, confirmar"). Pregnancy / calving / health equivalents are not drawn in v4. Assume the same pattern. Adds an explicit "complete/delete" for manual tasks (the old "no dismiss" gap is answered for manual tasks only) |
| 1.5 Web alerts list | SUPERSEDES | Same as 1.3. No web task list drawn (open question) |

### domain-model.md
| Item | Verdict | Note |
|---|---|---|
| Alert entity | **CONFLICTS** | Decide: Alert is internal and generates Task, or Task absorbs Alert. The follow_up_day 0..5+ bucketing has no v4 surface |
| Reminder entity | **SUPERSEDES** → Task | Map the kinds as above. Add a Task entity (3.1) with source, category facets, frequency, assignee, animal, notes, status, completion rule |
| §4 "What each event schedules" | EXTENDS | Same triggers, now emitting tasks. New ones: pregnancy confirmations at 90 d and 180 d, "Reto" (close-up) before calving, an Inseminar task, "confirmación último parto" for onboarded cows, "Terminar de registrar mis animales", marketing tasks |
| User / Ranch (sign-up) | CONFLICTS | The ranch is not captured at sign-up. Add OAuth identities (Google, Facebook). Add a declared herd size (`declared_cow_count`) to Ranch |
| NotificationPreference | CONFLICTS / deferred | No channel UI in v4. WhatsApp is used for support, not alerts |
| Plan / billing | **CONFLICTS** | v4: one basic membership at $250 MXN/mo or $2,500 MXN/yr, with OTO coupon `50Primero` (50% off the first year). The model's CRIA / DESTETE / PRODUCCION USD tiers need reconciling. Add Coupon/Promotion, and a pending-payment state ("se acredita en menos de 1 hora") |
| MilkRecord / dashboard KPIs | UNCHANGED (deferred) | Still in the "Futuro" frames |
| New: profit estimate | EXTENDS | $2,100 MXN/cow/year constant (⚙ RanchSettings or global config) driving the banner |
| New: fake-door / interest capture | EXTENDS | Grupos / Reportes / Ranchos tabs open a WhatsApp CTA with a feature-name prefill. Consider logging an `interest` event for analytics |
| §2 state machine, §3 rules | UNCHANGED | Heat/check/calving logic unchanged. v4 adds 90/180-day pregnancy reconfirmations and a "Reto" stage. Both need constants |
