# Mobile core inventory: onboarding, cow profile, stalls, events hub, configuration, reminders

Source: Mobile Figma file `gv5ugNqVKPF8N2Ol5cQCyV`.
Link pattern: `https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=<id with - instead of :>`, for example [1594-94550](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1594-94550).

| Page | Page id | Screen frames (h >= 640) | Notes |
|---|---|---|---|
| Mobile_Onboarding | 1223:0 | 99 | plus tooltips, dropdowns and "Error handling" note texts |
| Mobile_Cow_Tab_cow_profile_deletion_log_consultation_and_cow_delete | 1442:69863 | 91 | about 26 of these are copies of the registry frames |
| Mobile_Cow_Stalls | 1442:69864 | 31 | |
| Mobile_Cow_Tab_events (the events hub) | 1866:106692 | 121 | **about 109 of these are DESKTOP 1366x768 frames**, not 360 mobile |
| Mobile_Configurations_Tab | 1442:69869 | 64 | 7 of these are desktop (Messages, permission map) |
| Mobile_Reminders | 1442:69870 | 8 | |
| **Total** | | **about 414 frames, grouped below into 58 logical screens** | |

How this was built: the full metadata of all 6 pages was parsed, covering 100% of text nodes. 22 screenshots were checked visually. The Figma MCP hit its rate limit partway through, so some option labels inside component instances (radio and toggle labels) were not readable. They are marked "(label in instance, not read)".

Global chrome on almost every mobile frame:
- Top bar: `Bell_icon` (notification counter, for example "4") / "- Nombre Usuario -" / `Avatar`, which opens the user menu.
- Below the top bar: `Menu Rancho` (dropdown "Nombre del Rancho", the ranch switcher), with a `left arrow` (back) on inner pages.
- Bottom tab bar `Footer_Mobile`: **VACAS** (cows) / **GRUPOS** (groups, stall icon) / **HISTORIAL** (history) / **REPORTES** (reports) / **ALERTAS** (alerts).

---

## 1. Screens

### A. Onboarding (page 1223:0)

#### A1. Splash
- [1442-69647](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1442-69647) `Splash`. Logo only; no text.

#### A2. Home / landing
- [1442-69639](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1442-69639) `Home`. Tagline "Soluciones inteligentes para aumentar la rentabilidad de tu rancho" (smart solutions to raise your ranch's profitability). Exits to Sign up and Log in (button labels are inside instances).

#### A3. Sign up (create account)
- [1442-69669](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1442-69669) `SignUp_01_360*640`
- Purpose: create the owner account and the first ranch.
- Header: "Un paso mas cerca para la digitalizacion de tu ganado."

| Label (es) | Gloss (en) | Type | Required |
|---|---|---|---|
| Nombre (s) | First name(s) | text | yes (per error note) |
| Apellido (s) | Last name(s) | text | |
| Nombre de tu rancho | Ranch name | text | yes (per error note) |
| Dirección de tu rancho | Ranch address | text | |
| Telefono * | Phone | tel | yes |
| Correo * | Email | email | yes |
| Contraseña | Password | password, with show/hide eye | yes |
| Acepto los Terminos y condiciones | I accept the T&C | checkbox, link | |

- Actions: **Crear Cuenta** (create account); "¿Ya tienes cuenta? Da click aquí" (already have an account? click here) goes to Log in.
- Errors (note 2450:3): missing data (ranch name, user name, phone); invalid data (email or password, email format, "Correo previamente registrado" = email already registered).

#### A4. Log in
- [1442-69626](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1442-69626) `Log-In`. "Bienvenido de nuevo Nombre Usuario".
- Fields: Correo (email), Contraseña (password).
- Links: "¿Olvidaste tu contraseña?" (forgot password); "¿Aún no tienes cuenta? Da click aquí" (no account yet? click here).
- Errors (2450:4): invalid email or password; email format.

#### A5. Onboarding task hub ("Bienvenido -usuario- Selecciona con una tarea para comenzar", welcome, pick a task to start)
- A carousel of 4 task cards, each its own frame:
  - [1460-93656](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1460-93656) **Configurar alertas** (set up alerts): "Selecciona los canales que prefieras para recibir alertas." Shows channel icons SMS / email / Alerta Web / Notificación.
  - [1460-94005](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1460-94005) **Registrar mis vacas** (register my cows): "Registra los datos de cada una de tus vacas".
  - [1460-94105](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1460-94105) **Organizar mis potreros** (organize my stalls): "Creá los potreros digitales que tiene para sus vacas".
  - [1460-94205](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1460-94205) **Configurar mi rancho** (set up my ranch): "Completa los datos de tu perfil, rancho y programa de vacunaciones".
- Tooltip [1442-61522](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1442-61522) (the bell/reminder dropdown) lists the same 4 tasks as pending onboarding reminders.

#### A6. Alert channel selection
- [1555-0](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1555-0) `Onboarding_01_Alerts_01_selection`. Title: "¡Genial! Ahora, selecciona el canal para comunicarnos contigo".
- 4 checkbox cards (multi-select):
  - **email**: "Te enviaremos un correo electronico cuando alguna de tus vacas necesite de tu atencion, para registrar el evento."
  - **Alerta Web**: "Te aparecera una notificacion en tu navegador cuando suceda algo ¡altamente recomendada!"
  - **SMS**: "Un mensaje de texto se te hara llegar a tu celular cuando, como parte de tu membresía. Ver membresías". SMS is gated by membership.
  - **Notificación** (push): "Esto es una notificacion igual a las otras aplicaciones que tienes en tu celular. ¡Super practica!"
- Activated states: `Email|Activado`, `AlertaWeb|Activado`, `SMS|Activado`, `Notificacion|Activado` (1442:60692..60704).
- Navigation: back and next arrows, "Omitir Paso" (skip step).
- Error (2450:5): "Selecciona al menos un canal para las alertas" (pick at least one channel).

#### A7. Cow registry (Vaca)
- Frames, first pass: [1594-94002](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1594-94002) 01 collapsed, [1594-94143](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1594-94143) 02 General open, [1594-94320](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1594-94320) 03 Repro open, [1594-94550](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1594-94550) 04 both open, [1620-0](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1620-0) 05 photo.
- Second row (1621:856..617) repeats these; success is [1621-2323](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1621-2323).
- Header: "Registra tu hato en el sistema, comienza por tu primer vaca" (register your herd, start with your first cow).
- Animal-type toggle with 3 icons: `Boton Vaca` (cow) / `Boton Vaquilla` (heifer or calf) / `Boton Toro` (bull). The On/Off variants switch to A8 and A9.
- Photo: `ImageIcon` plus **Agregar Foto** (add photo; JPG/PNG).

**Datos Generales** (general data, accordion)

| Label | Gloss | Type | Req | Options / format |
|---|---|---|---|---|
| Raza * | Breed | dropdown | yes | Holstein (default), Jersey, Simmental, Pardo Suizo, Guernsev [sic], Ayrshire, Shorthorn, Normando Francés, Otra Raza..., Raza Mixta |
| Potrero | Stall/group | dropdown | | default "Potrero General" |
| ID control interno * | Internal ID | text | yes | placeholder 0000-0000-0000 |
| ID SINIIGA (opcional) | National ear-tag ID | text | no | MX-00-JAL(14)-0000-0000 |
| Fecha de nacimiento * | Birth date | date | yes | DD/MM/AAAA |

**Datos Reproductivos** (reproductive data, accordion)

| Label | Gloss | Type | Req | Options |
|---|---|---|---|---|
| Fecha último Parto * | Last calving date | date | yes | DD/MM/AAAA |
| Etapa Reproductiva | Reproductive stage | dropdown | | e.g. Gestante; enum in Domain notes |
| Estado de Lactancia | Lactation status | dropdown | | Lactando / Seca |
| # Lactancia | Lactation number | dropdown | | 1..n |

- Actions: **Registrar Vaca** (register cow), disabled until valid. Footer arrows and "Omitir Paso" (skip step).
- Success modal: "Felicidades!!! -Nombre usuario- acabas de agregar tu primer vaca a tu rancho virtual".
- Errors (2450:7, under the registry rows):
  - Breed defaults to Holstein if none is chosen.
  - Birth date is editable if the farmer does not have it, but "no pueden poner una fecha mayor a 24 meses o 720 días" (cannot exceed 24 months / 720 days).
  - Internal ID: unique, cannot be empty, "Podrá ser hexadecimal, incluyendo la 'ñ' y espacio".
  - Invalid birth date: "no podrá ser mayor a 30 meses ó 900 días", and the app sends a message recommending slaughter or sale for meat "pues no ha sido fértil" (because it has not been fertile).
  - Photo must be JPG or PNG.
  - SINIIGA rejects: a repeated number, more than 8 digits, fewer than 4 digits. "Si el usuario registra 4 dígitos, se dejará el siguiente formato MX-00-00-0000-1234".

#### A8. Calf / heifer registry (Vaquilla)
- Frames: [1617-0](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1617-0) 01, [1617-316](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1617-316) 02, [1617-245](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1617-245) 03, [1617-153](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1617-153) 04, [1621-112](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1621-112) 05 photo; success [1621-2268](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1621-2268).
- Header: "...comienza por tu primer vaquilla".
- Datos Generales: same 5 fields as the cow.
- **Datos adicionales opcionales** (optional extra data):

| Label | Gloss | Type | Placeholder |
|---|---|---|---|
| Vaca Madre | Dam | dropdown (from the cows list) | Selecciona |
| Toro Padre | Sire | dropdown (from the bulls list) | Selecciona |
| Tamaño al nacer | Birth size | number + unit dropdown | Centimetros |
| Peso al nacer | Birth weight | number + unit dropdown | Kilogramos |

- Action: **Registrar Vaquilla** (register heifer). Success: "...acabas de agregar tu primer vaquilla a tu rancho virtual".

#### A9. Bull registry (Toro)
- Frames: [1617-1029](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1617-1029) 01, [1617-953](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1617-953) 02, [1621-161](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1621-161) 03 photo; success [1621-2217](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1621-2217).
- Datos Generales: Raza *, **Nombre** (bull name; text), ID control interno *, ID SINIIGA (opcional), Fecha de nacimiento *. There is no Potrero field.
- Action: **Registrar Toro** (register bull). Success: "...acabas de agregar tu primer toro a tu rancho virtual".

#### A10. Cow list (onboarding) and filters
- [1635-93922](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1635-93922): "Esta es tu lista de vacas. Continua agregando tus vacas al sistema" (this is your cow list; keep adding cows).
- Layout: `Boton Vacas en Sistema` ("Vacas en Sistema | 001", cows in system), then counters cow / bull / calf ("000"), `Add cow_small` (+), search "ID Vaca" and `Filter_Icon`.
- Table headers: ☐ / ID Vaca ↕ / Estado ↕ / DIM ↕ / delete icon.
- Filter bottom sheet [1633-94804](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1633-94804): "Filtros disponibles", radio **Grupo / Raza / Reproducción / Salud / Bajas**, button **Aplicar filtro** (apply filter).
- Second step "Selecciona variable de filtro" (pick a filter value):
  - Grupo [1635-95844](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1635-95844)
  - Raza [1633-95748](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1633-95748)
  - Reproducción [1633-95058](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1633-95058)
  - Salud [1633-95953](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1633-95953)
  - Bajas [1633-96162](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1633-96162)
- Empty filter result (2450:8): "No se encontro ninguna vaca con los filtros seleccionados, pruebe con otros filtros".

#### A11. First stall wizard ("Separa tu ganado en potreros. Crea tu primer potrero.", split your cattle into stalls; create your first stall)
- Three accordion steps: **Datos Generales** → **Método selección vacas** (cow selection method) → **Selección de indicador** (indicator selection).
- Frames:
  - [1658-94285](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1658-94285) 01
  - [1658-94428](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1658-94428) 02 preconfigured type
  - [1663-597](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1663-597) 02 custom
  - [1663-0](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1663-0) automated by age
  - [1663-791](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1663-791) automated by breed
  - [1655-94704](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1655-94704) manual
  - [1669-96](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1669-96) and [1669-329](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1669-329) drag & drop selection
  - [1663-360](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1663-360) KPI step
  - [1669-613](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1669-613) and [1669-1230](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1669-1230) success
  - [1670-93953](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1670-93953) stall card ("Continua agregando potreros a tu rancho", keep adding stalls)

| Label | Gloss | Type | Rules / options |
|---|---|---|---|
| Tipo de potrero | Stall type | dropdown | General, Alta producción, Secas o en reto, Recien Paridas, Enfermas (`Drop_down_stalls_400w`); custom option shown in the 02_Custom frame |
| Nombre del potrero | Stall name | text | placeholder "Ejemplo: Potrero general"; counter 0/120; note says max 60 chars |
| Descripción | Description | textarea | 0/120; max 120; prefilled for General: "Este es el grupo general... ¡Aquí están todas las vacas en tu rancho!" |
| Método selección vacas | Selection method | toggle | automated (by filter) vs manual (drag & drop) |
| Filtro a aplicar a la selección | Filter to apply | dropdown | Edad (años) / Raza / # Lactancias (`Filter for cow section for stalls`) |
| Edad (años) or # Lactancias | Age or lactations | chips | 3 / 4 / 5 / 6 / más |
| Raza | Breed | dropdown | breed list (without Raza Mixta) |
| Selección de vacas | Cow selection | drag & drop list | "Vacas filtradas" with ID Vaca rows |
| Selección de indicador | KPI | single radio card | Vacas preñadas / Vacas en Celo / Vacas enfermas / Días en leche, each with an (i) tooltip |

- KPI tooltips:
  - Celo (heat): "Indicador para seguimiento de las fechas de celo para la inseminación de las vacas"
  - Preñadas (pregnant): "...fechas posibles de parto"
  - Enfermas (sick): "...dar seguimiento a los tratamientos necesarios"
  - DIM (days in milk): "Indicador de seguimiento de el periodo entre partos y productividad del hato"
- Action: **Agregar Potrero** (add stall), plus "Omitir Paso".
- Success: "Felicidades!!! -Nombre usuario- acabas de agregar tu primer potrero a tu rancho virtual".
- Errors (2450:9, 2450:10): group name cannot be empty; name ≤ 60 chars; description ≤ 120; if no preconfigured group is chosen, default is **General**; at least one filter variable must be selected.

#### A12. Account configuration hub
- [1691-104](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-104): "Aquí podrás editar la informacion de tu cuenta." (edit your account info here). Three tabs: **Mi cuenta** (my account) / **Datos Rancho** (ranch data) / **Vacunación y Desarrollo** (vaccination & development).

#### A13. My account (Mi cuenta)
- Frames:
  - [1691-824](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-824) view
  - [1691-994](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-994) editing (keyboard)
  - [1692-94092](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1692-94092) edited
  - [1691-1373](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-1373) camera
  - [1691-1416](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-1416) photo added
  - [1697-93556](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-93556) password change
  - [1698-93627](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1698-93627) password success
- Fields: photo; Nombre(s) (first names); Apellidos (last names); Teléfono (phone); Correo Electrónico (email); **Editar** (edit, pencil).
- **Cambiar contraseña** (change password): Contraseña Actual (current) / Nueva Contraseña (new) / Confirme su Nueva Contraseña (confirm). Hint: "Recomendación usa una contraseña segura que no uses en ningún otro sitio."
- Success: "Felicidades!!! -Nombre usuario- acabas de actualizar tu contraseña".
- Errors (2450:11, 2450:12):
  - Missing name, email or phone; invalid email; invalid phone.
  - Phone: no special characters except "+"; dialing codes come from an automatic list.
  - Images JPG/PNG only.
  - Password: save is blocked if new or confirm is empty; minimum 8 characters.
  - Forgotten password is handled by an emailed reset link.

#### A14. Ranch profile (Datos Rancho)
- Frames:
  - [1697-93765](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-93765) view
  - [1697-93895](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-93895) location (map picker, no text)
  - [1697-94007](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-94007) location updated
  - [1697-94110](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-94110) name edit
  - [1697-94213](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-94213) changed
- Fields: Nombre del rancho (ranch name; text); Dirección (address; map or location).

#### A15. Vaccination & development plan setup ("Vacunación y Desarrollo")
- Intro [1698-94138](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1698-94138): "Configura tu programa de desarrollo, vacunación y tratamientos para tu ganado... Consulta a tu médico veterinario, si no tienes los datos de las vacunas..." (set up your development, vaccination and treatment program; ask your vet if you lack vaccine data).
- **Desarrollo** (development) [1698-94257](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1698-94257):

| Label | Gloss | Type | Hint |
|---|---|---|---|
| Peso para primera inseminación | Weight at first insemination | number (kg, 3 digits) | "Rango recomendable entre 330-380Kg"; sample 360Kg |
| Tipo de calostro a proporcionar | Colostrum type | dropdown | sample "Calificado" (qualified). Tooltip: "Es un calostro limpio que ha sido analizado por anticuerpos y cantidad de sangre presente." (clean colostrum tested for antibodies and blood) |
| Edad de destete vaquillas | Heifer weaning age | number (days, 3 digits) | "Rango recomendable entre 60-90 días"; sample 70 días |
| Edad primera desparasitación | First deworming age | number | "entre los 90 y 180 días" (alternate copy: "entre los 3 y 6 meses"); sample 3 meses |
| Frecuencia de desparasitación | Deworming frequency | dropdown | sample "Cada año" (yearly) |

- **Vacunas a aplicar** (vaccines to apply):
  - Frames: [1697-94430](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-94430) empty, with **Agregar vacuna** (add vaccine).
  - Vaccine modal [1697-94576](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-94576), with typing state [1697-94908](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-94908) and edited state [1697-95070](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-95070).
  - After adding, [1697-94733](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-94733) shows the card with **Editar / Eliminar** (edit / delete).

| Label | Gloss | Type | Format |
|---|---|---|---|
| Nombre de la vacuna | Vaccine name | dropdown (`Drop_down_vaccines`) | IBR (Rinotraqueítis Infecciosa Bovina), DVR (Diarrea viral bovina), Clostridios, Derriengue (Rabia paralítica bovina), Otra... |
| Dosis | Dose | number | "002 ml por kg" (ml per kg) |
| Inicio aplicación | Start of application | toggle **Edad / Peso** (age / weight) + number | "06 meses" |
| Frecuencia | Frequency | dropdown | Refuerzo (booster); also seen: "Cada 6 meses", "Cada 12 meses", "Aplicación única" (single dose), "3 refuerzos uno cada 6 meses" |
| No. Refuerzos | Number of boosters | number | 00 |
| Tiempo entre refuerzos | Interval between boosters | number | 00 meses |

- Vaccine modal buttons: **Regresar** (back) / **Guardar** (save).
- Plan review carousel, 2 dots:
  - [1698-94540](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1698-94540) "Plan de vacunación y desarrollo" (Desarrollo page)
  - [1698-94892](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1698-94892) Vacunación page: "Edad para primera vacuna (Se recomienda iniciar a los 90 días)", with the vaccine list
  - [1711-160](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1711-160) vaccine expanded: "Aplicar a partir de: 3 meses de nacida" (apply from 3 months old), "Dosis 2 ml por kg", "Frecuencia Cada 6 meses"
- Action: **Aprobar** (approve). Success [1710-93815](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1710-93815): "Felicidades!!! -Nombre usuario- acabas de aprobar tu Plan de vacunación."
- Errors (2450:13-17):
  - Weight, weaning age and deworming age are limited to 3 digits; digits only; cannot be empty.
  - Dose, months, weight, boosters and interval cannot be empty; digits only.
  - "Al ser pantalla modal, el menú principal deberá quedar bloqueado" (while the modal is open, the main menu is locked).
  - Leaving the screen or switching ranch without registering any vaccine, finishing setup, or confirming the plan triggers a warning.

#### A16. Dashboard ("¿Cómo va él rancho?", how is the ranch doing?)
- [1725-93380](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1725-93380); screenshot checked.
- KPI cards:
  - **Celos a confirmar** (heats to confirm): "02 A revisar hoy" (to check today) / "00 Para seguimiento" (follow-up).
  - Tiles **DIM 002**, **Enfermas 002** (sick), **Preñadas 002** (pregnant).
  - **Vacunas y tratamientos** (vaccines & treatments): "03 Por vacunar" (to vaccinate) / "01 Por tratar" (to treat).
  - Bar **Vacas en Sistema 003** (cows in system).
  - Counters calf (`Calf Counter_deactivated`) / bull (`Bull Counter_deactivated`), "000" each, plus `Add cow_small`.
- User menu tooltip [1733-95052](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1733-95052): Configurar mi perfil / Configurar mi rancho / Administrar usuarios / Cambiar plan / Vacunación y desarrollo / Recordatorios / Ayuda / Legal / Cerrar sesión (profile, ranch, manage users, change plan, vaccination & development, reminders, help, legal, log out).
- Help and legal lists [1733-95096](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1733-95096):
  - Ayuda: Calcula tu eficiencia (efficiency calculator), Preguntas frecuentes (FAQ), Correo de soporte (support email), Teléfono (phone), Chat.
  - Legal: Aviso de privacidad (privacy notice), Términos y condiciones (terms).

#### A17. Dashboard KPI drill-downs (all named `Onboarding_Dashboard_Sick_cows`)
- Each KPI card expands to a table, plus a filter sheet with "Mostrar solo: Vacas | Vaquillas" (show only cows | heifers) and **Aplicar filtro**.
- **Enfermas**:
  - Frames [1725-94465](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1725-94465), [1733-94290](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1733-94290), [1733-94662](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1733-94662), [1733-94894](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1733-94894).
  - Columns: ID Vaca | Enfermedad (illness), e.g. 00001 Mastitis, 00007 Pulmonia. Extra filter: "Filtro por enfermedad" (filter by illness).
- **Preñadas** (pregnant):
  - Frames [1738-0](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1738-0), [1738-179](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1738-179).
  - Columns: ID Vaca | Fecha estimada (estimated calving), e.g. 05/Febrero/2020. Filter: "Siguentes partos entre" (next calvings between; date range).
- **Celos a confirmar** (heats to confirm):
  - Frames [1761-786](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1761-786), [1762-95610](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1762-95610), [1761-980](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1761-980) (empty, 000), [1761-1219](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1761-1219).
  - Columns: ID Vaca | Grupo, e.g. "Alta producción", "Recien paridas". Filter: "Día de seguimiento:" (follow-up day). Toggle: A revisar hoy / Para seguimiento.
- **Vacunas y tratamientos**:
  - Frames [1761-1541](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1761-1541), [1761-2357](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1761-2357), [1761-1798](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1761-1798), [1761-2175](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1761-2175).
  - Toggle Por vacunar / Por tratar. Columns: ID Vaca | Grupo (Recien paridas, En desarrollo, Recien nacidas).
  - Filter: "Rango de fechas" (date range) + "Vacunas:" (Nombre de vacuna). The Por tratar filter has only the date range.
- Approved plan view from the dashboard: [1733-93923](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1733-93923) development, [1733-93979](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1733-93979) vaccines, [1733-94039](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1733-94039) vaccine open. Copies exist at 2018:491117 / 491193 / 491253.

### B. Cow tab: profile, log, delete (page 1442:69863)

#### B1. Animal lists (cows / heifers / bulls)
- **Cows**: [1781-99287](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1781-99287) "Administra tus vacas" (manage your cows); `Cow Counter_activated`, "0003 Vacas".
- **Heifers**: [1781-99585](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1781-99585) "Administra tus vaquillas". Row sample: 00001 | Alta producción | Lactando | Normando Francés | 15.
- **Bulls**: [1803-96981](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1803-96981) "Administra tus toros".
- Search: "ID". Filter sheet: cows and heifers use Grupo / Raza / Reproducción / Salud / Bajas; **bulls use Raza / Edad / Bajas**.
- Bull age options (`Bull_Age` 1810:98760): Menos de un año (under 1 year), 2 años ... 8 años, 9+ años.
- Default first filter value (notes 2451:173797-801):
  - Grupo = "General"
  - Raza = "Holstein"
  - Reproducción = "Vacía" (open/empty)
  - Salud = "Saludables" (healthy)
  - Bajas = "Venta a otro rancho" (sale to another ranch)
- **Aplicar filtro** stays disabled until a filter is chosen (2451:173796).
- Empty result message: same "No se encontro ninguna vaca..." copy as A10.

#### B2. Cow profile, Perfil tab
- [1841-98715](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1841-98715); screenshot checked.
- Tabs: **Perfil / Actividad / Bitácora** (profile / activity / log).
- Photo with pencil edit (`Button_edit_icon`). ID tile "00001".
- Banner: "Próximo evento según edad: Tratamiento antiabortivo" (next event by age: anti-abortive treatment). The banner text varies (see Domain notes).
- Accordions **Datos Generales** [1841-99607](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1841-99607) and **Datos Reproductivos** [1841-99973](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1841-99973) hold the same fields as A7, editable.
- Event tiles with toggles: **Celo** (heat) / **Preñada** (pregnant) / **Parto** (calving), each a `Switch`; **Salud** (health; green "+").
- Link **Baja de ganado** (remove animal; trash icon).

#### B3. Cow delete ("Baja de ganado")
- Reason sheet [1866-100732](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-100732) / [1866-101092](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-101092) / 1866:101343 / 1864:100897 / 1866:101995.
  - Copy: "La vaca 00001 se dará de baja" (cow 00001 will be removed). "Cuentanos por que la das de baja" (tell us why).
  - Radio: **Venta a otro rancho / Venta a rastro / Muertas (A desecho) / Error al registrar** (sale to another ranch / sale to slaughterhouse / dead (culled) / registration error).
  - Button: **Dar de baja** (remove).
- Confirm per reason:
  - [1857-2548](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-2548) "...se dará de baja por venta a otro rancho". "Ahhh!!! vamos a extrañar a esta vaca, esperemos que la cuiden tan bien como tú."
  - [1857-2786](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-2786) "...por venta a rastro". "...esperemos se convierta en suculentos cortes."
  - [1857-3018](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-3018) "...por Muerte (registro de desecho)". "Lamentamos tu pérdida..."
  - [1857-2311](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-2311) Error: "La vaca 00001 se eliminará por completo del sistema, sin posibilidad de recuperarla" (hard delete, cannot be recovered). "¿Cuál vaca? Aquí nunca hubo una vaca!!!"
- Success with finance upsell:
  - [1857-3250](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-3250), [1857-3493](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-3493), [1857-3565](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-3565).
  - Copy: "La vaca 00001 se dió de baja exitosamente por {reason}" (removed successfully). "Conoce el impacto financiero de este evento. Módulo de finanzas proximamente disponible" (see the financial impact; finance module coming soon).
  - Buttons: **Registrarme en la lista de espera** (join the waitlist) / **Por ahora no, gracias** (not now, thanks).

#### B4. Bitácora (event log) list, filter, date range
- Frames:
  - [1841-99061](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1841-99061) list, with sub-tab **Vacunación y desarrollo**
  - [1891-99605](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1891-99605), [1891-99848](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1891-99848) scroll states
  - [1891-100106](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1891-100106) filtered
  - [1891-101691](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1891-101691), [1891-100882](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1891-100882) filter sheet "Tipo de evento(s) a filtrar:" (event types to filter; multi-select check chips `Boton Text Check_On/Off`)
  - [1891-101217](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1891-101217) new cow, single row: "Alta en sistema 14/02/2017 Registro inicial de vaca en sistema" (added to system; initial cow registration)
  - Date pickers: [2137-167297](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2137-167297) month range (Jun2013–Abr2018), [2137-167503](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2137-167503) day range (13 Mar–28 Mar)
- Columns: **Tipo | Fecha | Evento** (type | date | event).
- Sample rows:
  - Vacunas 07/09/2019 "Enfermedades respiratorias" (respiratory diseases)
  - Reproducción 15/01/2020 "Celo confirmado: Inseminación" (heat confirmed: insemination)
  - Reproducción 26/12/2019 "Celo confirmado: Periodo espera" (heat confirmed: waiting period)
  - Reproducción 04/12/2019 "Nacimiento" (birth)
  - 12/08/2019 "Sana" (healthy)
  - Nutrición 13/08/2019 "Calostro primera calidad" (first-quality colostrum)
- Rules (2451:173794/5):
  - "Nunca se podran seleccionar fechas futuras" (future dates can never be selected).
  - Single date or range.
  - Empty: "No se encontro ningun evento con los filtros seleccionados, pruebe con otros filtros".

#### B5. Event detail, edit, delete, add custom event
- Detail [1841-100244](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1841-100244):

| Label | Gloss | Sample |
|---|---|---|
| Tipo de evento | Event type | Enfermedades respiratorias |
| Fecha | Date | DD/MM/AAAA |
| Tipo de registro | Record type | Vacuna |
| Realizó registro | Recorded by | Roberto Casablancas |
| Comentarios | Comments | "La vaca se pusó rebelde" |
| Recordatorios | Reminders | "Separar la vaca de producción por 5 días" (separate the cow from production for 5 days) |

- Buttons on the detail: **Editar / Eliminar** (edit / delete).
- Edit [1847-2](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1847-2): comments become editable (0/160). Buttons Eliminar / Guardar (delete / save).
- Delete confirm [1857-964](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-964): "Eliminar evento en bitacora". "¿Seguro que quieres eliminar este evento de la bitacora? Una vez eliminado el evento, no quedara ningun registro en el sistema." Button **Si, eliminar**.
- No permission [1857-1100](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-1100): "No tienes permisos para eliminar eventos en la bitácora. Solicita permiso a un administrador..." Button **Solicitar permiso** (request permission). Then [1857-1236](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-1236): "Un administrador sera notificado. Si el administrador acepta el permiso se eliminara el evento..." (an admin will be notified; the event is deleted if they accept).
- Add custom event [1968-103393](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1968-103393):
  - Fields: Nombre del evento (event name; 0/160); Fecha (date); Realizó registro (recorded by; auto); Comentarios (comments).
  - Button: **Guardar** (save).

#### B6. Per-cow vaccination & development (Bitácora > Vacunación y desarrollo)
- Frames: [1906-100699](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1906-100699), [1947-102249](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1947-102249) (history card "Plan de Vacunación y Desarrollo 2007-2019"), [1906-100536](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1906-100536), 1947:101368 / 101580 / 101855 / 102051 / 102570 (one vaccine expanded each), [1906-100461](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1906-100461) weight history.
- **Desarrollo**:
  - Edad primera vacuna aplicada (age at first vaccine; "junio 2020")
  - Último peso registrado (last recorded weight; 480 Kg)
  - Próxima desparasitación (next deworming; dd/mm/aaaa)
  - "Información de desarrollo adicional" (extra development info): Peso a primera inseminación 360 Kg, Peso al nacer 45 Kg, Frecuencia 6 Meses, Edad primera desparasitación 90 días
- **Historial de peso (Kg)** (weight history): user + value + mm/aaaa rows (480, 350, 301, 292, 275, 260).
- Vaccine list: IBR / DVR / Derriengue (Rabia paralítica bovina) / Clostridios. Each expands to Frecuencia / Dosis / "Aplicar a partir de".
- 1947:102570 opens an applied-vaccine event detail, same as B5.

#### B7. Activity monitor (smart-device teaser)
- [1841-99396](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1841-99396): "Monitor de Actividad". "Periodo de consulta: 30/sep - 10/oct/2019" (query period).
  - Metrics: Nivel de Actividad 90% (activity level), Minutos de Rumia 420 (rumination minutes), 03 Tratamientos Médicos (medical treatments), 03 Cambios de dieta (diet changes).
  - Charts are mock-ups. Overlay: "Arete inteligentes disponibles próximamente." (smart ear tags coming soon) with **Registrarme en la lista de espera** (join the waitlist).
- Data confirmation [1857-324](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-324): "¡Confirma tus datos!" Fields Nombre / Correo / Teléfono (prefilled). Copy: "Seras de los primeros en enterarte..." (you'll be among the first to know).
- Success:
  - [1857-638](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1857-638) "Te notificaremos cuando los aretes inteligentes esten disponibles." (we'll notify you when smart ear tags are available)
  - [1866-100205](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-100205) "Estás en la lista!!!" (you're on the list)
  - Finance-module variant: [1866-102358](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-102358)

#### B8. Registry copies (non-onboarding)
- 1866:102847 – 1866:104567 are the same frames as A7–A9, in two rows, without the onboarding header. Race dropdown 1866:104670.

### C. Stalls / groups (page 1442:69864)

#### C1. Stall list (cows)
- [1968-104045](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1968-104045) (screenshot checked) and [1946-843](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-843).
- Title: "¿Dónde están tus vacas?" (where are your cows?).
- Bar: **Potreros Vacas | 002** (cow stalls). Button: **Agregar Potrero** (add stall).
- `Group Chip` card per stall: name ("Potrero General", "Alta producción"), description, **Vacas en Potrero | 003** (cows in stall), the chosen KPI icon + count (e.g. "Vacas en Celo 000", "Vacas enfermas 000"), **Editar / Eliminar**.
- Switcher `Stall_filter` [1976-103194](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1976-103194): **Potreros vacas / Potreros vaquillas** (cow stalls / heifer stalls).
- GRUPOS tab is active.

#### C2. Heifer stall list
- [1976-103201](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1976-103201): "¿Dónde están tus vaquillas?" (where are your heifers?). System groups:
  - **Recien Nacidas**: "Grupo especial para vaquillas recien nacidas y hasta 6 meses, ¡Cuidalas mucho!" (newborns up to 6 months)
  - **En desarrollo**: "Vaquillas a partir de 6 meses, hasta haber tenido su primer servicio." (from 6 months until first service)
  - **Servidas**: "Vaquillas que ya han tenido su primera monta o servicio registrado en sistema." (already served or mounted)
  - **Preñadas**: "Vaquillas preñadas con éxito" (pregnant)
  - **Enfermas**: "Todas las vaquillas enfermas" (all sick heifers)
- Cards show "Ver más" (see more) / Eliminar; only Enfermas shows Editar.

#### C3. New stall wizard (post-onboarding)
- Frames:
  - [1946-1757](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1757) 01
  - [1946-1690](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1690) 02
  - [1946-1623](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1623) 03 custom
  - [1946-1549](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1549) 04 filter
  - 1946:1409 manual, 1946:1484 breed
  - [1946-1201](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1201) / [1946-1128](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1128) "Arrea las vacas a su nuevo potrero" (herd the cows into their new stall; drag & drop)
  - [1946-1289](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1289) KPIs
  - [1946-1006](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1006) and [1946-886](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-886) success
- Same fields as A11. Header: "Crea un nuevo potrero para las vacas de tu rancho" (create a new stall for your ranch's cows).
- Success: "...acabas de agregar un nuevo potrero en tu rancho virtual".
- Extra rules (2451:173808): "No se puede pasar a seleccionar un Indicador, si no se han agregado vacas al grupo" (cannot pick an indicator before adding cows). "Se deberá dar la opción al usuario de no seleccionar ningún indicador" (the KPI is optional).

#### C4. Stall delete
- [1975-306](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1975-306): "El potrero -nombre- se eliminara". "Elige su nuevo potrero, tus vacas no se pueden quedar sin hogar:" (choose their new stall; cows can't be left homeless). Dropdown `Drop_down_stalls_172w_stall_removal`, default "General" (2451:173810). Copy: "Tus vacas extrañaran su viejo hogar".
- Success [1975-515](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1975-515): "Potrero eliminado. El potrero 'nombre' se ha eliminado, ahora tus vacas estan en el potrero 'nombre'" (stall deleted; your cows are now in stall "name").

#### C5. Stall edit / detail
- [1975-713](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1975-713): name + Descripción editable; cow table (ID ...); "0003 Vacas".
- Filter sheets 1975:1119 (list Grupo/Raza/Reproducción/Salud/Bajas) → 1975:1385 / 1657 / 1943 / 2236 / 2505 (one per variable).

#### C6. Add cows / Move cows
- Add:
  - Frames: [2005-2848](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-2848), with filter steps [2005-3031](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-3031) and [2005-3253](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-3253).
  - Copy: "Selecciona o arrastra las vacas a agregar al potrero" (select or drag cows to add).
  - Confirm [2005-3670](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-3670): "Movimiento de vacas. Se agregarán No. vacas al potrero nombre" (N cows will be added to stall X).
- Move:
  - Frame [2005-3490](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-3490): "Lista de vacas a cambiar potrero" (cows to move), "Selecciona potrero destino" (pick destination).
  - Confirm [2005-3749](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-3749): "Se moverán No. vacas al potrero nombre" (N cows will be moved to stall X).
- Empty filter: same "No se encontro ninguna vaca..." copy (2451:173811).

#### C7. Misc on page
- Calf registry copy 2005:2167; Dashboard copy 1966:731.

### D. Events hub (page 1866:106692): DESKTOP 1366x768 layout

The frames on this page are web layouts: top nav Inicio / Vacas / Grupos / Alertas / Historial / Reportes, bell, user, logout. Each event flow is a modal over the **Cow Profile | Vaca** desktop view.

The profile view contains:
- Banner, e.g. "Parto estimado entre los días 01 al 04 de septiembre del 2020" (estimated calving between 1 and 4 Sept 2020)
- Potrero dropdown
- Photo
- "Alertas o eventos" (alerts or events): Celo / Preñada / Parto toggles, Salud +
- Datos Generales: Raza, Etapa Reproductiva, Fecha de nacimiento, Estado de Lactancia, Fecha último Parto, DIM, # Lactancia
- Link Genealogía (genealogy)
- **Monitor de Actividad**: Semana / Mes / Año / Histórico (week / month / year / all time)
- **Bitácora de Eventos** table: Tipo / Fecha / Evento / Acciones (pencil, trash), with "Ampliar bitácora" / "Reducir bitácora" (expand / shrink log)
- **Baja de ganado** button

A planning note (1866:106693) scopes the page: lists (bulls, heifers, cows) and flows (reproduction, illness). The mobile equivalents are only [2021-153878](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2021-153878) / [2021-153966](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2021-153966) / [2021-154068](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2021-154068) (`Cow_Profile_ID01_01..03`, same as B2, with banner "Parto estimado entre los días 01 al 04 de sep. del 2020").

#### D1. Lists
- [1866-106737](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-106737) "Listado Toros" (bulls list), search "Buscar toro por ID".
- [1866-106694](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-106694) "Listado Vaquillas" (heifers list), search "Buscar vaquilla por ID". Heifer filter (1866:124081): Recien nacidas / En desarrollo / Servidas / Preñadas / Enfermas.
- [1866-124184](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-124184) cows, "Buscar vaca por ID". Group filter (1866:124114): General / Alta producción / Secas o reto / Recién paridas / Enfermas.

#### D2. Health event entry
- [1866-107004](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-107004) (screenshot checked): "Registro de evento de salud" (health event record), "¿Qué sucedió con la vaca 00001?" (what happened to cow 00001?).
- Radio: **Accidente / Cambio de dieta / Enfermedad / Tratamiento médico** (accident / diet change / illness / medical treatment).
- Buttons: Regresar / Continuar (back / continue). The stepper bar is at the top.

#### D3. Illness ("Registro de enfermedad y diagnóstico", illness and diagnosis record)
- [1866-108411](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-108411) / 1866:122798; screenshot checked.

| Label | Gloss | Type | Options |
|---|---|---|---|
| Enfermedad | Illness | dropdown | Mastitis, Brucelosis, Pulmonía, Cetosis, Tuberculosis, Cojera, Fiebre aftosa, Envenenamiento, Otro (each has a description, see Domain notes) |
| Descripción | Description | text | "Breve descripción"; auto-filled from the illness |
| Tipo de tratamiento | Treatment type | dropdown | Antibiótico, Antiséptico, Antibacteriano, Antimicotico, Quirúrgico, Anti-inflamatorios, Corticoide, Antimicrobiano, Antiparasitario |
| Fecha diagnostico | Diagnosis date | date | default "- fecha de hoy -" (today) |
| Presentación medicamento | Drug form | dropdown | En piel ó tópico / Oral o tableta / Inyección (topical / oral or tablet / injection) |
| Duración del tratamiento | Treatment duration | dropdown | "Selecciona días" (days) |
| Tiempo fuera de producción | Time out of production | dropdown | "Selecciona días" |

- Action: **Registrar Enfermedad** (register illness; disabled until valid).
- Result state on the profile:
  - [1866-107248](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-107248), [1866-107496](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-107496), [1866-107725](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-107725)
  - Banner: "Esta vaca se declaró enferma. Evita ordeñar para producción." (this cow was declared sick; avoid milking for production)
  - Stall auto-changes to **Enfermas**. Log row "Salud | Mastitis diagnosticada" (mastitis diagnosed). Section "Cambios por enfermedad y diagnóstico: Dieta" (changes due to illness: diet).
- Follow-up "Seguimiento de tratamiento" (treatment follow-up):
  - Frames [1866-123053](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-123053), 1866:123288.
  - "Cambio de tratamiento" (change treatment) [1866-123525](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-123525) repeats the treatment fields.
  - Outcomes: [1866-107955](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-107955) log "Mastitis: Cambio de tratamiento"; [1866-108184](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-108184) "Mastitis: Tratamiento exitoso" (treatment successful).

#### D4. Accident ("Registro de accidente", accident record)
- [1866-113656](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-113656) → [1866-113897](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-113897)
  - Fields: Descripción accidente (accident description), Fecha inicio de tratamiento (treatment start date), Tipo de tratamiento (treatment type), Presentación medicamento (drug form), Duración del tratamiento (duration), Tiempo fuera de producción (time out of production).
  - "Cambios por accidente: Dieta" (changes due to accident: diet).
- → [1866-112963](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-112963): log "Accidente: -Razón Accidente-" (accident: reason).
- Follow-up "Seguimiento por accidente": [1866-114295](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-114295), 1866:114548.
- Outcomes: [1866-113424](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-113424) "Accidente: -Cambio tratamiento-" (treatment changed); [1866-113195](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-113195) "Accidente: -Tratamiento exitoso-" (treatment successful).

#### D5. Diet change ("Registro de cambio de dieta", diet change record)
- [1866-115508](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-115508): Razón cambio de dieta (reason: Etapa reproductiva / Enfermedad / Tratamiento médico / Otra = reproductive stage / illness / medical treatment / other), Descripción nueva dieta (new diet description), Fecha inicio dieta (diet start date).
- Result: [1866-112491](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-112491), log "Cambio de dieta".

#### D6. Medical treatment ("Registro de tratamiento médico", medical treatment record)
- [1866-115751](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-115751): Tipo de tratamiento (Sincronización hormonal para celo / Reducción de producción de leche / Vacunas / Otros = hormonal heat synchronization / milk-production reduction / vaccines / other), Descripción tratamiento (treatment description), Fecha inicio tratamiento (start date).
- "Cambios por enfermedad:" (changes due to illness).

#### D7. Stall change ("Cambio de Potrero")
- [1866-116385](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-116385): "Estas cambiando la vaca 00003 al potrero -nombre de potrero-. ¿Quieres registrar este cambio?" (you are moving cow 00003 to stall X; record this change?)
- → [1866-116000](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-116000) / 1866:116226: log "Cambio potrero | Cambio potrero de Recien paridas a -nombre del potrero-" (stall changed from Recien paridas to X).
- The Potrero dropdown on the profile triggers this flow.

#### D8. Heat confirmation ("Registro de Celo", heat record)
Entry: profile banner "Próximo celo entre los días 01 al 04..." (next heat between the 1st and 4th) and the Celo toggle.
1. [1866-117975](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-117975): "La vaca 00004 está dentro de los días estimados para celo. ¿Quieres confirmar celo?" (cow 00004 is within her estimated heat days; confirm heat?)
2. [1866-120399](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-120399): "Estás registrando que la vaca 00004 entró en celo. ¿Fue este un celo limpio?" (was this a clean heat?)
3. Clean → [1866-120635](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-120635): "¿La inseminaste?" (did you inseminate her?)
   - Yes → [1866-121587](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-121587) (screenshot checked): Diagnóstico "Se inseminó a la vaca correctamente" (cow inseminated correctly), Fecha diagnóstico, prefilled Descripción, **Toro utilizado para la inseminación o monta** (bull used for insemination or natural service; dropdown "Seleccionar Toro utilizado" + **Agregar Toro**). Button **Registrar diagnóstico** (register diagnosis).
   - No → [1866-120871](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-120871): "¿Se encuentra en periodo de espera voluntario?" (is she in the voluntary waiting period?)
     - Yes → [1866-121835](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-121835) "No se inseminó por tiempo de espera" (not inseminated: waiting period)
     - No → [1866-122079](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-122079) alert: "...Recuerda que cada celo es una oportunidad para inseminar tus vacas, y no hacerlo representa perdidas importantes." (every missed heat costs money)
4. Not clean → [1866-121107](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-121107): "¿Se le dió tratamiento?" (was she treated?)
   - Yes → [1866-121343](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-121343) "Celo sucio con medicación" (dirty heat, medicated)
   - No → [1866-122313](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-122313) "Celo sucio sin medicación" (dirty heat, not medicated)
5. Did not come into heat → [1866-122556](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-122556) "No entró en celo": "Se observó que la vaca no entró en celo en el periodo esperado" (no heat observed in the expected period).
6. Profile after: 1866:116619 / 116845 (stage stays Vacia until the pregnancy check; the stall shows General or Recien Paridas).

#### D9. Pregnancy confirmation ("Registro de Preñez", pregnancy record)
Entry: banner "Confirma preñez entre los días 12 al 14 de octubre del 2020." (confirm pregnancy between 12 and 14 Oct 2020); stage **Servida** (served).
1. [1866-118211](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-118211): "La vaca 00006 está dentro de los días estimados para diagnóstico de gestación. ¿Quieres confirmar su preñez?" (within estimated days for the pregnancy check; confirm?)
2. Yes / No → [1866-118451](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-118451) / [1866-118691](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-118691): "¿Qué método usaste para el diagnóstico?" (which diagnosis method?) **tacto / ultrasonido** (palpation / ultrasound).
3. Results:
   - [1866-118931](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-118931) "Se diagnosticó por tacto que la concepción fue exitosa" → "Concepción exitosa" (conception successful), with "Cambios por preñez: Dieta" (changes due to pregnancy: diet)
   - [1866-119647](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-119647) ultrasound, successful
   - [1866-119903](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-119903) palpation, "Concepción no exitosa" (conception not successful)
   - [1866-120151](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-120151) ultrasound, not successful
4. Profile after:
   - Positive → [1866-119187](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-119187): stage **Gestante** (pregnant), banner "Parto estimado entre los días 12 al 14 de abril del 2021".
   - Negative → [1866-119417](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-119417): "Próximo celo entre..." (next heat between...)

#### D10. Calving ("Registro de Parto", calving record). Three timing variants share one flow.
- **Delayed / retrasado** (cow 00002, row y=7448): 1866:127711 → 127950 → 128981 "La vaca entró en labor de parto posterior a la fecha esperada" (labor after the expected date) → "Parto exitoso retrasado" (successful delayed calving).
- **Expected / esperado** (cow 00005, row y=19228): [1866-124901](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-124901) → 125140 → [1866-126175](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-126175) "...dentro de la fecha esperada" (within the expected date) → "Parto exitoso esperado".
- **Anticipated / anticipado** (cow 00007, row y=26043): 1866:110035 → 110274 → 111309 "...antes de la fecha esperada" (before the expected date) → "Parto exitoso anticipado".

Steps:
1. "Estás confirmando el parto de la vaca 0000X. ¿Quieres registrar el parto?" (confirm calving?) If the user says no, they get the alert [1866-126431](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-126431): "Recuerda que mantener registros precisos hará que tu rancho sea más rentable" (accurate records make your ranch more profitable; "Entendido" only).
2. "¿El parto fue exitoso?" (was the calving successful?)
   - Yes → diagnosis modal (Descripción, Fecha diagnóstico, "Cambios por parto: Dieta") → heifer registry modal.
   - No (abortion) → "Estás confirmando el parto de la vaca 0000X fue un aborto. ¿Como sucedió el aborto?" (how did the abortion happen?), Natural / Inducido, plus "Causa del aborto" (cause):
     - Natural causes (`Abortion causes`): Hormonal / Reabsorción embrionaria / Nutrición / Desconocido (hormonal / embryo reabsorption / nutrition / unknown).
     - Induced causes (`Abortion causes non natural`): Intoxicación Nutricional / Virus / Bacteria / Tratamiento por enfermedad (nutritional poisoning / virus / bacteria / treatment for illness), plus induced-by-accident (1866:110757 "Se diagnosticó un aborto inducido por accidente") and induced-by-illness with "Enfermedad causa de aborto" (1866:111005).
3. Heifer registry ("Registra tu vaquilla recien nacida", register the newborn heifer):
   - [1866-123777](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-123777) / 123835 / 123894 / [1866-123972](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-123972); copies at rows 7448 and 19228.
   - Fields: Raza (prefilled Holstein), Potrero General, ID control interno, Fecha de nacimiento, optional Vaca Madre / Toro Padre / Tamaño (cm) / Peso al nacer (birth size / weight).
   - Photo upload (desktop): "Arrastra tu archivo aquí ó usa el explorador" (drag file here or browse), "Tamaño máximo de archivo 2MB" (max 2MB), "Procura que la foto capture sus manchas distintivas" (capture her distinctive markings). Progress state "25% completado".
4. Profile after (1866:109356 / 109808 / 109582, 124222 / 124674 / 124448, 127032 / 127484 / 127258):
   - Stage → **Recien Paridas** (just calved), DIM restarts (4), Fecha último Parto = calving date, banner "Próximo celo entre los días 03 al 07 de Noviembre del 2019".
   - Log row is one of: "Parto exitoso {esperado | anticipado | retrasado}", "..., sin registro de vaquilla parida" (heifer not registered), or "Aborto".

### E. Configurations tab (page 1442:69869)

#### E1. User menu and ranch switcher
- User menu [2524-147025](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-147025): same list as A16.
- Ranch switcher [2548-147729](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2548-147729): "El Bigotes" (sample ranch) / **Agregar Rancho +** (add ranch). One user, many ranches.

#### E2. My account (configuration version)
- [2524-149062](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-149062) plus edit, camera and password variants (2524:148953..148670).
- Same fields as A13, plus:
  - Role badge "Dueño" (owner)
  - **Alertas Activas** (active alert channels)
  - **Plan Activo: "Llevas 45 vacas de 50"** (active plan: you have 45 of 50 cows)

#### E3. Plan & billing
- Frames:
  - [2559-148532](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2559-148532)
  - [2573-148005](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2573-148005) cancel dialog
  - [2573-148461](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2573-148461) cancelled
  - [2573-149044](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2573-149044) download
- Content:
  - Plan Activo: **Cría** (plan tier), "Hasta 50 vacas" (up to 50 cows)
  - Facturación: Mensual (monthly billing)
  - Ultima fecha de pago (last payment date)
  - Fecha de renovación (renewal date), which becomes **Fin de membresía** (membership end) after cancellation
  - Agregar Usuario $49 Mx/mes (add user, $49 MXN per month)
  - Buttons: Ver mis módulos adicionales (my add-on modules), Ver Mis Facturas (my invoices), Métodos de pago (payment methods), **Cancelar membresía** (cancel membership)
- Cancel dialog: "¿Seguro quieres cancelar tu membresía? Te vamos a extrañar!!!" (sure you want to cancel? we'll miss you). Dropdown "Razón de cancelación" (cancellation reason; options in 1457:135917: Precio / Servicio y/o Soporte / No es lo que esperaba / No me dió resultados / Otro = price / service and/or support / not what I expected / no results / other).
- Rule: "Al cancelar tu membresía, tendrás hasta el dd/mm/aaaa para realizar la descarga de los datos de tus vacas." (after cancelling, you have until a date to download your cows' data)
- Download dialog: "¿En que formato deseas descargar tu información?" (which format? options not readable).

#### E4. Upgrade plan ("Mejora tu plan y los servicios que te proporcionamos", upgrade your plan and services)
- Frames: [2585-92](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2585-92), 2593:0, 2593:228; success [2617-149389](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2617-149389).
- Toggle **Mensual / Anual** (monthly / yearly). "Precios Membresías + I.V.A." (membership prices plus VAT).
- Plans:
  - **Cría** $15 USD/mes, "Hasta 50 vacas"
  - **Destete** $45 USD/mes, "Hasta 150 vacas" ("Recomendado")
  - **En producción** $79 USD/mes, "150 o más vacas"
- Each plan has a **Contratar** (subscribe) button. "Usuario adicional $49 Mx/mes" (extra user, $49 MXN per month).
- Success: "Muchas gracias por tu preferencia!!! Tu rancho se actualizará para contar con las funciones del - plan o módulo - que acabas de contratar" (thanks; your ranch will be updated with the plan or module you bought).

#### E5. Payment methods ("Métodos de pago")
- [2559-148793](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2559-148793):
  - "Pago electrónico" (PayPal), "se acredita en menos de 1 hora" (credited in under 1 hour)
  - "Efectivo" (cash; OXXO-style card 5579•2091•2124•3387), "se acredita instantáneamente" (credited instantly)
  - "Depósito y transferencia bancaria" (bank deposit or transfer; CLABE 044320010013932228), "menos de 1 hora"
- Support: "Para asistencia comunicate a los teléfonos: +52 1 347•101•5721 / +52 1 333•842•9371" (for help, call these numbers).

#### E6. Ranch profile
- [2524-148618](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-148618) "Edita la informacion de tu rancho" (edit your ranch's info). Location, name and changed variants: 2524:148579 / 148527 / 148410 / 148358, 2548:147916 / 147966 / 148134.

#### E7. Vaccination & development (configuration version)
- Frames: [2524-147738](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-147738), [2524-147678](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-147678); edit 01–06 (2524:148262, 148202, 148115, 147877, 148028, 147798); approve 01–03 (2530:147293, 2524:147602, 2524:147495).
- Delete vaccine [2530-147430](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2530-147430): "La vacuna -nombre- se eliminara. ¿Por que la eliminas? Recuerda que puedes editarla en vez de eliminarla." (why delete it? you can edit instead)
- Deleted [2530-147578](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2530-147578): "La vacuna -nombre- se eliminó. No dejes sin protección a tus vacas..." (don't leave your cows unprotected)
- Update dialog [2548-147567](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2548-147567): "Plan de Vacunación y Desarrollo - Actualización", "¿Continuar la edición?" (continue editing?)

#### E8. User administration
- Users list [2573-152259](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2573-152259): "Listado de Usuarios en Sistema" (users in the system). Columns Nombre | Tipo | Acciones (name | type | actions). Rows: Roberto–Administrador, Juan–Médico, Sebastian–Nutriólogo, Ignacio–Técnico.
- Delete [2579-28](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2579-28): "¿Dar de baja -nombre usuario-? Recuerda que eliminar usuarios evitará que estos puedan trabajar en tu rancho virtual, pero su historial se mantendrá en registro." (removing a user stops them working on your ranch, but their history is kept)
- New user [2573-149252](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2573-149252) (role variants 2574:149247 / 149425 / 149603 / 149781 / 149959): "Registra los datos generales de tu nuevo usuario" (enter the new user's details).
  - Tabs: **Datos Generales / Personalizar permisos** (general data / custom permissions).
  - Fields: Nombre(s), Apellidos, Teléfono, Correo Electrónico, **Tipo de usuario** (dropdown: Dueño / Administrador / Médico / Técnico de campo / Nutriólogo), Contraseña + Confirmar Contraseña ("Usa una contraseña segura"), **Canales Alertas** (alert channels).
  - **Plan Activo "Llevas 1 usuario de 3"** (1 of 3 users used) + **Mejora tu plan** (upgrade).
- Custom permissions [2573-149621](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2573-149621) … 2573:150903, "Configura los permisos para tu nuevo usuario". One screen per category, toggles:
  - **Ganado** (cattle): Agregar vacas al sistema, Agregar grupos al sistema, Consultar inventario vacas, Consultar grupos, Editar grupos, Editar información vacas, Eliminar vacas del sistema, Eliminar grupos del sistema
  - **Usuarios** (users): Agregar usuarios, Consultar actividad de usuarios, Consultar listado de usuarios, Editar usuarios (información general y permisos), Eliminar usuarios
  - **Dispositivos** (devices): Agregar dispositivos, Consultar inventario dispositivos, Asignar dispositivo a vaca, Eliminar dispositivo
  - **Salud** (health): Confirmación de alertas de reproducción, Registro de eventos de salud, Seguimiento de eventos de salud
  - **Reportes** (reports): Ver Reportes Resumen de estadísticas, Generar reportes personalizados para imprimir, ... para descargar (print / download custom reports)
  - **Finanzas** (finance): Registros de ingresos y egresos (income and expenses), Consulta y manejo de registros en Reemo y Siiniga, Envío de declaración (tax filing), Facturación planes smartbell (Smartbell plan billing)
- Other user profile (Nutriólogo) [2582-178](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2582-178).

#### E9. Messages (desktop 1366)
- [1457-136593](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1457-136593) and 6 variants: tabs **Mensajes Recibidos / Mensajes enviados** (received / sent), **Nuevo mensaje** (new message).
- Columns: Nombre | Asunto | Fecha | Acciones (name | subject | date | actions).
- States: thread view with replies; "Descartar Mensaje" (discard); sent "Mensaje Enviado!!! En breve el -Nombre usuario destino- recibirá tu mensaje" (sent; the recipient will get it shortly).
- Delete: "¿Quieres borrar el mensaje? Recuerda que una vez borrado el mensaje, este no podrá recuperarse." (deleted messages can't be recovered)

#### E10. Permission map (spec board)
- [1457-137410](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1457-137410). Role hierarchy "Jerarquías en roles": **Dueño > Administrador > (Médico, Nutriólogo) > Técnico de campo**. Per-role matrices are in Domain notes.

### F. Reminders (page 1442:69870)
- Scope note (1442:69881), the reminder kinds:
  - "Tareas del onboarding" (onboarding tasks)
  - "Seguimiento de tratamientos en vacas enfermas" (sick-cow treatment follow-up)
  - "Seguimiento de proceso reproductivo" (reproductive follow-up)
  - "Registro/alta de vaquilla en sistema pendiente" (heifer registration pending)
  - "Revisar los celos pendientes" (pending heats)
  - "Recordatorios de aplicación de vacunas" (vaccine reminders)
  - "Fechas de vencimiento de facturación (Plan contratado)" (billing due dates)
  - "Mensajes entre usuarios" (messages between users)
- Dashboard [2512-150172](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2512-150172): the reminder entry point is the `Icon_KPI_Event` badge on the avatar.
- Reminders hub [2512-150410](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2512-150410) "Recordatorios", collapsible rows:
  - **Tareas Onboarding** (onboarding tasks)
  - **Seguimiento vacas enfermas** (sick-cow follow-up)
  - **Eventos de reproducción** (reproduction events)
  - **Facturación: Mensual** (billing: monthly)
- Expanded states:
  - [2512-150897](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2512-150897) Onboarding: "Configurar mi rancho" card, "Completa los datos de tu perfil, rancho y programa de vacunaciones"
  - [2515-146172](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2515-146172) Sick cows: "Vacas fuera de producción por enfermedad" (cows out of production due to illness); table ID Vaca | **Días restantes** (days remaining; 00001 → 20, 00008 → 5)
  - [2515-146447](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2515-146447) Reproduction: "Vaquillas por registrar" (heifers to register); table **ID Vaca madre | Fecha parto** (dam ID | calving date). A tap opens the calf registry [2515-146636](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2515-146636): "Registra tu vaquilla recien nacida", Vaca Madre prefilled "Vaca ID 00001", Toro Padre prefilled "Pedro infante 501", Registrar + Omitir Paso
  - [2515-146791](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2515-146791) Billing: "Tu fecha de pago está próxima a vencer dd/mm/aaaa. El pago correspondiente es de $0,000.00" (payment due soon; amount), plan chip "Cría", button (`Boton 40h`) to pay
- Payment methods [2524-146378](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-146378): same as E5.

---

## 2. Flow diagrams

1. **Sign up**: Splash → Home → (Crear cuenta) SignUp → Crear Cuenta → Onboarding task hub. Alternate entry: Log-In.
2. **Onboarding alerts**: Task hub "Configurar alertas" → Alert channel selection (≥1 checkbox) → next → hub or the next task.
3. **Onboarding herd registry**: Task hub "Registrar mis vacas" → Cow registry 01 → open Datos Generales (02) → Datos Reproductivos (03 / 04) → Agregar Foto (05) → Registrar Vaca → success modal → Cow list (A10). The type toggle switches to the Vaquilla (A8) or Toro (A9) forms, which have their own success modals.
4. **Onboarding first stall**: Task hub "Organizar mis potreros" → Datos Generales (type, name, description) → Método (automated filter: age / breed / # lactations, or manual drag & drop) → Selección de indicador → Agregar Potrero → success → Stall card list.
5. **Onboarding ranch config**: Task hub "Configurar mi rancho" → Config hub tabs → Mi cuenta (edit, photo, password) → Datos Rancho (name, location) → Vacunación y Desarrollo intro → Desarrollo form → Vacunas list → Agregar vacuna modal → Guardar → plan review carousel → Aprobar → success → Dashboard.
6. **Dashboard drill-down**: Dashboard → tap KPI (Enfermas / Preñadas / Celos / Vacunas) → table → filter icon → sheet (Vacas | Vaquillas, date range, illness or vaccine) → Aplicar filtro → filtered table.
7. **Cow list filter**: VACAS tab → list → filter icon → pick variable (radio) → pick value (default preselected) → Aplicar filtro → list, or the empty message.
8. **Cow profile**: list row → Perfil (Datos Generales / Datos Reproductivos accordions, edit pencil) | Actividad (teaser → waitlist → confirm data → success) | Bitácora (list → filter / date range → event detail → Editar / Eliminar → confirm, or no-permission → Solicitar permiso → "admin notified").
9. **Cow delete**: Profile → Baja de ganado → reason sheet → Dar de baja → reason confirm → success + finance waitlist CTA → (Registrarme / Por ahora no) → list. "Error al registrar" hard-deletes the record.
10. **Stall management**: GRUPOS → Potreros vacas / vaquillas → Agregar Potrero (wizard as in flow 4) | Editar (rename, description, cow list, filters, add cows → confirm, move cows → destination → confirm) | Eliminar → pick destination stall (default General) → deleted confirmation.
11. **Health event**: Profile → Salud + → "¿Qué sucedió?":
    - Enfermedad → illness form → Registrar → cow marked sick (stall Enfermas, banner, log) → follow-up → Cambio de tratamiento or Tratamiento exitoso.
    - Accidente → accident form → log → follow-up → change or success.
    - Cambio de dieta → diet form → log.
    - Tratamiento médico → treatment form → log.
12. **Stall change from profile**: Potrero dropdown → "¿Quieres registrar este cambio?" → log "Cambio potrero de X a Y".
13. **Heat**: banner or Celo toggle in the heat window → confirm → clean?
    - Clean → inseminated? Yes → register (bull) → log. No → voluntary waiting period? Yes → log "tiempo de espera". No → loss warning.
    - Not clean → treated? Yes → "Celo sucio con medicación". No → "Celo sucio sin medicación".
    - No heat → "No entró en celo".
    - After a log: stage → Servida (if inseminated), banner switches to the pregnancy-check window.
14. **Pregnancy check**: banner in the check window → confirm? Yes or no → method (tacto / ultrasonido) → diagnosis (exitosa / no exitosa) → profile. Positive: Gestante + "Parto estimado". Negative: "Próximo celo".
15. **Calving**: banner "Parto estimado" / Parto toggle → register? (no → accuracy alert) → successful?
    - Yes → diagnosis (expected / anticipated / delayed, auto by date) → heifer registry (or skip → log "sin registro de vaquilla parida") → profile resets to Recien Paridas.
    - No → abortion: natural or induced → cause → log "Aborto".
16. **Plan & billing**: Avatar → Cambiar plan → plan cards (monthly or yearly) → Contratar → thanks. Cancel: Mi cuenta → Cancelar membresía → reason → confirm → "Fin de membresía" + data download window → format dialog.
17. **Users**: Avatar → Administrar usuarios → list → add (Datos Generales + Tipo de usuario → Personalizar permisos per category) / delete (confirm; history kept). Limited by plan ("1 usuario de 3").
18. **Reminders**: Bell or reminder icon → Recordatorios list → expand a category → act (open the ranch config task, sick-cow list, register heifer from calving, pay now → Métodos de pago).

---

## 3. Domain notes

### Entities and fields
- **User**: nombre(s), apellidos, teléfono (only "+" allowed, country-code list), correo (unique), contraseña (≥8), foto (JPG/PNG), rol, canales de alerta, permisos (custom per category), ranchos (many), última actualización.
- **Ranch**: nombre, dirección/ubicación (map), plan activo, cow count against the plan limit, user count against the plan limit, vaccination & development plan.
- **Animal** with type ∈ {Vaca, Vaquilla, Toro}: foto, raza, potrero, id control interno (unique, required; may include hex characters, ñ and spaces), id SINIIGA (optional, 4–8 digits, unique, format `MX-00-<STATE>(nn)-0000-0000`), fecha de nacimiento.
  - Cow only: fecha último parto, etapa reproductiva, estado de lactancia, # lactancia, DIM (computed).
  - Heifer only: vaca madre, toro padre, tamaño al nacer (cm), peso al nacer (kg).
  - Bull only: nombre.
- **Stall/Group (Potrero)**: tipo (preset), nombre (≤60), descripción (≤120), selection method (automated by edad / raza / #lactancias, or manual), KPI indicator (optional), cows.
- **Event (bitácora entry)**: tipo (category), fecha, evento (label), descripción, realizó registro (user), comentarios (≤160), recordatorios, plus a type-specific payload (illness, treatment type, drug form, duration, time out of production, bull used, diagnosis method, abortion cause, diet reason, new stall).
- **Vaccination & development plan** (per ranch, versioned "2007-2019", "Actualización"):
  - Development: peso primera inseminación, tipo de calostro, edad destete, edad primera desparasitación, frecuencia desparasitación.
  - Vaccines[]: nombre, dosis ml/kg, inicio (edad meses | peso), frecuencia (única | cada N meses | refuerzos N cada M meses).
  - Per cow: weight history (value, user, month), first vaccine age, next deworming.
- **Membership**: plan (Cría / Destete / En producción), billing (Mensual / Anual), last payment, renewal or end date, add-on modules, invoices, payment method.
- **Message**: from, to, subject (asunto), body, date, thread replies, sent/received.
- **Waitlist signup**: nombre, correo, teléfono, product (smart ear tags | finance module).
- **Reminder**: category, item rows (cow id + days remaining or date), link target.

### Enums
- **Breeds**: Holstein (default), Jersey, Simmental (also spelled "Simental"), Pardo Suizo, Guernsev [sic, Guernsey], Ayrshire, Shorthorn, Normando Francés, Otra Raza..., Raza Mixta. The stall-filter variant omits Raza Mixta.
- **Cow stall types**: General, Alta producción, Secas o en reto (alt "Secas o reto"), Recien Paridas, Enfermas. (Profile-level groups also show "Secas".)
- **Heifer groups (automatic)**: Recien nacidas (0–6 months), En desarrollo (6 months to first service), Servidas, Preñadas, Enfermas.
- **Reproductive stage (Etapa Reproductiva)**: Vacia (open), Servida (served or inseminated), Gestante (pregnant), "Secas (60 días antes de parto)", "Recién paridas (menor a 45 días)". The list-filter default is "Vacía".
- **Lactation status**: Lactando, Seca.
- **Health filter**: Saludables (default), Enfermas (others in instances, not read).
- **Removal reasons (Bajas)**: Venta a otro rancho, Venta a rastro, Muerte (Registro de desecho) / "Muertas (A desecho)", Error al registrar (hard delete).
- **Alert channels**: email, Alerta Web, SMS (membership), Notificación (push).
- **KPI indicators**: Vacas preñadas, Vacas en Celo, Vacas enfermas, Días en leche (DIM).
- **Health event kinds**: Accidente, Cambio de dieta, Enfermedad, Tratamiento médico.
- **Illnesses** (with built-in descriptions from the scenario notes):
  - Mastitis
  - Brucelosis ("enfermedad infectocontagiosa, producida por una bactéria", an infectious bacterial disease)
  - Pulmonía ("Infección de uno o ambos pulmones...", infection of one or both lungs)
  - Cetosis ("Alteración del metabolismo de los carbohidratos", a carbohydrate metabolism disorder)
  - Tuberculosis ("...Mycobacterium bovis")
  - Cojera ("Afección en la capacidad de movimiento", lameness)
  - Fiebre aftosa (foot-and-mouth disease; "...fiebre y úlceras en forma de ampollas en la lengua")
  - Envenenamiento ("Ingesta de alguna sustancia dañina", ingesting something harmful)
  - Otro ("Proporciona una breve descripción", give a short description)
- **Treatment types (illness/accident)**: Antibiótico, Antiséptico, Antibacteriano, Antimicotico, Quirúrgico, Anti-inflamatorios, Corticoide, Antimicrobiano, Antiparasitario.
- **Medical treatment types**: Sincronización hormonal para celo, Reducción de producción de leche, Vacunas, Otros. Notes also list "Hormonas de crecimiento" (growth hormones).
- **Drug form (Presentación)**: En piel o tópico, Oral o tableta, Inyección.
- **Diet change reasons**: Etapa reproductiva, Enfermedad, Tratamiento médico, Otra.
- **Heat outcomes**: Se inseminó a la vaca correctamente; No se inseminó por tiempo de espera; (clean, not inseminated: loss warning); Celo sucio con medicación; Celo sucio sin medicación; No entró en celo.
- **Pregnancy diagnosis**: method {tacto, ultrasonido} × result {Concepción exitosa, Concepción no exitosa}.
- **Calving outcomes**: Parto exitoso {esperado, anticipado, retrasado} [, sin registro de vaquilla parida]; Aborto.
- **Abortion**: Natural {Hormonal, Reabsorción embrionaria, Nutrición, Desconocido}; Inducido {Intoxicación Nutricional, Virus, Bacteria, Tratamiento por enfermedad, Accidente, Enfermedad (which)}.
- **Log categories (Tipo)**: Alta en sistema, Reproducción, Salud / Urgencia médica, Vacunas, Nutrición, Cambio potrero, Cambio de dieta, Accidente, Baja.
- **Vaccines (preset)**: IBR (Rinotraqueítis Infecciosa Bovina), DVR (Diarrea viral bovina), Clostridios, Derriengue (Rabia paralítica bovina), Otra.
- **Vaccine frequency**: Aplicación única, Cada N meses, Refuerzo (N boosters every M months).
- **Colostrum type**: Calificado (others not read).
- **Roles**: Dueño, Administrador, Médico, Nutriólogo, Técnico de campo.
- **Plans**: Cría ($15 USD/mo, ≤50 cows), Destete ($45, ≤150), En producción ($79, 150+). Extra user $49 MXN/mo. Prices + IVA.
- **Add-on pricing (notes)**: Finanzas y fiscal $1,500/yr (presale $1,000; Mexico-only, AGAPE fiscal regime); Dispositivos inteligentes $70/month/cow + $35,000 installation + $350/month internet per antenna; Husbandry/Genealogía $5,000/yr.
- **Cancellation reasons**: Precio, Servicio y/o Soporte, No es lo que esperaba, No me dió resultados, Otro.
- **Bull age filter**: Menos de un año, 2..8 años, 9+ años.

### Business rules visible in copy
- **Event windows are shown as 3–4 day ranges**, not single dates:
  - "Próximo celo entre los días 01 al 04 de septiembre" (next heat between the 1st and 4th)
  - "Confirma preñez entre los días 12 al 14 de octubre" (confirm pregnancy between the 12th and 14th)
  - "Parto estimado entre los días 01 al 04 de septiembre"
  - The confirm dialogs only appear "dentro de los días estimados" (within the estimated days).
- **Pregnancy → calving estimate**: confirming pregnancy (sample cow 00006, served, check window 12–14 Oct 2020) yields "Parto estimado entre los días 12 al 14 de abril del 2021". The exact gestation constant is not stated; the planner should apply the brief's 283 days from service.
- **Recién paridas = DIM < 45**: "Recién paridas (menor a 45 días)". After calving the stage becomes Recien Paridas, DIM restarts, and Fecha último Parto updates.
- **Dry-off 60 days before calving**: "Secas (60 días antes de parto)". Sample: DIM 385–405 cows are "Seca" with calving due.
- **Calving timing class**: esperado / anticipado / retrasado, decided by the actual date against the estimate window ("dentro de / antes de / posterior a la fecha esperada", within / before / after the expected date).
- **Successful calving prompts heifer registration**. If skipped, the log says "sin registro de vaquilla parida" and a reminder "Vaquillas por registrar" (ID Vaca madre, Fecha parto) appears. The newborn's dam and sire are prefilled (dam = the calving cow; sire = the bull logged at insemination).
- **Heifer conversion**: "Cambio de vaquilla a vaca (Automática, posterior al parto)" (heifer becomes a cow automatically after calving).
- **Heifer development** (note 1866:129900): Recien nacidas up to 6 months; En desarrollo from 6 to 16 months. Heat alerts start at 13 months, the last heat alert is at 18 months if not pregnant, and the button unlocks at 12 months. Servidas from first service; Preñadas when diagnosed.
- **Heifer birth date limits**: if edited, ≤ 24 months / 720 days. A heifer older than 30 months / 900 days is invalid: recommend sale for meat, "no ha sido fértil" (she has not been fertile).
- **Sick cow**: "Esta vaca se declaró enferma. Evita ordeñar para producción." The cow auto-moves to the Enfermas group. "Tiempo fuera de producción" (days) drives a reminder with "Días restantes" ("Vacas fuera de producción por enfermedad"). Banner variant: "Esta vaca lleva 5 días enferma. Evita ordeñar para producción." (sick for 5 days).
- **Milk withdrawal times by treatment** (stalls scenario note): Corticoides 21 days (264 h); Antibiótico 2–10 days (or 8 milkings); Antiséptico 3 days; Antibacteriano 1–3 days (or 4 milkings after the last application); Antimicrobiano 3–42 days; Antiparasitario 5–42 days (Ivermectina); Antimicótico 3 days; Quirúrgico per diagnosis; Sincronización de celo 2 days.
  - Times run from the last application date, on top of the treatment period.
  - Topical treatments have no withdrawal.
  - Without a description, use the maximum time.
  - Surgical treatment requires at least one other treatment type to be selected.
  - The milk-separation alert applies to every Enfermedad, to accidents only when the treatment affects milking, and the same for Tratamiento médico.
- **Abortion definition** (note): loss from the fetal period (about 42 days) until before 260 days. A loss before 42 days is early embryonic death.
- **Heat-loss message**: a clean heat that was not inseminated (outside the waiting period) shows a loss warning ("cada celo perdido, representa perdidas importantes", every missed heat costs a lot).
- **Voluntary waiting period** exists ("periodo de espera voluntario") and suppresses the insemination expectation. Its length is not given.
- **Undeletable log events** (note): Alta en sistema, Reproducción (Celo, Preñez, Parto). **Editable/deletable**: Cambio de dieta, Baja, Urgencia médica, Accidente, Enfermedad (and its follow-ups), Cambio de potrero. Deleting needs permission, otherwise a request goes to an admin. A deleted event leaves no record.
- **"Alta en sistema"** is created automatically as the first log event at registration.
- **Registry data needs by history** (note):
  - 0 gestations: idControl, birth date, breed, stall, lactationCycle, reproductiveStage.
  - 1 gestation: add lastChildBirth.
  - If the event is pregnancy: pregnantDate / isPregnant → compute estimated calving.
  - If the event is pregnancy or insemination: isInHeat / lastHeatDate → compute next heat or insemination check.
- **Next-event banner by age**: "Próximo evento según edad: Tratamiento antiabortivo" (anti-abortive treatment), driven by the vaccination & development plan.
- **Vaccination plan defaults**:
  - First vaccine recommended at 90 days.
  - First-insemination weight 330–380 kg.
  - Weaning 60–90 days.
  - First deworming 90–180 days (3–6 months).
  - Numeric inputs are 3 digits.
  - The plan must be approved before leaving the screen or switching ranch.
- **Stall defaults**: General is the default type and the destination on delete. A stall delete must re-home its cows. The KPI is optional and needs ≥1 cow first.
- **Filters**: Aplicar filtro is disabled until a filter is chosen. Default values are preselected per variable. Dates can never be in the future.
- **SINIIGA**: a 4-digit entry auto-expands to `MX-00-00-0000-1234`. Unique.
- **Membership**: SMS is membership-gated. The plan limits cows ("Llevas 45 vacas de 50") and users ("1 usuario de 3"). After cancellation there is a data-download window until a date.
- **Beef ranch variant** (note): replace the DIM indicator with "días abiertos" (days open).
- **Bull on insemination**: log the bull used for AI or natural service; the bull can be added inline ("Agregar Toro").

### Role permission matrix (E10; greyed = denied, read from screenshots)

| Permission | Dueño | Admin | Médico | Nutriólogo | Técnico |
|---|---|---|---|---|---|
| Altas vacas | ✓* | ✓ | ✓ | ✗ | ✗ |
| Consulta inventario vacas | ✓* | ✓ | ✓ | ✓ | ✓ |
| Editar información de vaca | ✓* | ✓ | ✓ | ✓ | ✓ |
| Eliminar vacas | ✓* | ✓ | ✓ | ✗ | ✓ |
| Agregar grupos | ✓* | ✓ | ✓ | ✗ | ✓ |
| Consulta / Editar grupos | ✓* | ✓ | ✓ | ✓ | ✓ |
| Eliminar grupos | ✓* | ✓ | ✗ | ✗ | ✓ |
| Agregar usuarios | ✓* | ✓ | ✗ | ✗ | ✗ |
| Consulta listado / actividad usuarios | ✓* | ✓ | ✓ | ✓ | ✓ |
| Editar usuarios | ✓* | ✓ | ✗ | ✗ | ✗ |
| Eliminar usuarios | ✓* | ✗ | ✗ | ✗ | ✗ |
| Agregar / consultar dispositivos | ✓* | ✓ | ✓ | ✗ | ✗ |
| Asignar dispositivo a vaca | ✓* | ✗ | ✓ | ✗ | ✗ |
| Eliminar dispositivo | ✓* | ✓ | ✗ | ✗ | ✗ |
| Confirmación alertas reproducción, registro / seguimiento salud | ✓* | ✗ | ✓ | ✓ | ✓ |
| Ver reportes | ✓* | ✓ | ✓ | ✓ | ✓ |
| Reportes personalizados imprimir / descargar | ✓* | ✓ | ✓ | ✓ | ✗ |
| REEMO / SIINIGA | ✓* | ✗ | ✗ | ✗ | ✗ |
| Ingresos y egresos | ✓* | ✓ | ✗ | ✗ | ✗ |
| Envío de declaración | ✓* | ✗ | ✗ | ✗ | ✗ |
| Facturación planes smartbell | ✓* | ? (listed; row cut off in screenshot) | – | – | – |

\*The Dueño frame was not screenshot (rate limit); it is assumed to have everything. Médico has "Eliminar vacas" but not "Eliminar grupos", and Técnico has delete rights that Nutriólogo lacks. Both look odd; confirm.

---

## 4. Shared components seen (instance names)
- **Chrome**: `Menu Rancho`, `Bell_icon`, `Avatar`, `Icon_KPI_Event` (badge), `Footer_Mobile` (with `Stall`, `Report_Icon`, `Icon_Cow_Adult`, `Alerts_Icon`), `left arrow` / `right arrow` / `down arrow`, `Grid/Mobile_Smartbell_Official`, `Grid/Desktop_regular`, `Encabezado`, `Boton Regresar`.
- **Buttons**: `Boton 40h`, `Boton Continuar`, `Boton Save`, `Boton Omitir Paso`, `Boton agregar foto`, `Boton Registrar Grupo`, `Boton Vacas en Sistema`, `Button_Add`, `Button_Filter` / `Filter_Icon`, `Button_edit_icon`, `Icon_Pencil` / `Pencil 2`, `Icon_Garbage` / `Garbage 1`, `add 2`, `Add cow_small`, `Health Button`.
- **Selectors**: `Boton Vaca-On/Off_mobile`, `Boton Vaquilla-On/Off_mobile`, `Boton Toro-Off_mobile`, `Cow / Calf / Bull Counter_activated / deactivated(_mobile)`, `Boton Text On/Off` (radio pill), `Boton Text Check_On/Off` (multi-select pill), `Radio-on`, `Checkbox-On/Off`, `Switch On/Off/Deactivated`.
- **Inputs**: `Textbox Mediano / Chico / Mediano 1-4`, `Dropdown Mediano / Chico / Nano`, `Dropdown Medium deactivated`, `Search Box 40h`, `ID SINIIGA`, `ImageIcon`.
- **Data display**: `Component_Table_Mobile`, `Header Table_Mobile`, `Pagination` / `Pagination_big`, `Scroll` / `Scroll 3`, `Steper Bar 1/3 card top`, `Group Chip` (stall card).
- **Icons**: `Icono Cows in Heat 1`, `Icono Pregnant cows 1`, `Icono Sick Cows 1`, `Icono Calf 1`, `Icono DIM`, `Icon_Medical_Event`, `Icon_Cow_Calf`, `Icon_Bull`, `Icon_Cows_Heat`, `Icon_Sick_Cows`, `Icon_Pregnated_Cows`, `Paypal`.
- **Reusable floating frames**: "Tooltip for user configurations" (user menu, role dropdown, cancel reasons), "Tooltip for alerts/reminders", `Drop_down_races(_stalls)`, `Drop_down_stalls_400w / 172w`, `Drop_down_vaccines`, `Filter for cow section for stalls`, `Tooltip_*` KPI tooltips, `Onboarding_Dashboard` (symbol 1851:99016).

---

## 5. Open questions and inconsistencies
1. **The events hub is a desktop layout** (1366x768) inside the mobile file. There are no 360px versions of the illness, accident, diet, treatment, heat, pregnancy, calving, abortion or stall-change modals. Mobile has only the profile toggles (Celo / Preñada / Parto / Salud +). We need to decide the mobile pattern (bottom sheet vs full screen).
2. Removal labels differ: list/filter "Muerte (Registro de desecho)" vs profile radio "Muertas (A desecho)" vs dropdown "Error al registar" [typo].
3. Group type naming drifts: "Secas o en reto" / "Secas o reto" / "Secas"; "Recien Paridas" / "Recién paridas"; "Pulmonía" / "Pulmonia".
4. First-deworming hint: "90 y 180 días" vs "3 y 6 meses" (same range, inconsistent unit). The vaccine "Inicio aplicación" toggle has Edad or Peso, but the expanded copy only shows age.
5. Stall name counter shows 0/120, but the rule says name ≤ 60 chars.
6. Gestation length, heat cycle length, voluntary waiting period days, and pregnancy-check offset are **never stated numerically**; they are only implied by the sample windows. These need product confirmation (the brief suggests 283 days and 21 days).
7. Heat window is shown as 4 days (01–04), pregnancy check as 3 days (12–14). Is the window width fixed?
8. Dashboard "DIM 002" is a count, not a value. What does it count (cows above a DIM threshold)?
9. Permission matrix oddities (see table). The Dueño matrix and the "Facturación planes smartbell" row were not verified.
10. Plan prices mix USD (plans) and MXN (extra user $49 Mx/mes). The note pricing also differs.
11. The reminders "Facturación: Mensual" row's pay button label was not read. The Cría plan chip appears in the reminder.
12. The bitácora delete flow assumes an admin approval queue; there is no screen for the admin side.
13. Bull list filters (Raza / Edad / Bajas) differ from cows (Grupo / Raza / Reproducción / Salud / Bajas). Heifer lists reuse the cow filters, though heifer "groups" are automatic.
14. Several option sets live in instances and were not read because of the MCP rate limit: Etapa Reproductiva full list, Salud values beyond "Saludables", Reproducción values beyond "Vacía", colostrum types, data-download formats, pregnancy method button labels (inferred tacto / ultrasonido from result copy).
15. A notes question is unresolved (1934:102567): how vaccination-plan edits affect history ("¿Aparecera un tipo de historial?", will a history appear?). The "Actualización" frames suggest versioning.
16. The heifer "Datos Reproductivos" accordion appears in some calf frames (1617:316, 1866:123894) though heifers have no reproductive fields. It is probably leftover.
17. The onboarding "Bull_Registry_01" success frame header still says "comienza por tu primer vaca" (copy bug).
