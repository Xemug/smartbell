# v4 inventory: animal registration (all scenarios), new animal profile, diet change

Source: Figma **Smartbell - 4.0** (fileKey `hmrArjwi6iI4cOlPkR5hQD`), page `0:1` "Nuevo flujo y formularios".
This file is newer than the files behind `mobile-core.md`, `web-onboarding-registry.md` and `event-flows.md`.
Link format: `https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=<id with - >`. Abbreviated below as `[id]`.

Method: text from the saved page XML (all text layers, hidden layers excluded) plus 21 screenshots.
Screenshots checked: 2955:9420, 2955:8971, 2913:12490, 21:2006, 304:1108, 303:2429, 303:2686, 304:1426, 303:2217, 315:1252, 734:8721, 734:7763, 4000:10263, 4048:10361, 3845:9789, 3441:11153, 3850:10981, 4027:10314, 2908:8983, 2904:9172.

**Two design generations sit side by side on this page. Read them in this order:**
1. **2023 "Móvil mejorado" sections** (21:818, 315:1213, 734:6074): one form per kind (Vaca, Vaquilla). Parents are captured on a second screen. Older bottom nav in places (VACAS/GRUPOS/HISTORIAL/REPORTES/ALERTAS).
2. **2024–25 "Formularios alta animales nuevos"** (2955:9420, 2955:8971, 2951:8750, 2913:12490): one unified **"Primer animal" form**. It has a **Macho/Hembra** toggle, progressive disclosure ("Tengo más/menos datos de mi animal"), **Nivel de cruza + Raza de aporte**, and **Etapa de desarrollo**. This is the latest registration design and supersedes (1).
3. **"Nuevo perfil de animal 2025"** (3845:9789), including the **MVP profile** (4000:10263 / 4048:10361), which is the latest profile.

Group 219 (3074:10657) children, all of them:

| Node | Name | Kind | Covered in |
|---|---|---|---|
| 1:146 | Sign up | web 1366 | §1.12 |
| 5:434 | Felicidades | web | §1.12 |
| 5:695 | Cuantas Vacas | web | §1.12 |
| 5:847 | Primera vaca | web | §1.12 |
| 5:963 | Exito estimado | web | §1.12 |
| 21:818 | Registro vaquillas - Móvil mejorado | section | §1.2–1.6, 1.9 (contains old profile 796:6297, dashboards 2904:8731/9613) |
| 315:1213 | Registro vacas - Móvil mejorado | section | §1.2–1.7 (contains 795:5959 profile, 2904:9172 dashboard, 2908:8983 list, 2913:10041) |
| 315:1902 | Registro Vaquilla - Formulario Madre con Datos (loose frame, "Vaca" chip) | frame | §1.4 |
| 734:6074 | Ejemplo de Registro vacas raza mixta - FB, F1, F2, F3, F4 | section | §1.8 |
| 417:2212 | Empty_Dashboard | web | §1.12 |
| 417:3240 | text "Futuro" (future) | label | marks the web Empty_Dashboard / avatar menu area as future |
| 805:5447 | Menu desplegable desde avatar | section | §1.12 |

---

## 1. Screens

### 1.1 Unified new-animal form "Primer animal" (LATEST registration design)
- Frames:
  - [2955-8971](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-8971) is the full form for a female with repro data (360×1370).
  - Inside section [2955-9420](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-9420) "Formularios alta animales nuevos":
    - [2955-7996](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-7996): variant without "Información reproductiva" (male, or non-adult female).
    - [2955-8423](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-8423): variant with "Información reproductiva".
    - Option lists 2955:8949 (Nivel de cruza), 2955:8897 (Etapa de desarrollo - Hembras), 2955:8914 (Etapa de desarrollo - Machos), and English helper lists 2955:9421/9422.
    - A hidden label "MVP 2da etapa" (3133:9284, MVP phase 2) sits in the section, which suggests some of this is phase 2 (see §5).
- Purpose: register any animal (cow, heifer, calf, bull, steer) from one form. Sex plus development stage replace the old Vaca/Vaquilla/Toro kind tiles.
- Header:
  - App header: bell, ranch switcher "Nombre del Rancho", avatar with a badge.
  - Month strip "Mayo-2024 ▴" with a collapsible date picker (hidden calendar grid; it belongs to the Tareas shell, not the form).
- **Sexo toggle**: two pill buttons, **Macho** (male, blue, cow icon) and **Hembra** (female, pink). Radio, single choice.

**Información general** (general information)

| Label (es) | Gloss | Type | Req | Default / format |
|---|---|---|---|---|
| Nombre o Número interno * | name or internal number | text | **yes** (red *) | placeholder "123" |
| Raza | breed | dropdown | no | "Holstein" (placeholder/default) |
| Fecha nacimiento * | birth date | date | **yes** | YYYY-MM-DD |
| Potrero | paddock/group | dropdown | no | "General" |

- Button **Tengo menos datos de mi animal** (I have less data on my animal) collapses the form to the quick form (§1.10).

**Información adicional** (additional information)

| Label | Gloss | Type | Req | Options |
|---|---|---|---|---|
| Nivel de cruza | crossbreed level | dropdown (half width) | no | FB (100% Pura) [default], F4 (93.5% 15/16), F3 (87.5% 7/8), F2 (75% 3/4), F1 (50% - 1/2) |
| Raza de aporte | contributing breed (the other breed in the cross) | dropdown (half width) | no (only meaningful when level ≠ FB) | sample "Symental" [sic] |
| Etapa de desarrollo | development stage | dropdown | no | placeholder "Ninguno". Options differ by sex, see below |
| ID SINIIGA (no obligatorio) | national ear-tag ID (not required) | text | no | "12345678990". The layer is hidden in 2955:7996 and 2955:8423 and shown in 2955:8971 text |
| **Padre** / **Madre** | sire / dam | two outline buttons | no | open the parent search/register forms (§1.4/§1.5) |

Etapa de desarrollo, **Hembras** (2955:8897):

| Option (es) | Gloss | EN helper (2955:9422) |
|---|---|---|
| Definir automáticamente ( nacimiento) | set automatically (from birth date) | – |
| Vaca adulta (Más de 27 meses) | adult cow (>27 months) | Adult cow |
| Ternera (Recién nacida hasta 6 meses) | female calf (newborn to 6 months) | Veal [sic, calf] |
| Destetada (aprox. 6-8 meses) | weaned (about 6–8 months) | weaned |
| Novilla (12 meses) | heifer (12 months) | heifer |
| Cargada (Cualquier vaca preñada) | in calf (any pregnant cow) | charged [sic, in-calf] |
| Vaca adulta vacía (Más de 27 meses) | adult open/empty cow (>27 months) | Adult empty |
| A verificar (Por confirmar preñez) | to verify (pregnancy to be confirmed) | to check |

Etapa de desarrollo, **Machos** (2955:8914):

| Option | Gloss | EN helper (2955:9421) |
|---|---|---|
| Definir automáticamente ( nacimiento) | auto from birth date | – |
| Becerro (recién nacido) | male calf (newborn) | calf |
| Novillo/Ternero (9-24 meses) | steer / young male (9–24 months) | steer |
| Toro (20-24 meses) | bull (20–24 months) | bull |
| Destetado (3-4meses) | weaned (3–4 months) | weaned off |

**Información reproductiva** (reproductive information; shown only in the 2955:8423 / 2955:8971 variants)

| Label | Gloss | Type | Default |
|---|---|---|---|
| Último parto | last calving | date | YYYY-MM-DD |
| Ciclo de lactancia | lactation number | number | "1" |
| Etapa reproductiva | reproductive stage | dropdown | "Ninguna" (none). Options not drawn |
| Fecha etapa reproductiva | date of that reproductive stage | date | YYYY-MM-DD. One generic date replaces the old "Fecha último celo" / "Fecha diagnóstico" |

**Pesos del animal** (animal weights): Al Nacer / Destete / Al año (at birth / weaning / one year), 3 number fields, "0.00" (kg implied).

- Actions:
  - **Registrar** (register; green, looks disabled until the required fields are filled).
  - Bottom nav: Tareas / Vacas / Grupos / Reportes / Ranchos.
- States: empty only. No error state is drawn for this form; reuse §1.2's error state.
- Conditional logic (inferred from the variants):
  - Información reproductiva appears for **Hembra** only, and likely only when the stage is adult/Cargada/Vacía/A verificar. The short variant 2955:7996 sits next to the Machos stage list.
  - Raza de aporte is relevant only when Nivel de cruza ≠ FB.
  - The Etapa de desarrollo options switch with the sex.
  - "Definir automáticamente" derives the stage from the birth date.

### 1.2 Cow form, 2023 "Registro Vaca" (superseded by 1.1)
- Frames:
  - [315-1252](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=315-1252) empty.
  - [2905-7938](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2905-7938) error.
  - [315-1345](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=315-1345) filled ("Mi primera vaca", 2016-05-23, último parto 2023-02-23).
- Top row: "← Inicio" (back to home) plus a kind chip **Vaca** (icon + label; it toggles to **vaquilla**).
- Información general:
  - Nombre o Número interno (text)
  - Raza (Holstein)
  - Fecha nacimiento
  - Potrero (General)
  - Ciclo de lactancia ("1") | Último parto (YYYY-MM-DD), side by side
  - Estapa [sic] reproductiva ("Ninguno") | ID SINIIGA ("12345678990"), side by side
- Pesos del animal: Al Nacer / Destete / Al año.
- Actions:
  - **Agregar datos de los padres** (add parents' data; outline) opens §1.3.
  - **Registrar** (register).
- Error state (2905:7938): inline "Este campo es obligatorio" (this field is required) under the name, plus a toast "Por favor, llena los datos solicitados" (please fill in the requested data).

### 1.3 Parents entry, "Registro Vaquilla - entrada para registro padres" (2023)
- Heifer: [303-1329](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=303-1329) empty; 304:901 mother done; 304:1000 father done; [304-1108](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=304-1108) both.
- Cow: 315:1538 / 315:1598 / 315:1664 / 315:1730.
- Mixed: 734:6381 / 6441 / 6507 / 6573.
- Header "← Información general" + kind chip. Section "Datos de los padres" (parents' data).
- Fields (button-like boxes):
  - **Vaca madre** (dam): once set, shows "Vaca madre: {Vaca ID}".
  - **Datos del Toro padre** (sire data): once set, shows "Toro padre: {Toro ID}".
- Success snackbars (green, ✕):
  - "Felicidades, la vaca {Vaca ID} quedó registrada exitosamente" (cow registered).
  - "Felicidades, el toro {Toro ID} quedó registrado exitosamente" (bull registered).
- Action: **Registrar**.

### 1.4 Dam form, "Formulario Madre" (search or register the mother)
- Frames:
  - [303-1437](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=303-1437) empty.
  - [303-2810](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=303-2810) and [315-1902](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=315-1902) "con Datos" (typed manually: Vacalactica, Secas, 2017-05-23, lact 3, parto 2022-08-20, SINIIGA 1009054568).
  - [303-2429](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=303-2429) search hit "Carola 004" autofills every field.
  - Cow versions 315:1803 / 315:2001; mixed versions 734:6646 / 6745 / 6844.
- Header "← Datos de los padres" + kind chip. Title "Datos de la Vaca Madre".
- **Buscar** (search): text with a magnifier, placeholder "Ingresa el ID de la madre" (enter the dam's ID). A match fills the form below.
- "**O registra la información de la madre**" (or register the dam's information) shows the same fields as the cow form:
  - Nombre o Número interno
  - Raza (mixed: Raza original + Nivel de cruza)
  - Potrero
  - Fecha nacimiento
  - Ciclo de lactancia | Último parto
  - Estapa reproductiva | ID SINIIGA
  - Pesos (Al Nacer / Destete / Al año)
- Action: **Registrar**. It returns to §1.3 with the snackbar "la vaca {Vaca ID} quedó registrada".
- Rule implied: the dam can be an existing animal (lookup by ID) or a new full cow record created inline. The mother becomes a full Animal, not just a text reference.

### 1.5 Sire form, "Formulario Padre"
- Frames:
  - [303-1674](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=303-1674) empty.
  - 303:2909 "con Datos".
  - [303-2686](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=303-2686) search hit "Pajarito".
  - Cow versions 315:2100 / 2190 / 2280; mixed versions 734:6943 / 7033 / 7123.
- Title "Datos del Toro Padre".
  - Buscar: "Ingresa el ID del padre".
  - "O registra la información del padre":
    - Nombre o Número interno
    - Fecha nacimiento
    - Raza (Holstein)
    - ID SINIIGA
  - A hidden "Estapa reproductiva / Ninguno" field (303:1717) was removed for bulls.
- Mixed-breed version (734:6943) splits the identifier: **Raza original**, **Nombre** ("Venancio"), **ID Interno** ("123"), Fecha nacimiento, ID SINIIGA.
- Action: **Registrar**. Snackbar "el toro {Toro ID} quedó registrado".

### 1.6 Heifer form, 2023 "Registro Vaquilla"
- Frames:
  - [21-2006](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=21-2006) empty.
  - 303:2088 filled (Vacalactica002, 2022-05-23, altura 80).
  - 303:1940 error ("Este campo es obligatorio" + toast "Por favor, llena los datos solicitados").
- Visible fields:
  - Nombre o Número interno
  - Raza
  - Fecha nacimiento
  - **Altura al nacer (cm)** (height at birth)
  - Pesos del animal (Al Nacer / Destete / Al año)
- Hidden in the heifer form: Estapa reproductiva and ID SINIIGA (layers 303:1667 / 29:1092 hidden). Heifers do not ask for SINIIGA or repro stage.
- Actions: **Agregar datos de los padres** → §1.3; **Registrar**.

### 1.7 Dam status modal, "Estatus vaca madre"
- Frames:
  - [304-1426](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=304-1426) open dropdown; 304:1211 closed.
  - Cow section 315:2702 / 315:2803; mixed 734:7552 / 7653.
- The underlying screen is a read-only "Información general" summary of the new heifer:
  - Raza
  - ID Interno
  - Fecha nacimiento
  - Estapa reproductiva
  - ID SINIIGA
  - Altura al nacer (cm)
  - Peso al nacer (Kg)
- Modal "**Estatus vaca madre**" / "Registra el estatus de la madre" (register the dam's status). Dropdown, default "Viva en producción":
  - Viva en producción (alive, in production)
  - Muerta (Desecho) (dead / culled)
  - Vendida a otro rancho (sold to another ranch)
  - Vendida al rastro (sold to slaughter)
  - The cow-section copy repeats "Vendida al rastro" twice: a typo.
- Purpose: when the dam is entered for lineage only, record whether she is still on the ranch. Statuses other than "Viva" map to a removal (Baja) of the dam record.

### 1.8 Mixed-breed registration example "raza mixta - FB, F1, F2, F3, F4" (section 734:6074)
- Frames:
  - 734:6113 empty FB; 734:6197 filled FB.
  - [734-8721](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=734-8721) F1 with extra breed.
  - 734:6288 heifer error.
  - Option list [779-5139](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=779-5139).
  - Heifer profile [734-7763](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=734-7763) with breed chip 734:7773 "HOLSTEIN FB(100%)".
  - Also an instance `Notas` (734:8867) and `Numero nota` (734:8874): annotation badges.
- Breed capture:

| Label | Gloss | Type | Options |
|---|---|---|---|
| Raza original | base/original breed | dropdown (half) | Holstein |
| Nivel de cruza ⓘ | crossbreed level (info tooltip) | dropdown (half) | FB (100%), F4 (93.5%), F3 (87.5%), F2 (75%), F1 (50%) |
| Raza F1 | the other parent breed of the cross | dropdown (full width) | "Symental". **Appears only when level ≠ FB** (734:8721) |

- The rest of the cow form is unchanged (Potrero, Ciclo de lactancia | Último parto, Estapa reproductiva | ID SINIIGA, Pesos, Agregar datos de los padres, Registrar).
- The dam form uses Raza original + Nivel de cruza. The sire form uses Raza original only.
- Display in the profile: "HOLSTEIN FB(100%)" (old) → "Raza Holstein / Cruza Pardo Suizo F1 (50%)" (MVP 2025).
- In 1.1 this was renamed to **Nivel de cruza + Raza de aporte** and the fractions were added (15/16, 7/8, 3/4, 1/2).

### 1.9 Success modal (2023)
- Frames:
  - [303-2217](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=303-2217) heifer.
  - 315:2561 (in the cow section, still "vaquilla").
  - 734:7309.
- Copy: dancing-cow illustration, "**Felicidades!!!** acabas de agregar la vaquilla --{ID} --" (congrats, you just added heifer {ID}).
- Button **Continuar** (continue).
- The background is the read-only summary from §1.7.

### 1.10 Quick add, "Primera vaca" (progressive disclosure)
- Frames:
  - [2913-12490](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2913-12490) in-app, with header and nav.
  - [2951-8750](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-8750) onboarding: Smartbell logo, title "**Registra tu primera vaca**" (register your first cow), no nav; the sex toggle is hidden.
- Visible: Macho/Hembra, then Información general:
  - Nombre o Número interno *
  - Raza
  - Fecha nacimiento *
  - Potrero
- Hidden in the quick form: Estapa reproductiva, ID SINIIGA, Pesos.
- Actions:
  - **Tengo más datos de mi animal** (I have more data on my animal; dark blue) expands to the full form §1.1.
  - **Registrar**.
- This is the only "quick add". **No bulk/multi-animal import screen exists** in this file.

### 1.11 Animal profile, 2024–2025 (section 3845:9789; older copy 796:6297 in 21:818; 795:5959 in 315:1213)

#### 1.11a Profile "Perfi animal - nuevo" (pre-MVP)
- Frames:
  - [3845-9790](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3845-9790) Datos Generales.
  - [3845-9899](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3845-9899) Datos de los Padres.
  - 3845:10689 annotated copy.
  - The older 734:7763 / 795:5959 / 794:5149 / 809:5418 match.
- Header: back + "Vaca ID 00001" with a kind icon (old: "Perfil de animal" title + "00001" tile + "vaca" icon).
- Banner: "**Celo estimado entre los días 12 al 18 de febrero de 2024**" (estimated heat between days 12 and 18 of February 2024): a 7-day window.
- Photo placeholder with a pencil (edit photo).
- **Grupo general** dropdown: group/potrero change inline.
- Event buttons: **Celo** (heat, pink), **Preñada** (pregnant), **Parto** (calving), **Salud** (health, green).
  - The 2025 frames show only Celo + Salud.
  - The older frame (734:7763) shows all four.
- Tabs:
  - **Datos Generales**: Raza HOLSTEIN · **Días abiertos** 74 · Nacimiento "11 de mayo de 2016" · **Días en leche DEL** 74 · Último parto "5 de feb. de 2024" · Ciclo de lactancia 4 · ID SINIIGA "MX-14-0977-2345" (old: "N/A" when empty).
  - **Datos de los Padres**: Padre "No hay registro" + button **Agregar padre** (add sire); Madre "Vaca {IID}" + button **Ver perfil** (view the dam's profile).
- Actions: **Eliminar** (delete, pink) and **Registros** (records). The old version had "Ver bitácora".

#### 1.11b Records, "Registros" (pre-MVP)
- [3845-10009](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3845-10009) Historial:
  - Tabs **Ciclo actual / Salud / Historial / Peso** (current cycle / health / history / weight).
  - Historial table Tipo | Fecha | Evento, e.g. "Parto | 2024-02-05 | Parto exitoso" (successful calving).
- [3845-10073](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3845-10073) Peso:
  - Peso | Fecha list (450 kg 2024-02-05; 400 kg 2024-02-05; 350 kg 2017-05-11; 80 kg 2016-05-11), each with a 🗑.
  - Button **Actualizar peso** (update weight).
- Footer on both: Eliminar + **Datos generales** (back to the profile).

#### 1.11c Records v2, "Registros Vaca ID 00001"
- [3850-10981](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3850-10981), tab **Producción** (milk production):
  - "Intervalo de registro de producción de leche" (milk-recording interval): dropdown "Seleccionar...".
  - Line/area chart: y "Producción diaria de leche" (daily milk production), x "Time Period", series [1] / [Becerras] / [Antibióticos].
  - Sub-tabs **Tanque / Becerras / Antibióticos**: milk destination (bulk tank / fed to calves / discarded under antibiotic withdrawal).
  - Table Peso [sic, should be Litros] | Fecha | Acciones: "20 lt | 2024-02-05 | 🗑 ✎".
  - Button **Registrar producción** (record production).
- [3850-10850](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3850-10850), tab **Peso**:
  - Summary Al nacer 45kg / Al destete 80kg / Al año 160kg.
  - Table Peso | Fecha | Acciones (350 Kg 2024-02-05 🗑 ✎).
  - Button **Actualizar peso**.

#### 1.11d Diet history, "Historial cambios en dieta"
- Frame: [4027-10314](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=4027-10314).
- Card "**Último cambio de dieta**" (latest diet change):
  - Tipo de dieta: Materia Seca (diet type: dry matter)
  - Fecha de inicio: 2024-02-05
  - Costo diario: $45.00 (daily cost)
  - Cantidad diaria: 10kg (daily amount)
- Table Tipo | Kg | Costo | Fecha (+🗑 per row), e.g. Materia Seca | 10kg | $45.00 | 24/10/25 ×5.
- Button **Registrar cambio de dieta** (record diet change). The form behind it is not drawn in this file.

#### 1.11e MVP profile, "Perfi animal - nuevo - MVP" (LATEST profile)
- Lactating cow: [4000-10263](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=4000-10263).
  - Header: back arrow + "Vaca **ID 00001**".
  - The bottom nav is hidden (full-screen detail).
  - Large photo with ✎ (edit). Overlay chips **Raza** Holstein / **Cruza** Pardo Suizo F1 (50%).
  - Banner layer "Celo estimado entre los días 12 al 18 de Septiembre de 2025" plus a "Grupo general" layer exist in the XML. They are not visible in the screenshot (covered or offscreen).
  - KPI tiles: **Peso** 350 Kg · **DEL** 190 días · **Lts promedio** 18 lt /día (average liters/day).
  - Cards, each with "Consultar …":
    - **Genealogía** (genealogy): Padre {Toro ID} / Madre {Vaca ID}; "Consultar árbol" (view tree).
    - **Dieta**: Tipo de dieta "Materia Seca"; "Consultar historial" → 1.11d.
    - **Reproducción**: Último parto "Jun/18/2025"; "Consultar historial".
    - **Salud**: Estado "Saludable" (healthy); "Consultar historial".
  - Actions: **Eliminar** (pink, trash) and **Registros** (blue) → 1.11c.
- Non-lactating variant (heifer, dry or beef?): [4048-10361](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=4048-10361).
  - Tiles **Peso / Fecha** (350 Kg, dd/mm/aaaa) and **Peso al nacer** 45 Kg replace DEL and Lts.
  - The Reproducción card shows "**Última monta / Inseminación**" (last natural service / insemination) Jun/18/2025.
  - Same photo; the chips show the same Holstein + F1 sample.

#### 1.11f "Valuable Insights to the farmer" (annotations on 3845:10689)
Arrowed notes from fields of the pre-MVP Datos Generales tab:

| Anchor (approx., from the arrows) | Note (verbatim) | Meaning |
|---|---|---|
| Días abiertos | "Number of inseminations + Average # inseminations per cycle" | Show services count this lactation and the herd/cycle average next to days open |
| Photo / profile block | "Considering making this a floating item" | Floating action/summary |
| Nacimiento | "Age + DOB + % cows in that age" | Show age and DOB, plus the share of the herd in the same age band |
| Último parto | "Age + DOB + % cows in that age" (duplicate note) | Same note pointed at a second field |
| DEL / Ciclo de lactancia | "Consider clustering together + Highest day in the cycle (day # + lts)" | Group DIM with lactation number; show peak-yield day (DIM and liters) |

The MVP profile (1.11e) already applies the clustering (DEL + Lts promedio tiles).

### 1.12 Web onboarding frames inside Group 219 (context only)
- Sign up [1-146](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=1-146):
  - Fields: Nombre; Teléfono (+52, 33-3456-7890); Correo electrónico; Contraseña; Confirmar contraseña; checkbox "Acepto los Terminos y condiciones".
  - "Registrarme con" Google / Facebook; "¿Ya tienes cuenta? Inicia sesión aquí".
  - Value bullets: partos, días en leche, vacas enfermas, celos.
- Cuantas Vacas 5:695:
  - Copy: "¿Cuántas vacas en producción tienes? -- No vaquillas, terneras ó novillonas --" (how many producing cows, not heifers/calves/yearlings).
  - Field "En mi rancho hay: Número de vacas que tienes" (on my ranch there are: number of cows you have).
- Primera vaca (web) 5:847, "Registra tu primer vaca":
  - Raza, Potrero, ID Interno, Fecha nacimiento, Ciclo de lactancia, Último parto, Estapa reproductiva, ID SINIIGA.
- Exito estimado 5:963:
  - "$2,100" per cow; "$63,000" total. Copy: "Al registrar una vaca adicional de tu rancho, en tu cuenta, estimamos te genere $2,100 pesos extras de utilidad al año en tu rancho." (each additional registered cow is estimated to generate $2,100 MXN extra profit per year).
  - Prompt "¿Quieres registrar otra vaca?" (register another cow?).
- Felicidades 5:434: "Felicidades!!! [Nombre usuario] al registrar tus vacas, estarás en camino a contar con un rancho más rentable, gracias por tu confianza".
- Empty_Dashboard 417:2212 (web):
  - KPI cards Preñadas / Enfermas / DIM / Distribución del hato.
  - "Celos a confirmar" (A revisar hoy / Para seguimiento) and "Vacas por vacunar y dar tratamiento" (Por vacunar / A dar tratamiento).
  - Legend Con servicio / Enfermas / Preñadas / Abiertas.
  - The registration-progress card (see 1.13).
- Avatar menu 805:5447: Mi perfil, Mis ranchos, Mensajes recibidos, Administrar usuarios, Soporte, Cerrar sesión.

### 1.13 Mobile dashboard and animal list (context: entry points to registration)
- Onboarding_Dashboard [2904-9172](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2904-9172) (also 2904:8731, 2904:9613, 2913:10041, 2908:8208, 2913:10484):
  - Week strip S–S.
  - Card "**¿Cómo va el registro de tus vacas?**" (how is your cow registration going?): animal counter 002; progress bar with a "$" coin; "$4,200 Estimado actual" (current estimate) vs "$105,000 Total Estimado extra" (total estimated extra); ✕ to dismiss.
  - Shortcuts: Celos a observar / Seguimiento vacas enfermas / Seguimiento vacas preñadas / Registro producción del día.
  - "Tareas Mayo 2024 · Semana del 2 al 8 de Mayo de 2024": task rows with checkboxes.
  - Primary buttons **Nuevo animal** (new animal; opens §1.1/1.10) and **Nueva tarea** (new task).
- Listado animales [2908-8983](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2908-8983):
  - Title "Listado / Información general".
  - Counters per kind: cow 002 / heifer 000 / bull 000.
  - **+** (add), "Búsqueda" search, filter icon.
  - Columns **ID interno | Estado | DIM** with ✎ 🗑. Rows "vaca001 Fresca 75", "3317 Fresca 66".
  - Pager.
- Task form components "Campos de formulario" [2908-9426](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2908-9426):
  - Nombre de la tarea (task name)
  - Fecha de la tarea (YYYY-MM-DD)
  - Frecuencia (frequency; "Diaria" = daily)
  - **Animal relacionado a la tarea** ("Selecciona un animal si es necesario"; related animal, optional)
  - Asignar ("Selecciona un usuario"; assign to a user)
  - Notas ("Notas importantes de la nueva tarea a crear, como pudieran ser compras a realizar, llamadas, etc."; notes)
  - Button **Guardar tarea** (save task)

### 1.14 Diet change: automatic task (section 3441:11153)
- Frames:
  - [3441-10465](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3441-10465) "Dashboard - tarea automática celo" [sic, the frame name says celo].
  - [3441-10845](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3441-10845) "Detalle tarea automática celo".
- Dashboard (Tareas):
  - "Tareas Mayo 2024", "Martes 4 de Mayo de 2024".
  - Auto-generated task card "**Cambio de dieta para vaca {ID interno vaca}**" with a cow icon.
  - Banner "Termina el registro de tus vacas para lograr mejorar tu rentabilidad" (finish registering your cows to improve profitability) with the $4,200 / $105,000 bar.
- Detail:
  - Header ✕ + "Cambio de dieta para vaca {ID interno vaca}". Title "**Cambio de dieta**".
  - Copy: "La vaca {ID interno vaca} **tiene 120 días posteriores al parto,** es recomendable cambiarla de dieta acorde a su etapa en el ciclo de lactancia" (the cow is 120 days post-calving; change her diet to match her lactation stage). "¿Quieres confirmar su cambio de dieta?" (confirm the diet change?)
  - Buttons: **No entró** (pink, trash; "it didn't go in", i.e. not done or dismissed) / **Sí, confirmar** (green; confirm).
  - No fields: diet type, amount and cost are not asked here. Confirming presumably logs a DIET_CHANGE (fields in 1.11d).

### 1.15 WhatsApp community group icons (section 3557:9789)
- Eight 400×400 group avatars (3557:10266) plus a name list (3557:9889):
  - 🧑‍🌾🧑‍💻🤑 Comunidad Smartbell
  - 💰📈 Precios de referencia (reference prices)
  - 💰 Compra y venta de 🐄🐮 ganado (cattle trading)
  - 💰 Compra y venta de 🚜 equipo y maquinaria (equipment)
  - 💰 Compra y venta de 🌾🌽 alimento balanceado (feed)
  - 🔬 Asesoría técnica (technical advice)
  - 🤑📈 Asesoría Financiera (financial advice)
  - 🧑‍💻 Soporte (support)
- Two screenshots dated 2025-03-18 (WhatsApp community references).
- Marketing/community assets, not app screens. The only app impact: Soporte can deep-link to WhatsApp (the avatar menu has "Soporte"; NotificationPreference already has WHATSAPP).

### 1.16 AgriWebb age-classes link (3802:9789)
- Text: `https://help.agriwebb.com/en/articles/4175097-livestock-age-classes-iam`.
- What it implies:
  - The new **Etapa de desarrollo** lists (1.1) and their English helper labels (calf, weaner/weaned, heifer, steer, bull, cow, in-calf, empty, to check) were modelled on AgriWebb's livestock **age classes**.
  - AgriWebb derives the class from sex + age (+ pregnancy/castration), which matches the "Definir automáticamente (nacimiento)" option.
  - The model should carry `sex` and a **derived age class** with a manual override, instead of the fixed kind VACA/VAQUILLA/TORO.
  - This is a beef-oriented class set (steer, weaner, Cargada/Vacía), consistent with the `herd_type` DAIRY/BEEF setting.

---

## 2. Flow diagrams

### F1. New animal, latest (unified form)
1. Dashboard 2904:9172 → **Nuevo animal** (or Listado **+**) → Quick form 1.10.
2. Choose **Macho/Hembra**; enter Nombre*, Raza (default Holstein), Fecha nacimiento*, Potrero (default General).
3. a) **Registrar** → created. b) **Tengo más datos de mi animal** → full form 1.1.
4. Full form:
   - Nivel de cruza (default FB). If F1–F4, pick Raza de aporte.
   - Etapa de desarrollo (sex-specific list, or "Definir automáticamente").
   - SINIIGA (optional).
5. If Hembra with an adult/pregnant/empty/to-verify stage → Información reproductiva: Último parto, Ciclo de lactancia, Etapa reproductiva + Fecha etapa reproductiva.
6. Optional **Padre** / **Madre** → search by ID or register inline (F3).
7. Pesos (optional) → **Registrar** → success (1.9 pattern) → back to the list/dashboard. The progress card's "$ Estimado actual" grows (+$2,100 per cow).
8. Missing required → "Este campo es obligatorio" + toast "Por favor, llena los datos solicitados".

### F2. Cow (2023 form)
1. Inicio → Registro Vaca (chip **Vaca**) → fill → optional **Agregar datos de los padres** → 1.3 → **Registrar** → success.

### F3. Heifer born on the ranch with a known mother (2023)
1. Registro Vaquilla 21:2006 → Nombre, Raza, Fecha nacimiento, Altura al nacer, Pesos.
2. **Agregar datos de los padres** → 1.3 → **Vaca madre** → 1.4.
3. 1.4 a) **Buscar** existing dam by ID → autofill → **Registrar**. b) Or fill "O registra la información de la madre" (full cow record) → **Registrar**.
4. → 1.3 with snackbar "la vaca {Vaca ID} quedó registrada" → **Datos del Toro padre** → 1.5 (search or register the bull) → snackbar "el toro {Toro ID} quedó registrado".
5. 1.3 **Registrar** → summary + modal **Estatus vaca madre** (1.7): choose Viva en producción / Muerta (Desecho) / Vendida a otro rancho / Vendida al rastro.
6. → Success modal 1.9 "Felicidades!!! acabas de agregar la vaquilla --{ID}--" → **Continuar** → Inicio.

### F4. Purchased cow / cow with or without a calving history
- No dedicated "purchased" flow or field exists (no origin, purchase date or price).
  - A purchased cow goes through F1/F2 with her known data.
  - Unknown parents → leave Padre/Madre empty. The profile shows "No hay registro" + **Agregar padre**.
- Calving history:
  - Cow **with** history: Último parto + Ciclo de lactancia (≥1) + Etapa reproductiva (+ fecha).
  - Cow **without** calving (nulliparous): register her as Hembra with stage Novilla / Destetada / Ternera (new) or as Vaquilla (2023). The reproductive section is skipped.
  - Old rule carried over: "si no ha parido, registrala como vaquilla" (web-onboarding 1.9).

### F5. Mixed breed (FB / F1–F4)
1. Registration form → Raza original (= base breed) → Nivel de cruza:
   - FB: done.
   - F1–F4: an extra field appears, "Raza F1" (2023) / "Raza de aporte" (latest), to pick the crossing breed.
2. → Profile shows "Raza Holstein · Cruza Pardo Suizo F1 (50%)".

### F6. Profile navigation (MVP)
- Listado row → Profile 1.11e. From there:
  - ✎ photo → edit.
  - Genealogía "Consultar árbol" → tree (not drawn). The older profile used "Ver perfil" for the dam and "Agregar padre" for a missing sire.
  - Dieta "Consultar historial" → 1.11d → **Registrar cambio de dieta**.
  - Reproducción / Salud "Consultar historial" → history (1.11b Historial / Salud tabs).
  - **Registros** → 1.11c: Producción (Registrar producción) / Peso (Actualizar peso).
  - **Eliminar** → Baja flow (mobile-core B3; not redrawn here).

### F7. Diet change (automatic task)
1. Day = last calving + 120 → system creates the task "Cambio de dieta para vaca {ID}" in Tareas (3441:10465).
2. Tap → detail 3441:10845. a) **Sí, confirmar** → DIET_CHANGE logged; it appears in the "Historial cambios en dieta" (1.11d). b) **No entró** → task dismissed / not done (semantics unclear).
3. Manual alternative: profile → Dieta → Consultar historial → **Registrar cambio de dieta** (form not drawn).

---

## 3. Domain notes

### 3.1 Entities and fields implied
- **Animal**
  - `sex` (MACHO, HEMBRA): new and explicit; replaces kind as the primary toggle.
  - `name_or_control_id` ("Nombre o Número interno"; one field, required). In places the 2023 sire form splits **Nombre** + **ID Interno**.
  - `breed` (base, "Raza"/"Raza original"), `crossbreed_level` (FB, F4, F3, F2, F1), `contributing_breed` ("Raza de aporte"/"Raza F1"; nullable, required when level ≠ FB).
  - `birth_date` (required), `group_id` ("Potrero", default General), `siniiga` (optional), `photo_url`.
  - `development_stage` (enum below; `AUTO` = derived from birth_date + sex + repro).
  - Repro (female, adult): `last_calving_date`, `lactation_number` ("Ciclo de lactancia", default 1), `repro_stage` (default NINGUNA), **`repro_stage_date`** (generic date of the current stage).
  - Weights: `weight_birth_kg`, `weight_weaning_kg`, `weight_one_year_kg` (Al Nacer / Destete / Al año). Plus a weight series (WEIGHT events; "Actualizar peso").
  - `birth_height_cm` ("Altura al nacer (cm)"; 2023 heifer only; was "Tamaño al nacer").
  - `dam_id`, `sire_id`: can point to existing animals or to animals created inline from the parent forms. These are now on **every** animal (Padre/Madre buttons in the unified form, and Agregar datos de los padres on the cow form too), not just heifers.
- **Dam status at heifer registration** ("Estatus vaca madre"): VIVA_EN_PRODUCCION, MUERTA_DESECHO, VENDIDA_OTRO_RANCHO, VENDIDA_RASTRO. These map to Animal.status ACTIVE or to a REMOVAL with reasons MUERTE / VENTA_OTRO_RANCHO / VENTA_RASTRO.
- **MilkRecord per animal** (new granularity):
  - Fields: animal_id, date, liters ("20 lt"), destination (**TANQUE, BECERRAS, ANTIBIOTICOS**).
  - The recording interval is a setting ("Intervalo de registro de producción de leche").
  - Derived: "Lts promedio" (lt/día), peak day (DIM + liters).
- **DietChange** (extends the event):
  - Fields: diet_type (e.g. "Materia Seca"), start_date, **daily_cost** ($45.00), **daily_kg** (10kg); deletable (🗑).
  - The current diet = latest; it is shown on the profile card.
- **Task**:
  - Fields: name, date, frequency (DIARIA…), related_animal_id (optional), assignee_user_id, notes, done.
  - Auto tasks are generated by rules (diet change at 120 DIM; "tarea automática celo").
- **Registration progress / value estimate**:
  - Fields: target cow count ("¿Cuántas vacas en producción tienes?"), $2,100 MXN per registered cow per year. The total extra is $105,000 = 50 cows × 2,100; web $63,000 = 30 × 2,100.

### 3.2 Enums
- **Sex**: MACHO, HEMBRA.
- **Crossbreed level**:

  | Code | Share of the original breed | Label |
  |---|---|---|
  | FB | 100% | "FB (100% Pura)" |
  | F4 | 93.75% (shown as "93.5%") | "15/16" |
  | F3 | 87.5% | "7/8" |
  | F2 | 75% | "3/4" |
  | F1 | 50% | "1/2" |

- **Development stage, female**:
  - AUTO
  - TERNERA (0–6 m)
  - DESTETADA (~6–8 m)
  - NOVILLA (12 m)
  - CARGADA (any pregnant)
  - VACA_ADULTA (>27 m)
  - VACA_ADULTA_VACIA (>27 m, open)
  - A_VERIFICAR (pregnancy to confirm)
- **Development stage, male**:
  - AUTO
  - BECERRO (newborn)
  - DESTETADO (3–4 m)
  - NOVILLO_TERNERO (9–24 m)
  - TORO (20–24 m)
- **Repro stage** (Etapa reproductiva): default "Ninguna/Ninguno". Options are not drawn in this file; assume the existing list.
- **Milk destination**: TANQUE, BECERRAS, ANTIBIOTICOS.
- **Diet type**: free list; sample "Materia Seca" (dry matter).
- **Task frequency**: sample "Diaria". Others are not drawn.
- **Bottom nav (latest)**: Tareas, Vacas, Grupos, Reportes, Ranchos. Old: VACAS, GRUPOS, HISTORIAL, REPORTES, ALERTAS.
- **Animal list state**: "Fresca" (fresh cow).

### 3.3 Business rules visible in copy or layout
- Required on registration: only **Nombre o Número interno** and **Fecha nacimiento** (red *). Everything else is optional; SINIIGA is explicitly "(no obligatorio)".
- Defaults: Raza "Holstein", Potrero "General", Nivel de cruza "FB (100% Pura)", Ciclo de lactancia "1", Etapa reproductiva "Ninguna", Etapa de desarrollo "Ninguno" / "Definir automáticamente".
- Validation copy: "Este campo es obligatorio" + toast "Por favor, llena los datos solicitados". The Registrar button is visually disabled until valid.
- Parent lookup: "Ingresa el ID de la madre/padre". A found animal autofills its record. Otherwise register the parent inline as a full animal, with success snackbars.
- Stage age bands (from the option labels):
  - Ternera ≤6 m; Destetada 6–8 m; Novilla 12 m; Vaca adulta >27 m.
  - Becerro newborn; Destetado 3–4 m; Novillo 9–24 m; Toro 20–24 m.
  - The overlaps and gaps are noted in §5.
- **Diet-change auto task**: "tiene 120 días posteriores al parto, es recomendable cambiarla de dieta acorde a su etapa en el ciclo de lactancia" → trigger at DIM = 120.
- **Heat window on the profile**: "Celo estimado entre los días 12 al 18" → a 7-day window (old designs showed 4–5 days).
- Profile KPIs: **Días abiertos** (days open) and **DEL** (días en leche) both shown (74 / 74 in the sample, i.e. no conception yet, so days open = DIM). Lts promedio = average daily liters. Peso = latest weight.
- Insight requests (1.11f):
  - Number of inseminations (services this cycle) + herd average inseminations per cycle.
  - Age + % of herd in the same age.
  - Peak day of lactation (DIM # + liters).
- Value copy: "$2,100 pesos extras de utilidad al año" per extra registered cow.
- Dam status options imply that a dam can be registered only for genealogy even if she is dead or sold.

---

## 4. Shared components seen
- `Header` (bell `Bell_icon`, `Menu Rancho` switcher, `Avatar` with a badge, `Icon_KPI_Event`)
- `Footer_Mobile` (Tareas/Vacas/Grupos/Reportes/Ranchos)
- `Grid/Mobile_Smartbell_Official` (hidden grid)
- `Boton 40h`, `Boton 48h`, `Botón vaquilla` (kind chip), `Frame 232` (back + kind chip row), `Frame 234` (toast), `Frame 242` (stacked snackbars)
- `Date Picker` (Selection Row / Calendar grid / Local Actions; Material-style)
- `Filtro 7` + `Material/Content/clear`, `more_info_icon` (ⓘ on Nivel de cruza)
- `Smartbell_Logo`, `Footer Onboarding`, `Footer System`, `Encabezado`, `Boton Registrar Vaca`, `Boton Vacas en Sistema` (web)
- `Notas` / `Numero nota` (annotation badges)
- `Add cow` / `Add task` buttons ("Nuevo animal" / "Nueva tarea")
- `Icono DIM`, `Icono Pregnant cows`, `Icono Sick Cows`, `Icono Cows in Heat`
- Profile cards (Genealogía / Dieta / Reproducción / Salud), KPI tiles (Peso / DEL / Lts promedio)

---

## 5. Open questions / inconsistencies
1. **F4 percentage**: shown as "93.5% 15/16", but 15/16 = 93.75%. Fix the label.
2. **Crossbreed semantics**: is the F-level the share of "Raza original" (grading up toward it) or of the contributing breed? The labels and the profile ("Cruza Pardo Suizo F1 (50%)", with Raza Holstein) suggest the percentage is the original breed's share. Confirm, and confirm whether a 3-breed cross is possible (it is not today).
3. **"Raza" options** are not enumerated in v4. "Symental" is misspelled (Simmental). Pardo Suizo appears only as a contributing breed. Is "Raza Mixta" (old enum) now replaced by crossbreed level? See §6.
4. **Stage bands overlap or have gaps**:
   - Novillo 9–24 m vs Toro 20–24 m.
   - Destetado (male) 3–4 m vs Destetada (female) 6–8 m.
   - No female stage between 8 and 12 m, or between 12 and 27 m (a 13–26 m open heifer has no label besides "Novilla (12 meses)").
   - Toro is capped at 24 m (an older bull?).
   - Is Novillo a castrated steer (beef) or a young bull?
5. **Two stage fields**: "Etapa de desarrollo" (age class) and "Etapa reproductiva" (repro stage) overlap: Cargada / Vacía / A verificar are repro states. Decide which one is the source of truth.
6. **"Fecha etapa reproductiva"** is one generic date. Its meaning depends on the stage (heat date, service date, diagnosis date). The previous design had stage-specific dates.
7. **Heifer form hides SINIIGA and repro stage** (2023). The unified form shows SINIIGA for everyone.
8. **"MVP 2da etapa"** hidden label: unclear which parts are phase 2 (crossbreed? development stage? parents?).
9. **Info. reproductiva visibility rule** is not explicit (sex only, or sex + stage).
10. **Estatus vaca madre** asked after every heifer registration, or only when the dam was registered inline? Also the duplicated "Vendida al rastro" option in 315:2904 / 734:7754.
11. **Production table header "Peso"** should be "Litros". The chart legend has the placeholder "[1]".
12. **"No entró"** button meaning on the diet task (not done vs rejected), and whether confirming asks for the diet details (type, kg, cost). No diet form exists in v4.
13. Frame names "tarea automática celo" are used for the diet task (copy/paste).
14. The MVP profile hides the bottom nav. The heat banner and group selector layers exist but are not visible, and the Celo/Preñada/Parto/Salud quick buttons disappear in the MVP. Where are events launched from now?
15. Two bottom-nav generations coexist (old VACAS…ALERTAS vs new Tareas…Ranchos).
16. **No bulk/quick import** of many animals. Only the quick form exists.
17. **No purchased-animal fields** (origin ranch, purchase date or price, entry date). They are needed for days-on-ranch and finance.
18. Sire identifier split (Nombre + ID Interno) only in the mixed-breed example.

---

## 6. Reconciliation with previous analysis

Legend: **SUPERSEDES** (v4 replaces it), **EXTENDS** (v4 adds to it, prior still valid), **CONFLICTS** (needs a decision), **UNCHANGED**.

### 6.1 mobile-core.md

| Item | Verdict | Notes |
|---|---|---|
| A7 Cow registry (Vaca) | **SUPERSEDES** | See the bullets below |
| A7 validation rules (internal-ID charset/uniqueness, SINIIGA 4–8 digits, birth-date limits, JPG/PNG) | **UNCHANGED** (not redrawn) | Carry them forward |
| A8 Calf/heifer registry | **SUPERSEDES** | See the bullets below |
| A9 Bull registry | **SUPERSEDES** | A bull = Macho + stage TORO in the unified form. The bull "Nombre" field is gone; "Nombre o Número interno" covers it (except the 734:6943 split) |
| A10 Cow list + filters | **EXTENDS** | See the bullets below |
| B1 Animal lists | **EXTENDS / CONFLICTS** | See the bullets below |
| B2 Cow profile (Perfil tab) | **SUPERSEDES** | See the bullets below |
| B3 Delete (Baja) | **UNCHANGED** | "Eliminar" button remains; the reasons reappear in the dam-status modal (same 3 non-error reasons, re-worded) |
| B4 Bitácora list | **EXTENDS** | Now "Registros" → Historial tab (Tipo/Fecha/Evento) plus Ciclo actual / Salud / Peso / Producción tabs |
| B5 Event detail / edit / delete | **UNCHANGED** | Not redrawn. Weight and production rows now have 🗑/✎ inline |
| B6 Per-cow vaccination & development | **CONFLICTS** | See the bullets below |

A7, cow registry:
- Replaced by the unified form 1.1 / quick form 1.10. Labels changed: "ID control interno" → "Nombre o Número interno".
- Raza is no longer marked required (default Holstein).
- The accordions became sections; the photo was removed from the form.
- "Estado de Lactancia" (Lactando/Seca) is **gone**. "# Lactancia" → "Ciclo de lactancia".
- "Fecha último Parto *" is **no longer required**.
- Etapa de desarrollo, crossbreed, Padre/Madre and weights are added.

A8, calf/heifer registry:
- Kind "Vaquilla" → Hembra + development stage.
- The dam/sire **dropdowns** become search-or-register-inline sub-flows (1.4/1.5).
- "Tamaño al nacer" → "Altura al nacer (cm)" (2023 only; absent from the latest form). Peso al nacer → Pesos Al Nacer / Destete / Al año.
- Adds the dam-status modal.

A10, cow list and filters:
- The new Listado (2908:8983) keeps kind counters, search and filter.
- Columns: ID interno / Estado / DIM + ✎ 🗑 (edit added). The filter values are not redrawn.

B1, animal lists:
- The cow/heifer/bull **counters remain** in the list, even though registration no longer uses a kind.
- Decide whether the list tabs are computed from sex + stage.

B2, cow profile:
- Replaced by the MVP profile 1.11e:
  - photo hero with Raza/Cruza chips;
  - KPI tiles Peso / DEL / Lts promedio;
  - four cards (Genealogía, Dieta, Reproducción, Salud);
  - Eliminar / Registros.
- The Perfil / Actividad / Bitácora tabs are gone.
- The Celo/Preñada/Parto switches are absent in the MVP (present in the pre-MVP 1.11a as buttons). The event entry point is unresolved.
- "Próximo evento según edad" banner → "Celo estimado entre los días …" (7-day window).
- Days open is now shown.

B6, per-cow vaccination and development:
- Weight history moves to Registros → Peso (with Al nacer / Al destete / Al año summary + Actualizar peso).
- Vaccination is not present in the v4 profile. Is it removed from the MVP?

### 6.2 web-onboarding-registry.md

| Item | Verdict | Notes |
|---|---|---|
| 1.8 Cow list, onboarding | **EXTENDS** | Mobile Listado plus the dashboard progress card "¿Cómo va el registro de tus vacas?" ($ estimate). Web onboarding adds "¿Cuántas vacas en producción tienes?" and "Exito estimado" ($2,100/cow) steps (Group 219 web frames) |
| 1.9 New animal registration | **SUPERSEDES** (fields) / **CONFLICTS** (rules) | See the bullets below |
| 1.15 Cow profile / heifer (system) | **SUPERSEDES** | Genealogía becomes a card with Padre/Madre IDs + "Consultar árbol". "Tamaño y peso al nacer" → Peso al nacer tile (heifer variant 4048:10361). Monitor de Actividad / smart-collar teaser absent. "Etapa de desarrollo: Recien Nacida" → new stage enum |

1.9, fields superseded:
- Vaca/Vaquilla/Toro tiles → Macho/Hembra + Etapa de desarrollo.
- Photo panel absent from the form (photo edit is on the profile).
- The conditional "Fecha último celo / Fecha diagnóstico" → one "Fecha etapa reproductiva".
- Estado de Lactancia is removed.

1.9, rules in conflict:
- "Fecha último Parto required" (old) vs optional (v4).
- Old birth-date limits per kind (Vaca ≥24 m, Vaquilla ≤24 m) need re-expressing per **stage** (e.g. Vaca adulta >27 m vs the old 24 m threshold).
- "Registra una fecha aproximada, si no ha parido, registrala como vaquilla" maps to Hembra + non-adult stage.

### 6.3 event-flows.md

| Item | Verdict | Notes |
|---|---|---|
| 1.0 Cow profile (event launcher) | **CONFLICTS** | See the bullets below |
| 1.7 Diet change | **EXTENDS / CONFLICTS** | See the bullets below |

1.0, profile as event launcher:
- The v4 MVP profile drops the Celo/Preñada/Parto/Salud launchers and the status banner is not visible. The pre-MVP 2025 frames keep Celo + Salud (+ Preñada/Parto in older ones).
- The window changes from ±2 d (4–5 days) to a 7-day heat window.
- Decide: are events launched from the profile cards ("Consultar historial") or from Tareas/alerts only?

1.7, diet change:
- Adds an **automatic task at 120 days post-calving** with Sí, confirmar / No entró.
- Adds a **diet history** with **daily_kg** and **daily_cost** (new fields). The diet *type* replaces the free-text "Descripción nueva dieta".
- No "Razón cambio de dieta" in v4 (keep it as optional; the auto task implies reason = ETAPA_REPRODUCTIVA/lactation stage).
- The "Fecha inicio dieta" field is kept as "Fecha de inicio".

### 6.4 domain-model.md

| Item | Verdict | Notes |
|---|---|---|
| Animal.kind (VACA, VAQUILLA, TORO) | **CONFLICTS** | v4 registers by **sex + development stage**. Proposal: keep `kind` as a *derived* category (VACA = female with a calving or adult stage, VAQUILLA = female without a calving, TORO = male), add `sex` and `development_stage` (with AUTO). The list counters still use the 3 kinds |
| Animal.control_id | **EXTENDS** | Label "Nombre o Número interno". Consider an optional separate `name` (sire form 734:6943) |
| Animal.siniiga | **UNCHANGED** | Optional; validation as before |
| Animal.breed (enum, default HOLSTEIN) | **CONFLICTS** | See the bullets below |
| Animal.birth_date | **UNCHANGED** | Required |
| Animal.photo_url | **UNCHANGED** | Edited from the profile |
| cow fields: lactation_state (LACTANDO, SECA) | **CONFLICTS** | Not captured at registration any more. Derive it from events (calving → LACTANDO; dry-off → SECA) and a default at ALTA |
| cow fields: lactation_number, last_calving_date | **UNCHANGED** | Optional at registration; ALTA snapshot |
| repro_state at registration | **EXTENDS** | Add `repro_stage_date` to the ALTA snapshot so the projection can anchor windows |
| heifer fields: dam_id, sire_id | **EXTENDS** | Move to **all animals**. Parents can be created inline (full Animal records) and found by ID search |
| heifer fields: birth_length_cm | **EXTENDS** | Renamed "Altura al nacer (cm)" → `birth_height_cm` (2023 only) |
| heifer fields: birth_weight_kg | **EXTENDS** | Generalize to `weight_birth_kg`, `weight_weaning_kg`, `weight_one_year_kg` (all animals), plus WEIGHT events |
| heifer fields: sex ⚙ | **SUPERSEDES** | `sex` is now a first-class field on every animal (resolves open question 5 for registration; still missing on the calving→calf path) |
| bull fields: name | **CONFLICTS** | The unified form has no separate name; the sire form 734:6943 has Nombre + ID Interno. Decide |
| Removal reasons | **UNCHANGED** | Dam-status modal reuses MUERTE / VENTA_OTRO_RANCHO / VENTA_RASTRO (+ VIVA = active) |
| §3.10 Heifer stages (RECIEN_NACIDA <6 m, EN_DESARROLLO 6–16 m; heat alerts 13–18 m; breeding unlock 12 m) | **CONFLICTS** | v4 bands: Ternera 0–6, Destetada 6–8, Novilla 12, Vaca adulta >27 m. Map them, or replace the computed heifer groups with `development_stage` (AUTO) and keep the alert months as settings |
| §3.11 Age validation | **CONFLICTS** | Old thresholds keyed to kind (heifer ≤24 mo; >30 mo warn; cow last calving ≥ birth + 22 mo). With stages, re-key them (e.g. Vaca adulta >27 m implies age ≥27 m; Ternera ≤6 m). Keep "last calving ≥ birth + 660 d" |
| §3.12 Days open | **UNCHANGED** (now displayed) | Shown on the profile beside DEL. Insight asks to add `services_count_current_lactation` and the herd average services per conception |
| Event DIET_CHANGE payload (reason, diet) | **EXTENDS** | Add `diet_type`, `daily_kg`, `daily_cost`, `start_date`. Reason becomes optional |
| MilkRecord (later; ranch total) | **EXTENDS** | Per-animal milk records with `destination`, plus derived avg lt/day and peak day; the dashboard "Registro producción del día" shortcut. Promote it from "later" if the MVP profile shows Lts promedio |
| Reminder / Task | **EXTENDS** | Add the **Task** entity (name, date, frequency, related animal, assignee, notes, done, `source` MANUAL/AUTO, `rule_key`). Auto rule DIET_CHANGE_DUE at DIM 120 (⚙ `diet_change_dim` = 120 in RanchSettings) |
| RanchSettings | **EXTENDS** | `diet_change_dim` 120, `heat_window` now 7 days on the profile (CONFLICTS with ±2), `value_per_registered_cow_mxn` 2100, `target_cow_count` (onboarding answer), `milk_record_interval` |
| herd_type DAIRY/BEEF | **EXTENDS** | AgriWebb-style age classes (steer, weaner, in-calf, empty) suggest beef support. The stage lists could vary by herd_type |

Animal.breed, the decision:
- v4 captures `breed` (base) + `crossbreed_level` + `contributing_breed`.
- The old `MIXTA` value becomes redundant. Recommendation: drop MIXTA and model crosses with level + contributing breed.
- Rename SIMMENTAL's label (v4 misspells "Symental").
- Breed list otherwise unchanged (not re-enumerated).

**New domain fields and enums needed (summary)**
- `Animal.sex` ∈ {MACHO, HEMBRA}
- `Animal.development_stage`:
  - Female: AUTO, TERNERA, DESTETADA, NOVILLA, CARGADA, VACA_ADULTA, VACA_ADULTA_VACIA, A_VERIFICAR.
  - Male: AUTO, BECERRO, DESTETADO, NOVILLO, TORO.
- `Animal.crossbreed_level` ∈ {FB, F4, F3, F2, F1} (pct 100 / 93.75 / 87.5 / 75 / 50); `Animal.contributing_breed` (Breed, nullable; required when level ≠ FB)
- `Animal.repro_stage_date`
- `Animal.dam_id`, `Animal.sire_id` on all animals
- `Animal.birth_height_cm`, `weight_birth_kg`, `weight_weaning_kg`, `weight_one_year_kg`
- optional `Animal.name` distinct from `control_id`
- `DamStatus` input → reuse the removal reasons + ACTIVE
- `MilkRecord {animal_id, date, liters, destination ∈ TANQUE|BECERRAS|ANTIBIOTICOS}`
- `DietChange payload {diet_type, start_date, daily_kg, daily_cost, reason?}`
- `Task {name, date, frequency, related_animal_id?, assignee_id?, notes, status, source MANUAL|AUTO, rule_key}`
- RanchSettings: `diet_change_dim`=120, `value_per_registered_cow`=2100 MXN, `target_cow_count`, `milk_record_interval`, profile `heat_window_days` (7-day display)
- Derived profile metrics: `days_open`, `dim`, `avg_daily_liters`, `peak_day {dim, liters}`, `services_this_lactation`, `herd_avg_services_per_cycle`, `age`, `% herd in same age band`
