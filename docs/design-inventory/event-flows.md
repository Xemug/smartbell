# Cow event flows (ID01-ID07): mobile + web

Sources:
- Mobile file `gv5ugNqVKPF8N2Ol5cQCyV` pages ID01-ID07.
- Web file `6UCRP77ZAdWb1ut1A91yJX` pages `2018:564062` + `3807:155733` (01 erase+sickness and snackbars), `2018:679236` (02), `2017:328694` (03), `2017:387004` (04), `2017:445348` (05), `2017:503794` (06), `2017:562104` (07).

Link format: M = `https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=<id>`, W = `https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=<id>` (replace `:` with `-`).

Method: I read the full metadata (every frame and text layer) for all 7 mobile pages and all 8 web pages. I took screenshots of 9 key frames, then hit the Figma MCP rate limit. Text inside component instances (button labels, radio options) does not show in the metadata. Where I could not screenshot a frame, I took those labels from the designers' "Notas de escenarios" and "Error handling" annotation texts, and I mark them **(from notes)**.

Prototype fixture cows ("Funcionalidades prototipo según vaca seleccionada"):
| Cow | Scenario (es) | Gloss |
|---|---|---|
| 00001 | enfermedad y baja | sickness + removal (and stall change) |
| 00002 | parto retrasado | delayed calving (+ abortion branch) |
| 00003 | cambio de dieta y accidentes | diet change + accidents (+ medical treatment, stall change on web) |
| 00004 | celo - ciclo completo | heat, full cycle |
| 00005 | parto dentro de lo esperado | calving on time |
| 00006 | preñada dentro de lo esperado | pregnancy confirmed on time |
| 00007 | parto anticipado | early calving |

The prototype's "today" is **15 Oct 2019**, inferred from DIM values: 18•Sep•2018 + 392 = 15 Oct 2019; 25•Sep•2018 + 385 = 15 Oct 2019; 28•May•2019 + 140 = 15 Oct 2019.

---

## 1. Screens

### 1.0 Cow profile (event launcher). Shared by all flows
- Mobile: `Cow_Profile` M 2005:5517, `Cow_Profile_02` (Datos Generales open) M 2005:31277, `Cow_Profile_03` (Datos Reproductivos open) M 2005:7643; per-cow copies `Cow_Profile_ID0x_01/02/03`.
- Web: `Cow Profile | Vaca` W 2018:565589; per-flow `Cow Profile | Vaca_Heat_Confirmation` (start frames: W 2018:688918, 2017:393319, 2017:454800, 2017:510341, 2017:568881).
- Purpose: show the cow's status and next computed date, and launch event registration.
- Header: cow ID (`00001`) + adult-cow icon. Next-date banner, one of:
  - `Próximo celo entre los días 03 al 07 de Noviembre del 2019.` (next heat window)
  - `Confirma preñez entre los días 12 al 14 de octubre del 2020.` (pregnancy check window)
  - `Parto estimado entre los días 22 al 25 de Octubre del 2019.` (expected calving window)
  - `Próximo evento según edad: Tratamiento antiabortivo` (next age-based event: anti-abortion treatment)
  - Health override: `Esta vaca se declaró enferma. Evita ordeñar para producción.` (declared sick, do not milk for production). Web variant: `Esta vaca lleva 5 días enferma. Evita ordeñar para producción.`
- Tabs: `Perfil` / `Actividad` / `Bitácora` (profile / activity / event log). Web shows profile, `Bitácora de Eventos` (+ `Ampliar bitácora`, expand log) and `Monitor de Actividad` on one page.
- Datos Generales (accordion): `Raza` (breed, dropdown: Holstein, Jersey, Simmental/Simental, Other), `Potrero` (stall/group, dropdown), `ID control interno` (internal ID, `0000-0000-0000`), `ID SINIIGA (opcional)` (national ID, `MX-00-JAL(14)-0000-0000`), `Fecha de nacimiento` (birth date, DD/MM/AAAA).
- Datos Reproductivos (accordion, read-only): `Fecha último Parto` (last calving date), `Etapa Reproductiva` (reproductive stage), `Estado de Lactancia` (lactation state), `# Lactancia` (lactation number). Web also shows `DIM`.
- Event tiles (mobile, screenshot), each a toggle switch: `Celo` (heat), `Preñada` (pregnant), `Parto` (calving). `Salud` (health) is a green tile with a `+` button. Below them, the link `Baja de ganado` (remove cow, trash icon).
  - The Celo/Preñada/Parto switches act as the confirmation entry. They activate when the cow is inside the corresponding computed window (`Switch Deactivated`/`Switch Off`/`Switch On` instances).
  - Web: the same 4 buttons, with states `Default`, `Innactive`, `Alert coming`, `Alert confirmed` (W 3804:155339..155607). This is the alert-to-confirmation affordance.
- Bitácora list: columns `Tipo | Fecha | Evento`; web adds `Acciones`. Rows show category + date + event label. Pagination `10 vacas por hoja` (10 per page), plus a `Vacunación y desarrollo` button. Tapping a row opens the event detail (1.9).

### 1.1 ID01 Health event: selection (Registro de evento de salud)
- M 2021:200894 (nothing selected, Continuar disabled), M 2005:33139 (Enfermedad selected); W 2018:565817 / 3807:157000. Same modal reused in ID03 (M 2076:194057, 2076:193956, 2076:194472, 2076:194734; W 2017:340001, 341131, 341371, 341612).
- Title `Registro de evento de salud`. Question `¿Qué sucedió con la vaca 00001?` (what happened to cow 00001?). Stepper `1/3`.
- Field: single-choice radio list (screenshot): `Accidente` (accident) / `Enfermedad` (illness) / `Cambio de dieta` (diet change) / `Tratamiento médico` (medical treatment). Required.
- Actions: `Regresar` (back, closes) / `Continuar` (continue). Rule: "Boton “Continuar” - Desactivado hasta que el usuario seleccione alguna opción" (disabled until an option is selected).
- Routes: Enfermedad → 1.2. Accidente → 1.6. Cambio de dieta → 1.7. Tratamiento médico → 1.8.

### 1.2 ID01 Illness registration (Registro de enfermedad y diagnóstico)
- M 2005:33425 (empty, screenshot), M 2021:201299 (filled); W 2018:566994 (empty) / 2018:585944 (filled); W 3807:158177 / 161692.
- Fields:
  | Label (es) | Gloss | Type | Req | Default / options |
  |---|---|---|---|---|
  | (header dropdown) `Enfermedad` | illness | dropdown | Y | `Mastitis, Brucelosis, Pulmonía, Cetosis, Tuberculosis, Cojera, Fiebre aftosa, Envenenamiento, Otro` (M 2005:26708) |
  | `Descripción` | description | text | Y (mobile) | Prefilled with a predefined text per illness (see 3.6). Placeholder `Breve descripción`, or on web `Da una descripción de lo sucedido` |
  | `Tipo de tratamiento` | treatment type | dropdown | Y | default `Antibiótico`; options `Antibiótico, Antiséptico, Antibacteriano, Antimicotico, Quirúrgico, Anti-inflamatorios, Corticoide, Antimicrobiano, Antiparasitario` (M 2005:26837) |
  | `Fecha diagnostico` | diagnosis date | date picker | Y | today (`- fecha de hoy - dma`) |
  | `Presentación medicamento` | drug form | dropdown | Y | default `Inyección`; options `En piel o tópico, Oral o tableta, Inyección` |
  | `Duración del tratamiento` | treatment duration | editable dropdown (days) | Y | `5 días` |
  | `Tiempo fuera de producción` | time out of production (milk withdrawal) | editable dropdown (days) | Y | `5 días` |
- Actions: `Regresar` / `Continuar` (mobile), `Registrar enfermedad` (web). Disabled until required fields are filled.
- Web note: "Si se selecciona tratamiento quirúrgico, es importante que se marque error si el usuario no selecciona ningún otro tratamiento" (if surgical is chosen, show an error unless another treatment is also chosen). "Solo se selecciona una opción" (single select).
- Next: 1.3.

### 1.3 ID01 Changes due to illness (Cambios por enfermedad y diagnóstico)
- M 2021:201584; W 2018:566061 / 3807:157244.
- Fields: checkbox `Dieta` (diet) + dependent dropdown; checkbox `Potrero` (stall) + dependent dropdown (`Dropdown Medium deactivated` until checked).
  - Potrero options (M 2005:32053 `Stall_Menu`): `General, Alta producción, Secas o reto, Recién paridas, Enfermas` (general, high production, dry/transition, fresh, sick).
  - Diet options: not visible.
- Rules: "No debe haber selección por default y se permitirá al usuario registrar los cambios sin seleccionar cambios en dieta o potrero" (no default; both optional). "Al seleccionar dieta o potrero, desactivar el botón “Continuar”/“Registrar cambios” hasta que el usuario haya realizado una selección" (if a box is checked, its dropdown becomes required).
- Actions: `Regresar` / `Continuar` (`Registrar cambios` on web).
- Result: profile shows the sick banner (M 2021:201859, W 2018:566309). Bitácora gets `Salud | 07/09/2019 | Mastitis diagnosticada` (M 2021:202083). Web dashboard counter `Enfermas` increments. Web snackbar `Estado de Salud Registrado` (1.11).

### 1.4 ID01 Treatment follow-up (Seguimiento de tratamiento)
- Triggered by tapping the illness row in the Bitácora. M 2021:202307 (screenshot), M 2021:202539, M 2021:202769; W 2018:586199 / 586434.
- Field: radio `Tratamiento exitoso` (successful treatment) / `Cambio de tratamiento` (change treatment). Stepper `1/2`.
- Actions: `Regresar` / `Registrar` (disabled until a choice is made: "Boton “Registrar” - Quedara desactivado hasta que el usuario seleccione alguna opcion").
- Tratamiento exitoso → bitácora row `Mastitis: Tratamiento exitoso` (M 2021:203003, W 2018:566767). Implied: the sick flag clears (profile frame not shown).
- Cambio de tratamiento → 1.5.

### 1.5 ID01 Change of treatment (Cambio de tratamiento)
- M 2021:203260; W 2018:586671 / 3807:162420.
- Fields: header shows the illness (`Mastitis`). `Tipo de tratamiento`, `Fecha diagnostico`, `Presentación medicamento`, `Duración del tratamiento`, `Tiempo fuera de producción`, with the same defaults as 1.2 (today, Antibiótico, Inyección, 5 días, 5 días).
- Result: bitácora row `Mastitis: Cambio de tratamiento` (M 2021:203620, W 2018:566538). The sick banner stays.

### 1.6 ID03 Accident registration (Registro de accidente)
- M 2076:196092 (938px tall); W 2017:340242.
- Fields:
  | Label | Gloss | Type | Req | Default |
  |---|---|---|---|---|
  | `Descripción accidente` | accident description | text | N (web: may be empty) | placeholder `¿Que pasó?` (what happened?) |
  | `Tipo de tratamiento` | treatment type | dropdown | Y | `Antibiótico` (web 2nd note: no default, placeholder `Selecciona un tipo`) |
  | `Fecha inicio de tratamiento` | treatment start date | date | Y | today; placeholder `Selecciona la fecha` |
  | `Presentación medicamento` | drug form | dropdown | Y | `Inyección` |
  | `Duración del tratamiento` | duration | editable dropdown | Y | 5 días |
  | `Tiempo fuera de producción` | withdrawal | editable dropdown | Y | 5 días |
  | `Cambios por accidente:` `Dieta` / `Potrero` | changes due to accident | checkbox + dropdown | N | none |
- Action: `Registrar Seguimiento` (disabled while a checked box has no selection). Stepper `1/2`.
- Result: bitácora `Salud | 26/01/2020 | Accidente: -Razón Accidente-` (M 2076:196387, W 2017:339308). Detail card: `Tipo de registro: Accidente`, comment `Se cayó en un hoyo la vaca`, reminder `Separar de producción por tratamiento` (M 2102:165631). The sick banner shows on the profile.
- Accident follow-up (web only): `Seguimiento tratamiento` / `Seguimiento por accidente` (W 2017:340640, 340893). Fields: `Fecha inicio tratamiento`, `Descripción accidente`, `Tipo de tratamiento`, `Cambios por accidente: Dieta`. Results: `Accidente: -Cambio tratamiento-` (W 2017:339769) or `Accidente: -Tratamiento exitoso-` (W 2017:339540).

### 1.7 ID03 Diet change (Registro de cambio de dieta)
- M 2071:259586; W 2017:341853.
- Fields: `Fecha inicio dieta` (diet start date; date; today), `Razón cambio de dieta` (reason; dropdown; no default; options `Etapa reproductiva, Enfermedad, Tratamiento médico, Otra`, M 2076:182122), `Descripción nueva dieta` (new diet description; text; placeholder `¿Como es la dieta?`; no predefined text).
- Actions: `Regresar` / `Registrar`. Stepper `1/2`.
- Result: bitácora `Salud | 26/01/2020 | Cambio de dieta` (M 2071:260115, W 2017:338836).

### 1.8 ID03 Medical treatment (Registro de tratamiento médico)
- M 2071:260359, result M 2086:0; W 2017:342096.
- Fields: `Tipo de tratamiento` (dropdown, no default, placeholder `Selecciona un tipo`). Options (M 2076:182173): `Sincronización hormonal para celo, Reducción de producción de leche, Vacunas, Otros`; the notes add `Hormonas de crecimiento`. Also `Fecha inicio tratamiento` (today), `Descripción tratamiento` (placeholder `¿Como es el tratamiento?`), and on web `Cambios por tratamiento:` Dieta/Potrero (optional).
- Result: bitácora `Salud | Tratamiento medico`.

### 1.9 Bitácora event detail (Cow_Profile_Event_02)
- M 2100:57 (illness), M 2102:165479 (calving), M 2102:165631 (accident), M 2134:1443, M 2186:174749; patterns sheet M 2119:170403 (screenshot). Web: W 2017:342883 (view), W 2017:343005 (edit), W 2017:343130 (delete confirm).
- Fields (read-only): `Tipo de registro:` (record type: Salud / Reproducción / Accidente / Vacuna), `Fecha:`, `Tipo de evento`, `Realizó registro:` (recorded by, avatar + name), `Comentarios:`, `Recordatorios:` (reminders, see 3.4). For a dirty heat with medication there is an expandable `Tratamiento médico` block showing Tipo de tratamiento / Presentación medicamento / Duración del tratamiento / Tiempo fuera de producción.
- Actions: `Editar` (pencil) and `Eliminar` (trash).
  - Web edit mode: `Comentarios` textarea with `0/160` counter, placeholder `¿Que pasó?`, `Guardar` (save) disabled if Comentarios is empty, `Fecha` defaults to today.
  - Web delete: dialog `Eliminar evento en bitacora` / `¿Seguro que quieres eliminar este evento de la bitacora?` / `Una vez eliminado el evento, no quedara ningun registro en el sistema.` / `Si, eliminar`. Then snackbar `Evento en bitácora eliminado`.
- Web manual event (W 2017:342713): `Nombre del evento`, `Fecha`, `Comentarios` (0/160), `Guardar`. Event-type header list: `Vacunas, Cambio Potrero, Urgencia Médica, Reproducción, Cambio Dieta, Baja, Tratamientos, Desarrollo, Alta, Otros/Varios`.

### 1.10 ID01 Stall change (Cambio de Potrero)
- Mobile: `Cow_Profile_02` with the Potrero dropdown (M 2005:31277 → 2005:32903 shows `Alta producción`) → confirm M 2005:32422. Web: W 2017:343768 → 2017:342345 / 342571.
- Confirm copy: `Cambio de Potrero` / `Estas cambiando la vaca 00001 al potrero -nombre de potrero-`. Buttons: `Regresar` / confirm (label not visible).
- Result: bitácora `Cambio potrero de Recien paridas a -nombre del potrero-` (web). This is an editable/deletable event.

### 1.11 Snackbars (web page 3807:155733 only)
- Component `Positive_Confirmation_Snackbar` (icon + text + close `delete` icon), bottom-centre (y=713 on the 768 frame):
  | Copy | Icon | Trigger |
  |---|---|---|
  | `Celo Registrado` | Icono Cows in Heat | heat event saved |
  | `Preñez Registrada` | Icono Pregnant cows | pregnancy diagnosis saved |
  | `Parto Registrado` | Icono Calf | calving/abortion saved |
  | `Estado de Salud Registrado` | Icono Sick Cows | health event saved |
  | `Vaca 00000 Celo Registrado` / `Vaca 00000 Preñez Registrada` / `Vaca 00000 Parto Registrado` / `Vaca 00000 Estado de Salud Registrado` | same | variant with cow ID (used from list / alert context, frame labelled `Listado de vacas`) |
  | `Evento en bitácora eliminado` | none | log event deleted |
  | `Falla de conexión, intenta más tarde` | none | error variant (`Error de conexión o falla de servidor`) |
- Example frames: W 3807:170164 (Celo Registrado over profile), W 3807:170908 (deleted), W 3807:169763 (connection error).
- Mobile: no snackbar frames exist. Mobile flows end on the updated profile/bitácora.

### 1.12 ID01 Baja de ganado (removal). Web 01, related to the sickness flow
- W 2018:567249 → 567488..568448 → 568688/568928/569166/569406 → 569646/569890/570134 (same on 3807).
- Step 1: `Baja de Ganado` / `La vaca 00001 se dará de baja` / `A continuación, te haremos unas preguntas`, with Regresar / Sí.
- Step 2: `Razón de baja de esta vaca:` radio `Eliminación de registro del sistema (Corrección de error)`, `Venta a rastro`, `Venta a otro rancho`, `Muerte (Registro de desecho)`. `Dar de baja` is disabled until a reason is chosen.
- Step 3 confirm copy:
  - `La vaca 00001 se eliminará por completo del sistema, sin posibilidad de recuperarla` / `¿Cuál vaca? Aquí nunca hubo una vaca!!!`
  - `…se dará de baja por venta a rastro` / `Ahhh!!! La vamos a extrañar, esperemos se convierta en suculentos cortes.`
  - `…por venta a otro rancho` / `Ahhh!!! vamos a extrañar a esta vaca, esperemos que la cuiden tan bien como tú.`
  - `…por Muerte (registro de desecho)` / `Lamentamos tu pérdida, esperemos que tus vacas no se pongan tristes por su partida!!!`
- Step 4 success: `La vaca 00001 se dió de baja exitosamente por …` + finance CTA `Conoce el impacto financiero de este evento. Módulo de finanzas proximamente disponible` / `Registrarme en la lista de espera` / `Por ahora no, gracias`. The notes say that for "corrección de error" the alert is `Recuerda que mantener registros precisos hará que tu rancho sea más rentable`.
- Mobile: only the `Baja de ganado` link appears in these pages. The mobile removal flow is on another page (not mine).

### 1.13 ID04 Heat confirmation (Registro de celo), full cycle
- Mobile frames M 2087:548 … 2114:166787; web W 2017:403675 … 2017:402994. Steppers `1/4`, `1/5`, `1/2`.
- Step A, alert prompt: `La vaca 00004 está dentro de los días estimados para celo` / `¿Quieres confirmar celo?` (cow is within the estimated heat days; confirm heat?). Mobile M 2087:548, web W 2017:403675. Options **(from notes)**: `Confirmar` (→ B) or "No entró en celo" (→ G).
- Step B: `Estás registrando que la vaca 00004 entró en celo.` / `¿Fue este un celo limpio?` (clean heat?). M 2087:850, W 2017:406101. Sí → C; No → E.
- Step C: `La vaca 00004 entró en celo y este fue limpio` / `¿La inseminaste?` (did you inseminate?). M 2087:1111, W 2017:406347. Sí → D; No → F.
- Step D, insemination form (M 2087:1399, W 2017:407353):
  - `Diagnóstico a registrar` = `Se inseminó la vaca correctamente` (fixed).
  - `Fecha diagnóstico` (date, today, calendar).
  - `Descripción` (prefilled `Se observó que entrara en celo en el periodo esperado, el celo fue limpio y se inseminó a la vaca`; placeholder if erased `Recuerda que es importante dejar notas sobre los celos identificados y las inseminaciones realizadas`; optional).
  - `Toro para inseminación o monta` / `Toro utilizado para la inseminación o monta` (bull for AI or natural service; dropdown `Seleccionar Toro utilizado`), plus `Agregar Toro` (+). Web add-bull form W 2017:407602: `Nombre`, `ID control interno`, `ID SINIIGA (opcional)` `MX-00-AGS(01)-0000-0000`, `Fecha de nacimiento`.
  - `Registrar` → bitácora `Celo ⑦ confirmado: Inseminación` (web `Celo confirmado : Inseminada`). Reminder `Esperar al siguiente ciclo para su observación`.
- Step E: `La vaca 00004 entró en celo y este no fue limpio` / `¿Se le dió tratamiento?` (M 2087:2503, W 2017:406847).
  - Sí → mobile treatment form M 2149:342 (`Tipo de tratamiento`, `Duración del tratamiento`, `Presentación medicamento`, `Tiempo fuera de producción`, stepper 1/2), then the diagnosis form M 2087:2779 / W 2017:407094: `Diagnóstico a registrar` = `Celo sucio con medicación`, `Fecha diagnóstico`, `Descripción` (`…pero el celo fue sucio, se le aplicó el tratamiento correspondiente.`; placeholder `Recuerda registrar que tratamiento se le dió a la vaca cuando presenta un celo sució y se trata`). Bitácora `Celo ④ confirmado: Sucio, se medicó` (web `Celo confirmado : Sucio, se aplicó tratamiento`). Reminder `Separar la vaca de producción por 5 días` + a `Tratamiento médico` block.
  - No → M 2087:3268 / W 2017:408371: `Celo sucio sin medicación`, description `…el celo fue sucio, se decidió no dar medicación`, placeholder `Recuerda que se debe medicar a la vaca cuando presenta un celo sucio`. Bitácora `Celo ⑤ confirmado: Sucio, no se medicó` (web `…: Sucio, sin tratamiento`). Reminder `Esperar al siguiente ciclo para su observación`.
- Step F: `La vaca 00004 entró en celo y este fue limpio y no la inseminaste` / `¿Se encuentra en periodo de espera voluntario?` (is she in the voluntary waiting period?). M 2114:165779, W 2017:406596.
  - Sí → M 2114:166069 / W 2017:407863: `No se inseminó por tiempo de espera` (web `No se inseminó por periodo de espera`), description `…no se inseminó a la vaca debido a que esta en tiempo de espera`, placeholder `Recuerda registrar detalles sobre los celos en periodo de espera`. Bitácora `Celo ② confirmado: Periodo de espera` (web `Celo confirmado : Limpio, en periodo de espera`).
  - No → warning modal M 2090:11 / W 2017:408122: `Recuerda que es importante que insemines las vacas que hayas observado en celo` / `Nos informas que la vaca 00004 tuvo un celo que fue limpio y no la inseminaste. Recuerda que cada celo es una oportunidad para inseminar tus vacas, y no hacerlo representa perdidas importantes.`, with `Regresar` / `Registrar`. Bitácora `Celo ③ confirmado: No se inseminó` (web `Celo confirmado : Se decidió no inseminar`). Example comment `No había semen disponible de los toros recomendados`. Note: "Puede haber multiples razones… importante dejarlo como placeholder" (several possible reasons; keep the description as a placeholder).
- Step G, no heat: M 2087:1938 / W 2017:408629: `No entró en celo`, description `Se observó que la vaca no entró en celo en el periodo esperado`, placeholder `¿Sucedió el celo?`. Bitácora `Celo ① no se confirmó`. Comment `No se observo celo`. Reminder `Esperar al siguiente ciclo para su observación`.
- All heat forms: `Fecha diagnóstico` = today, editable by calendar. Description is optional (erasing it shows the placeholder, but registering is still allowed).
- End state: M 2086:24130 / 2114:166787 shows `Próximo celo entre los días 01 al 04 de septiembre del 2020.`

### 1.14 ID06 Pregnancy diagnosis (Registro de Preñez)
- Mobile M 2160:215331 … 2160:217861; web W 2017:520703 … 2017:521909. Start state (web): Etapa `Servida` (served/inseminated), banner `Confirma preñez entre los días 12 al 14 de octubre del 2020.` Breed Simental, last calving 28•Mayo•2019, DIM 140.
- Step A: `La vaca 00006 está dentro de los días estimados para diagnóstico de gestación` / `¿Quieres confirmar su preñez?` (within estimated days for gestation diagnosis; confirm pregnancy?). The answer is a pregnant yes/no choice.
- Step B (yes): `La vaca 00006 confirmas que si quedó preñada` / `¿Qué método usaste para el diagnóstico?` (which method?). Options **(from description copy)**: `Tacto` (palpation) / `Ultrasonido` (ultrasound). Step B (no): `…confirmas que no quedó preñada` + the same method question.
- Step C, success form (M 2160:216244 tacto, 2160:216490 ultrasonido; W 2017:521423, 522139):
  - `Diagnóstico a registrar` = `Concepción exitosa` (mobile typo `Conepción`).
  - `Fecha diagnóstico` (today).
  - `Descripción` (`Se diagnosticó por tacto|ultrasonido que la concepción fue exitosa`; placeholder `¿Cómo se diagnosticó la preñez?`; optional).
  - `Cambios por preñez:` Dieta / Potrero (optional checkbox + dropdown).
  - Button `Registrar cambios`.
  - Result: Etapa `Gestante`, banner `Parto estimado entre los días 12 al 14 de abril del 2021.`, bitácora `Reproducción | Gestación confirmada` (+ `Salud | Cambio de dieta` if a diet change was chosen) (M 2160:217660, W 2017:521679). Snackbar `Preñez Registrada`.
- Step C, failure form (M 2160:217062 tacto, 2160:217400 ultrasonido; W 2017:522395, 522643): `Concepción no exitosa`, description `Se diagnosticó por tacto|ultrasonido que no se logró la concepción`, placeholder `¿Cómo se diagnosticó que no quedo preñada?`. **The `Registrar diagnóstico` button is disabled if the description is empty** (the only description that is required). Result: bitácora `Gestación no confirmada`, banner `Próximo celo entre los días 01 al 04 de septiembre del 2020.` (W 2017:521909, which still shows Etapa `Gestante`, see 5).

### 1.15 ID02 / ID05 / ID07 Calving confirmation (Registro de Parto)
These three flows are identical apart from the timing qualifier.
- ID02 delayed: M 2072:175885 … 2072:179596; W 2018:706892 … 2018:706665.
- ID05 on time: M 2114:213094 … 2134:1443; W 2017:470194 … 2017:469967.
- ID07 early: M 2186:173733 … 2186:174749; W 2017:569790 … 2017:569563.
- Start state (web): Etapa `Secas (60 días antes de parto)`, Lactancia `Seca`, `# Lactancia 3`, DIM 392/385/402-405, banner `Parto estimado entre los días 22 al 25 de Octubre del 2019.` (ID02 mobile `09 al 12 de Octubre`).
- Step A: `Estás confirmando el parto de la vaca 0000X` / `¿Quieres registrar el parto?`. Sí → B. Regresar → reminder modal `Registro de Parto` / `Recuerda que mantener registros precisos hará que tu rancho sea más rentable` (only an `Entendido` button, from notes) (M 2072:176142, W 2018:708418).
- Step B: `¿El parto fue exitoso?` (was calving successful?). Options **(from notes)**: `Sí, después de lo esperado` (ID02), `Sí` (ID05), `Sí, antes de lo esperado` (ID07); `No, abortó` (no, aborted) → D.
- Step C, success form (M 2071:201484 / 2114:214157 / 2186:173338; W 2018:708162 / 2017:471468 / 2017:571064):
  - `Diagnóstico a registrar` = `Parto exitoso retrasado` | `Parto exitoso esperado` | `Parto exitoso anticipado`.
  - `Fecha diagnóstico` (calving date; today; missing → `Registra la fecha de parto`).
  - `Descripción`: `La vaca entró en labor de parto posterior a / dentro de / antes de la fecha esperada` (labour after/within/before the expected date). Placeholder `¿Qué sucedió durante el parto?`.
  - `Cambios por parto:` (mobile ID02 mislabelled `Cambios por enfermedad:`) Dieta / Potrero, optional.
  - Button `Registrar cambios`.
  - Web 02 variant W 2481:175372/175321 shows the error states `Registra la fecha de parto` / `¿Qué paso durante el parto?`.
- Step C2, calf registration (`Registra tu vaquilla recien nacida`, register your newborn heifer). M 2071:202075/201997/201925/201832 (screenshot); W 2018:708654, 708771, 708849, 708712.
  - Photo: `Agregar Foto`. Web: drag-and-drop `Arrastra tu archivo aquí ó usa el explorador`, `Tamaño máximo de archivo 2MB`, hint `Procura que la foto capture sus manchas distintivas`, upload progress `25% completado`.
  - Datos Generales: `Raza*` (dropdown; auto = mother's breed per notes), `Potrero` (default `Potrero General`; notes say "Automático - vaquillas"), `ID control interno*`, `ID SINIIGA (opcional)`, `Fecha de nacimiento*`.
  - Datos adicionales opcionales: `Vaca Madre` (dam; dropdown; auto = calving cow), `Toro Padre` (sire; dropdown; auto = bull from the successful insemination/service), `Tamaño al nacer` (size at birth, `Centimetros`), `Peso al nacer` (birth weight, `Kilogramos`). Notes also list `Sexo` (sex), which has no field in the design.
  - Buttons: `Registrar Vaquilla` / `Omitir Paso` (skip).
- Result: profile Etapa `Recien Paridas`, Lactancia `Lactando`, `Fecha último Parto 15•Octubre•2019`, DIM 4, banner `Próximo celo entre los días 03 al 07 de Noviembre del 2019.` Bitácora `Reproducción | Parto exitoso retrasado|en tiempo|anticipado`. If the calf was skipped: `…, sin registro de vaquilla parida` with reminder `Registrar la vaquilla correspondiente` (M 2102:165479). Snackbar `Parto Registrado`.
- Step D, abortion (M 2072:176827 screenshot, 2072:178057, 2072:178855; W 2018:707371, 707614, 707862; same in ID05/ID07). Frames are mis-titled `Registro de celo` in ID05/ID07 mobile.
  - Copy: `Estás confirmando el parto de la vaca 0000X fue un aborto` / `¿Como sucedió el aborto?`.
  - `Causa del aborto` radio: `Natural` / `Inducido`.
    - Natural → dropdown `Selecciona la causa`: `Hormonal, Reabsorción embrionaria, Nutrición, Desconocido`.
    - Inducido → dropdown `Accidente` (default) plus non-natural causes `Intoxicación Nutricional, Virus, Bacteria, Tratamiento por enfermedad` and `Enfermedad`.
      - Accident → `Se diagnosticó un aborto inducido por accidente` + `Descripción` (editable placeholder).
      - Illness → `Se diagnosticó un aborto inducido por enfermedad` + `Enfermedad causa de aborto` (illness dropdown, required) + `Descripción` (placeholder `¿Qué enfermedad se diagnosticó que provocara el parto?`).
  - Button `Registrar Aborto`, disabled until `Causa del aborto` (and, for illness, `Enfermedad causa de aborto`) is selected.
  - Result: bitácora `Reproducción | 26/01/2020 | Aborto` (M 2072:177317, W 2018:706439), banner `Próximo celo entre los días 03 al 07 de Febrero del 2020.`; web Etapa `Recien Paridas`/`Lactando` (see 5).

### 1.16 ID03 web extras: Vacunación y desarrollo (web 03)
- W 2017:343262 / 343394 / 343515 / 343683. `Vacunación`: `Nombre vacuna`, `Dosis`, `Frecuencia` (e.g. `Rinotraqueítis Infecciosa Bovina (IBR) | 1 ml por Kg | Cada 6 meses`, `Diarrea viral bovina (DVR) | 0.5 ml por Kg | Cada 12 meses`, `Clostridios | 0.2 ml por Kg | 3 refuerzos uno cada 6 meses`, `Derriengue (Rábia paralítica bovina) | Aplicación única`). `Desarrollo`: `Último peso registrado`, `Próxima desparasitación`, `Historial de peso` (chart, Peso (Kg) by mm/aaaa), `Edad primera vacuna aplicada`, `Peso a primera inseminación`, `Peso al nacer`, `Frecuencia` (deworming, 90 días), `Edad primera desparasitación`. Out of my scope; listed only because it sits on the event pages.

---

## 2. Flow diagrams

**F1 Illness (ID01, cow 00001)**
1. Profile → tap `Salud +` → 1.1 select `Enfermedad` → `Continuar`.
2. 1.2 fill illness + treatment (defaults: today, Antibiótico, Inyección, 5 d, 5 d) → `Continuar`.
3. 1.3 optional Dieta/Potrero → `Continuar`/`Registrar cambios`.
4. Profile with sick banner. Web snackbar `Estado de Salud Registrado`. Bitácora `Mastitis diagnosticada`.
5. Bitácora row → detail (1.9) → `Seguimiento de tratamiento` (1.4).
6. `Tratamiento exitoso` → bitácora `Mastitis: Tratamiento exitoso`. Or `Cambio de tratamiento` → 1.5 → bitácora `Mastitis: Cambio de tratamiento`.

**F2 Stall change (ID01)**: Profile → Datos Generales → Potrero dropdown → confirm `Cambio de Potrero` → profile + bitácora `Cambio potrero de X a Y`.

**F3 Removal (ID01 web)**: `Baja de ganado` → intro → reason (required) → reason-specific confirm → success + finance waitlist CTA → cow list.

**F4 Accident / Diet / Medical treatment (ID03, cow 00003)**: `Salud +` → 1.1 → 1.6 | 1.7 | 1.8 → `Registrar` → profile + bitácora (`Accidente: …` / `Cambio de dieta` / `Tratamiento medico`). Accident → follow-up (web) → `-Cambio tratamiento-` | `-Tratamiento exitoso-`.

**F5 Heat (ID04, cow 00004)**: In the heat window the `Celo` switch is active → A `¿Quieres confirmar celo?`
- Not observed → G `No entró en celo` → log ①.
- Confirm → B `¿Celo limpio?`
  - Sí → C `¿La inseminaste?`
    - Sí → D form + bull → log ⑦ `Inseminación` → cow `Servida`.
    - No → F `¿Periodo de espera voluntario?`
      - Sí → log ② `Periodo de espera`.
      - No → warning → log ③ `No se inseminó`.
  - No → E `¿Se le dió tratamiento?`
    - Sí → treatment form → log ④ `Sucio, se medicó` (+ 5 d milk separation).
    - No → log ⑤ `Sucio, no se medicó`.
- Then: snackbar `Celo Registrado` and profile banner `Próximo celo…`.

**F6 Pregnancy (ID06, cow 00006)**: In the diagnosis window the `Preñada` switch is active → `¿Quieres confirmar su preñez?` → sí/no → `¿Qué método…?` (tacto/ultrasonido) → form.
- Success → `Concepción exitosa` + optional diet/potrero → `Gestante` + `Parto estimado…` + log `Gestación confirmada`.
- Failure → `Concepción no exitosa` (description required) → log `Gestación no confirmada` + `Próximo celo…`.
- Then: snackbar `Preñez Registrada`.

**F7 Calving (ID02 delayed / ID05 on time / ID07 early)**: In the expected-calving window the `Parto` switch is active → `¿Quieres registrar el parto?`
- Regresar → reminder modal.
- Sí → `¿El parto fue exitoso?`
  - Sí → calving form (+ optional diet/potrero) → calf registration (`Registrar Vaquilla` | `Omitir Paso` → log `…, sin registro de vaquilla parida` + reminder `Registrar la vaquilla correspondiente`) → profile `Recien Paridas`/`Lactando`/DIM reset/`Próximo celo…`.
  - No, abortó → `¿Como sucedió el aborto?` Natural (cause list) | Inducido (Accidente default, or illness + which) → `Registrar Aborto` → log `Aborto` + `Próximo celo…`.
- Then: snackbar `Parto Registrado`.

---

## 3. Domain notes

### 3.1 Entities and fields implied
- **Cow**: idControl (`ID control interno`, unique, hex-like incl. `ñ` and spaces), siniiga (optional, `MX-00-JAL(14)-0000-0000`, 4-8 digits, unique), birthDate, breed (`Holstein, Jersey, Simmental, Otras`), stall/potrero, photo, reproductiveStage, lactationState, lactationNumber (`# Lactancia`), lastCalvingDate, DIM (derived), isSick flag, sickSince (for `lleva 5 días enferma`), next-date banner (derived), status active/removed.
  - Developer field names visible in a note: `lactationCycle, reproductiveStage, lastChildBirth, pregnantDate, isPregnant, isInHeat, lastHeatDate`. "Si el evento es gestación: pregnantDate isPregnant → Se procede a calcular la fecha estimada del parto. Si el evento es gestación o inseminación: isInHeat lastHeatDate → Se procede a calcular la siguiente fecha de celo o de chequeo de inseminación."
- **Bull (Toro)**: name (unique; `Ingresa el nombre del toro`), idControl (unique), siniiga (optional; `Este número ya lo tiene otra toro`), birthDate (required to enable `registrar toro`). Linked to insemination/service events ("Monta tradicional" and AI both supported: "Registro del toro usado para preñar a la vaca, ya sea por inseminación o monta").
- **Calf (Vaquilla)**: breed (default dam's), potrero (default heifers), idControl, siniiga, birthDate (= calving date), damId, sireId, birthSizeCm, birthWeightKg, sex (notes only), photo (≤2MB).
- **Log event (Bitácora)**: id, cowId, category (`Tipo de registro`: Reproducción, Salud, Accidente, Vacuna/Vacunas, Nutrición; web header list adds Cambio Potrero, Urgencia Médica, Cambio Dieta, Baja, Tratamientos, Desarrollo, Alta, Otros/Varios), eventType/label, date, recordedBy (user), comments (≤160 on web edit), reminders[], optional treatment {type, presentation, durationDays, withdrawalDays}, optional diet change, optional stall change, deletable/editable flags.
- **Treatment**: type, presentation, startDate/diagnosisDate, durationDays, withdrawalDays (`Tiempo fuera de producción`), illness/accident reference, outcome (exitoso / cambio).
- **Heat record**: date, observed (bool), clean (bool), inseminated (bool), inVWP (bool), medicated (bool), bullId, description.
- **Pregnancy diagnosis**: date, method (tacto|ultrasonido), result (exitosa|no exitosa), description.
- **Calving**: date, timing (esperado|retrasado|anticipado; derived vs window), success (bool), abortion {kind natural|inducido, cause, illness?}, calfRegistered (bool).
- **Removal (Baja)**: reason (`corrección de error` = hard delete, `venta a rastro`, `venta a otro rancho`, `muerte/desecho`), date.

### 3.2 Enums
- Reproductive stage (`Etapa Reproductiva`) values seen: `Vaquillas` (heifers, group), `Recien Paridas` / `Recién paridas (menor a 45 días)` (fresh, <45 days post-calving), `Servida` (served/inseminated), `Gestante` (pregnant), `Secas (60 días antes de parto)` / `Secas o reto` (dry / transition). Dashboard herd distribution adds `Abiertas` (open) and `Con servicio` (served), plus `Preñadas`, `Enfermas`, `En desarrollo`.
- Lactation (`Estado de Lactancia`): `Lactando`, `Seca`.
- Stalls (`Stall_Menu`): `General, Alta producción, Secas o reto, Recién paridas, Enfermas`.
- Health event kinds: `Accidente, Enfermedad, Cambio de dieta, Tratamiento médico`. Web/notes add `Urgencia Médica` (e.g. `Envenenamiento diagnosticado`).
- Illnesses: `Mastitis, Brucelosis, Pulmonía, Cetosis, Tuberculosis, Cojera, Fiebre aftosa, Envenenamiento, Otro`.
- Treatment types (illness/accident/heat): `Antibiótico, Antiséptico, Antibacteriano, Antimicotico, Quirúrgico, Anti-inflamatorios, Corticoide, Antimicrobiano, Antiparasitario`. The corticoid sub-type is to be asked separately: `Betametasona (Mastitis), Dexametasona (Cetosis primaria), Cortisona, Prednisolona, Hidrocortisona`.
- Medical (non-illness) treatment types: `Sincronización hormonal para celo, Hormonas de crecimiento, Reducción de producción de leche, Vacunas, Otros`.
- Drug presentation: `En piel o tópico, Oral o tableta, Inyección`.
- Diet-change reasons: `Etapa reproductiva, Enfermedad, Tratamiento médico, Otra`.
- Heat outcomes (bitácora numbering ①-⑦): ① `no se confirmó`, ② `Periodo de espera`, ③ `No se inseminó`, ④ `Sucio, se medicó`, ⑤ `Sucio, no se medicó`, ⑦ `Inseminación`. ⑥ is unused or missing (see 5).
- Pregnancy method: `Tacto, Ultrasonido`. Result: `Concepción exitosa, Concepción no exitosa`.
- Calving result: `Parto exitoso esperado|en tiempo, retrasado, anticipado`, `Aborto`.
- Abortion natural causes: `Hormonal, Reabsorción embrionaria, Nutrición, Desconocido`. Induced causes: `Accidente, Enfermedad (¿Cuál?), Intoxicación Nutricional, Virus, Bacteria, Tratamiento por enfermedad`.
- Removal reasons: `Eliminación de registro del sistema (Corrección de error), Venta a rastro, Venta a otro rancho, Muerte (Registro de desecho)`.
- Snackbar kinds: Celo, Preñez, Parto, Estado de Salud, Evento eliminado, Error de conexión.

### 3.3 Business rules visible in copy
- **Windows, not dates**: every forecast is a range. `Próximo celo entre los días 03 al 07 …` (5-day window), `Confirma preñez entre los días 12 al 14 …` (3-day), `Parto estimado entre los días 22 al 25 …` (4-day). Event switches are enabled when "today" is inside the window ("está dentro de los días estimados para celo / diagnóstico de gestación").
- **DIM** = today - `Fecha último Parto` (all 4 samples are consistent with today = 15 Oct 2019). DIM keeps counting while the cow is dry (DIM 392 on a `Seca` cow) and resets on calving (DIM 4 after the 15 Oct calving). Note: "Considerar para el escenario de rancho de Carne cambiar el indicador de DIM por el de días abiertos" (for beef ranches show days open instead of DIM).
- **Dry-off**: "Secas (60 días antes de parto)" means the cow becomes Seca at expected calving - 60 days. No user event for drying off is designed, so it is implied automatic.
- **Fresh**: "Recién paridas (menor a 45 días)" means the stage lasts <45 days after calving. The first post-calving heat window is shown at calving + 19..23 days (15 Oct → 03-07 Nov), i.e. about 21 ± 2 days. A heat during the fresh period is handled as "periodo de espera voluntario" (VWP) and recorded without insemination.
- **Heat cycle**: the next heat after a non-insemination outcome uses the reminder `Esperar al siguiente ciclo para su observación` (wait for next cycle). The cycle length is not stated in the designs. The 21-day standard matches the 15 Oct → 3-7 Nov sample.
- **Gestation**: the length is not stated. The samples are mock data and inconsistent: confirm window 12-14 Oct 2020 → calving 12-14 Apr 2021 (= confirm + 182 d). Proposal: expected calving = service date + 283 d (±2 d window). **Needs product decision.**
- **Pregnancy check**: the interval after insemination is not stated. Notes call it "chequeo de inseminación" and "fecha estimada para diagnóstico de gestación". The abortion note implies diagnosis may be as late as 60 d ("diagnóstico de preñez tan tardío de 60 días").
- **Abortion definition**: "El aborto es definido como la pérdida del producto de la concepción a partir del periodo fetal (aprox. 42 días) hasta antes de los 260 días… La pérdida antes de los 42 días post concepción es denominado Muerte Embrionaria Temprana." So: loss at 42-259 d = aborto; <42 d = early embryonic death; ≥260 d counts as calving (early/premature).
- **Calving timing**: esperado = inside the window, retrasado = after it, anticipado = before it. The notes also say "Dentro / Fuera / Antes / Después de fecha esperada".
- **Milk withdrawal** ("Periodo de retiro ó tiempo fuera de ordeña para consumo humano"). Values are added after the last application ("Todos los tiempos son adicionales al periodo de tratamiento, desde la última fecha de aplicación"):
  | Treatment | Withdrawal |
  |---|---|
  | Corticoides | 21 días (264 hrs) |
  | Antibiótico | 2-10 días (u 8 ordeños) |
  | Antiséptico | 3 días |
  | Antibacteriano | 1-3 días (o 4 ordeñas) |
  | Antimicrobiano | 3-42 días |
  | Antiparasitario | 5-42 días (Ivermectina) |
  | Antimicótico | 3 días |
  | Quirúrgico | depends on diagnosis |
  | Sincronización celo | 2 días |
  | Tópicos | no restriction |
  - "para los casos que no pongan descripción, habrá que considerar el tiempo máximo" (with no description, use the maximum). The UI default is 5 días.
- **Milking-separation alerts**: "Escenarios para alerta de separación de ordeña: • Enfermedad - todas • Accidente - Solo tratamientos que afecten la ordeña • Tratamiento médico - idem Accidente". "De cualquier forma la vaca se tiene que ordeñar, es importante enviar las alertas para que se evite mezclar con la ordeña destinada a la venta" (the cow is still milked; the alert prevents mixing her milk into the sale tank).
- **Bitácora immutability**: "Eventos que no debe poder borrar el usuario: Alta en sistema, Reproducción (Celo, Preñez, Parto). Eventos que puede editar y borrar: Cambio Dieta, Baja, Urgencia Médica, Accidente, Enfermedad, Detección e inicio de tratamiento, Seguimiento tratamiento, Éxito/Fracaso del tratamiento, Cambió potrero/establo/corral." `Alta en sistema` is the automatic first event, with date and time.
- **Form defaults**: date fields default to today (calendar editable). Description fields are optional and show a hint placeholder when erased, except `Concepción no exitosa`, where it is required. Optional Dieta/Potrero checkboxes have no default, and their dropdown becomes required once checked.
- **Unsaved data**: "Al dar click en regresar, hay que considerar el mensaje de error, comunicando que se perderan todos los datos" (back = warn of data loss). The dialog is not designed.

### 3.4 Alerts / reminders scheduled per event
| Event | Profile banner after | `Recordatorios` (log) | Other alert |
|---|---|---|---|
| Illness | `Esta vaca se declaró enferma. Evita ordeñar para producción.` / `lleva N días enferma` | `Separar la vaca de producción por 5 días` (= withdrawal) | `Enfermas` counter, `Por tratar` (to treat) on dashboard |
| Treatment success | sick banner removed (implied) | none | none |
| Accident | sick banner | `Separar de producción por tratamiento` | none |
| Heat ① no heat | `Próximo celo…` (next cycle) | `Esperar al siguiente ciclo para su observación` | dashboard `Celos a confirmar` / `Vacas a seguir por celo - Para Seguimiento -` |
| Heat ② VWP / ③ not inseminated / ⑤ dirty no med | `Próximo celo…` | `Esperar al siguiente ciclo…` | none |
| Heat ④ dirty + med | `Próximo celo…` | `Separar la vaca de producción por 5 días` | milk separation |
| Heat ⑦ inseminated | `Confirma preñez entre…` | `Esperar al siguiente ciclo para su observación` (to watch for return to heat) | pregnancy-check alert ("Vaca por confirmar gestación - fecha estimada para diagnóstico de gestación") |
| Pregnancy + | `Parto estimado entre…` | none | dry-off at -60 d (implied), calving alert ("Vaca confirmada en gestación - fecha posible de parto"), dashboard `Siguentes partos entre:` |
| Pregnancy − | `Próximo celo…` | none | none |
| Calving | `Próximo celo…` | `Registrar la vaquilla correspondiente` if the calf was skipped | bell counter + tooltip "recordatorio de registro de vaquillas": a list of recently calved cows with calves pending, or a single cow |
| Abortion | `Próximo celo…` | none | none |
| Age-based | `Próximo evento según edad: Tratamiento antiabortivo` | none | none |
- Note text `Sistema ya no envía alertas` (system stops sending alerts) appears beside `Registro celo no observado` / `Registro confirmación celo observado` with a `día 1…día 6` timeline on web 01. Reading: once a heat is confirmed or marked not observed, the window's alerts stop. The timeline duration is not given.

### 3.5 What each event changes on the cow
| Event | reproductiveStage | lactation | other fields |
|---|---|---|---|
| Heat ⑦ inseminated | → Servida (Con servicio) | unchanged | lastHeatDate, isInHeat, bull, serviceDate → pregnancy-check window |
| Heat ①②③④⑤ | unchanged (Abierta / Recién parida) | unchanged | lastHeatDate (②-⑤), next heat window = +cycle |
| Pregnancy + | → Gestante | unchanged | pregnantDate, isPregnant=true, expected calving window; optional diet/potrero |
| Pregnancy − | → Abierta | unchanged | isPregnant=false, next heat window |
| (auto) dry-off | → Seca | → Seca | at expected calving - 60 d |
| Calving success | → Recién parida | → Lactando | lastCalvingDate, # Lactancia +1, DIM reset, next heat window, new calf record, optional diet/potrero |
| Abortion | → Abierta / Recién parida (web shows Recien Paridas + Lactando) | unclear | pregnancy cleared, next heat window |
| Illness / accident | unchanged | flagged "do not milk for production" | isSick, sickSince, treatment, withdrawal end date, optional diet/potrero |
| Diet change | unchanged | unchanged | diet |
| Stall change | unchanged | unchanged | potrero |
| Baja | → removed | none | reason; hard delete if correction |

### 3.6 Predefined illness descriptions (web)
- Mastitis: example `La vaca se inflamó la ubre`.
- Brucelosis: `Es una enfermedad infectocontagiosa, producida por una bactéria.`
- Pulmonía: `Infección de uno o ambos pulmones, causada por bactérias, vísus u hongos`.
- Cetosis: `Alteración del metabolismo de los carbohidratos`.
- Tuberculosis: `Enfermedad crónica provocada por la bactéria Mycobacterium bovis`.
- Cojera: `Afección en la capacidad de movimiento del bovino.`
- Fiebre aftosa: `Enfermedad vírica grave, muy contagiosa, caracterisada por fiebre y úlceras en forma de ampollas en la lengua`.
- Envenenamiento: `Ingesta de alguna sustancia daniña`.
- Otro: `Proporciona una breve descripción, por favor...`

### 3.7 Cow reproductive state machine

The states and transitions below come from the designs. Dates marked *proposal* are not in Figma.

**States**
| State (UI label) | Meaning | Entry |
|---|---|---|
| `VAQUILLA` (Vaquillas) | heifer, never calved | calf registration / onboarding |
| `RECIEN_PARIDA` (Recien Paridas, <45 d) | fresh cow inside the voluntary waiting period (VWP) | calving |
| `ABIERTA` (Abiertas) | open: eligible to breed, not served | VWP ends (45 d) / heat outcome without service / pregnancy − / abortion |
| `SERVIDA` (Servida / Con servicio) | inseminated or naturally served, awaiting diagnosis | heat ⑦ |
| `GESTANTE` (Gestante / Preñadas) | confirmed pregnant | pregnancy + |
| `SECA` (Secas, 60 d antes de parto) | pregnant and dried off | expected calving - 60 d (auto) |
| `BAJA` | removed (terminal) | Baja event from any state |
Orthogonal flags: lactation (`Lactando`/`Seca`), health (`Enferma` + withdrawal end), `En desarrollo` (heifer growth group).

**Transitions**
```
VAQUILLA     --heat ⑦ inseminated-------------------> SERVIDA
VAQUILLA     --heat ①②③④⑤----------------------------> VAQUILLA     (next heat +21d)
RECIEN_PARIDA--heat ② (VWP) / ①④⑤--------------------> RECIEN_PARIDA (next heat +21d)
RECIEN_PARIDA--day 45 after calving (auto)-----------> ABIERTA
RECIEN_PARIDA--heat ⑦ inseminated--------------------> SERVIDA      (allowed; no block designed)
ABIERTA      --heat ⑦ inseminated--------------------> SERVIDA
ABIERTA      --heat ①③④⑤-----------------------------> ABIERTA      (next heat +21d)
SERVIDA      --pregnancy diagnosis + (tacto|ultrasonido)-> GESTANTE  (expected calving window)
SERVIDA      --pregnancy diagnosis −------------------> ABIERTA      (next heat window)
SERVIDA      --return to heat (heat event)-------------> handled as heat from ABIERTA (implied, not designed)
GESTANTE     --expected calving - 60 d (auto)----------> SECA (lactation -> Seca)
GESTANTE|SECA--calving success (esperado|retrasado|anticipado)-> RECIEN_PARIDA (lactation -> Lactando, #lact+1, DIM=0, calf)
GESTANTE|SECA--abortion (natural|inducido)------------> ABIERTA      (web shows Recien Paridas; see open questions)
any          --baja-----------------------------------> BAJA
```

**Computed dates**
| Date | Formula | Source |
|---|---|---|
| DIM | today - lastCalvingDate | 4 consistent samples |
| Fresh/VWP end | lastCalvingDate + 45 d | "Recién paridas (menor a 45 días)" |
| Next heat window (post-calving) | lastCalvingDate + 19..23 d | 15 Oct → 03-07 Nov 2019 |
| Next heat window (after heat outcome without pregnancy) | lastHeatDate + 21 d ± 2 (*proposal*; "siguiente ciclo") | copy only |
| Next heat after negative diagnosis / abortion | eventDate + ~8-12 d per mock (26 Jan → 3-7 Feb); *proposal*: last heat + 21 d cycles | mock inconsistent |
| Pregnancy check window | serviceDate + N d (N undefined; *proposal* 30-45 d, ultrasound ≥28 d, palpation ≥35-45 d) | not in design |
| Expected calving window | serviceDate + 283 d ± 2 (*proposal*; brief's assumption) | not in design; mock 4-day window |
| Dry-off date | expected calving - 60 d | "Secas (60 días antes de parto)" |
| Calving timing class | compare calving date to expected window | copy |
| Abortion vs early embryonic death vs calving | days since conception: <42 EED, 42-259 aborto, ≥260 parto | biology note |
| Milk withdrawal end | last application date (start + duration) + withdrawal days | withdrawal note |
| Sick-days counter | today - diagnosis date (`lleva 5 días enferma`) | web banner |

---

## 4. Shared components seen
`Bell_icon`, `Avatar`, `Menu Rancho` (ranch selector `Nombre del Rancho`), `left arrow`/`right arrow`, `Icon_Cow_Adult`, `Icon_KPI_Event`, `Icono Cows in Heat 1`, `Icono Pregnant cows 1`, `Icono Calf 1`, `Icono Sick Cows 1`, `Switch Deactivated` / `Switch Off` / `Switch On`, `Button_Add`, `Button_edit_icon`, `Garbage 1`, `Boton 40h` / `Boton 40h Deactivated` (primary CTA), `Boton Regresar`, `Boton Text On` / `Boton Text Off` (radio pill option), `Steper Bar 1/2|1/3|1/4|1/5 card top`, `Dropdown Mediano`, `Dropdown Medium deactivated`, `Dropdown Chico`, `Dropdown Nano`, `Textbox Mediano`, `Checkbox-On` / `Checkbox-Off`, `Icon_Medical_Event`, `Icon_Vaccine`, `Icon_Pencil`, `Scroll 3`, `Pagination_big`, `add 2`, `Header Table_Mobile`, `Component_Table_Mobile`, `Boton agregar foto`, `ImageIcon`, `Boton Omitir Paso`, `Boton Vaquilla-On`, `Positive_Confirmation_Snackbar`, `delete` (close icon), `Grid/Mobile_Smartbell_Official`, bottom nav (`VACAS, GRUPOS, HISTORIAL, REPORTES, ALERTAS`, with `Stall`, `Report_Icon`, `Alerts_Icon`). Web heat buttons have states `Default, Innactive, Alert coming, Alert confirmed`, plus `Bell_icon_plain` and `Green_Mark_plain`.

---

## 5. Open questions / inconsistencies
1. **Gestation and check intervals are undefined.** No frame states 283 d, the pregnancy-check delay, or the heat cycle length. Mock dates contradict each other: 00006 is `Servida` with the banner `Parto estimado 01-04 sep 2020` before diagnosis; confirm in Oct 2020 → calving Apr 2021; mobile 00002 shows calving `09-12 Octubre 2019` but the web shows `22-25 Octubre 2019`.
2. **Post-abortion state**: web frames show `Recien Paridas` + `Lactando`, `Fecha último Parto` = abortion date and DIM 4, i.e. abortion is treated like a calving. Decide whether an abortion starts a lactation (common if ≥ ~150 d gestation) or returns the cow to Abierta.
3. **Negative pregnancy result frame** (W 2017:521909) still shows `Gestante`. This is likely a copy-paste error; it should be Abierta.
4. **Abierta state** appears only in dashboard counters (`Abiertas`, `Con servicio`), never as a profile Etapa. Confirm the stage list: Vaquilla, Recién parida, Abierta, Servida, Gestante, Seca.
5. **No dry-off event**: is Seca automatic at -60 d, or should the user confirm it? Stall `Secas o reto` suggests a stall change is also expected.
6. **Heat numbering ①-⑦** skips ⑥. Also "Reproducción" events are declared non-deletable, but the detail cards show `Editar`/`Eliminar` for them.
7. **Mobile has no confirmation snackbars**. Web defines 4 event snackbars plus delete and error ones. Are they needed on mobile?
8. **Copy bugs**:
   - ID02 mobile `Cambios por enfermedad:` should be `Cambios por parto:`.
   - ID05/ID07 mobile modal titles say `Registro de celo` for calving.
   - Heat/pregnancy forms label the date `Fecha inicio dieta` instead of `Fecha diagnóstico`.
   - Typos: `Diagnpóstico`, `Conepción`, `labor de dentro de la fecha`, `diagnòstico`, `mèdico`.
   - Web 03 dropdown frames named `Diet Changes` list the medical-treatment options.
9. **Dirty heat with medication**: mobile collects treatment fields (M 2149:342); web only has the description form. Align.
10. **Accident treatment default**: one web note says `Antibiótico` default, another says "Tipo de tratamiento: Sin default".
11. **Pregnancy method choice and calving "¿El parto fue exitoso?" option labels** live inside instances (not screenshotted). Labels here come from the annotation notes.
12. **Insemination during VWP** is not blocked. The flow only asks "¿Se encuentra en periodo de espera voluntario?" when the user did not inseminate. Should the app auto-detect VWP from DIM < 45 instead of asking?
13. **Calf sex** is in the notes but has no field. Heifer-only wording (`vaquilla`) suggests male calves are not handled.
14. **Withdrawal default**: the UI defaults to 5 d, but the notes require per-treatment reference values and the maximum when no description is given. Decide which one wins.
15. **Treatment duration** and `Tiempo fuera de producción` are "editable y dropdown" (combo box). The min/max are unspecified.
16. **Back-navigation data-loss dialog**, edit-event screens on mobile, and loading states are not designed.
17. **Return to heat while Servida** (no pregnancy diagnosis yet) has no flow. Presumably a new heat event implies a negative pregnancy.
