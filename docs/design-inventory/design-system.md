# Smartbell design system inventory

Source pages:
- Mobile file `gv5ugNqVKPF8N2Ol5cQCyV`: Breakpoints_and_specs (`2460:0`), Grids (`0:1`), Symbols (`0:47`), Icons (`3633:95078`)
- Web file `6UCRP77ZAdWb1ut1A91yJX`: Web_Sizes (`5200:0`)

Link prefixes used below:
- **M** = `https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=`
- **W** = `https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=`

So "M 81-572" means https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=81-572

Coverage note: the Figma MCP seat hit its rate limit partway through. Everything in the Mobile Symbols, Grids and spec pages was inspected (metadata, variables and screenshots). Web_Sizes was read only through metadata and one variables call, with no screenshots. The Desktop (1366), iPhone 8/XS and tablet-horizontal grid symbols were not screenshotted, so their column values are still open.

Key spec frames:
- Typography Styles: M 3140-76656
- Card_Styles_n_Pttrns: M 3168-2951
- Mobile_Dashboard_specs: M 3141-0
- `<600>900_Tablet_Dashboard_specs`: M 3208-85130
- Colores oficiales Smartbell: M 0-12
- Symbols/Colors: M 1851-99029

The spec annotations reference **Vuetify** (`<v-progress-linear>` with a vuetifyjs.com link). The original build was Vue + Vuetify.

---

## 1. Tokens

### 1.1 Color

These are Figma color styles (variables API). The name is verbatim.

| Token (Figma style) | Hex | Symbol in Colors frame | Role (observed usage) |
|---|---|---|---|
| Smartbell_Blue | `#1460AA` | Color/Primary | Primary. Main buttons (Agregar Potrero, Editar, Guardar), table KPI headers (DIM/Enfermas/Preñadas), progress fill, links, web header bar, title text ("¿Cómo va él rancho?") |
| Smartbell_Blue_Dark | `#063664` | Color/Primary-Dark | Mobile/tablet global header bg, big KPI numerals, "on" state of counter buttons, calendar weekday band, map pin markers |
| Smartbell_Blue_Light | `#57A7F5` | Color/Primary-ligth | "Vacas en Sistema" label half, Vaccines KPI card tile, progress bar fill (stepper), Delete-stall button, avatar ring, selected calendar date |
| Smartbell_Light_Blue_2 | `#BAE5FD` | Color/Complementary | Calendar date-range fill, light accents |
| Smartbell_Green | `#65D9AC` | Color/Secondary | Positive/CTA buttons (Agregar Vaca, Registrarme, Responder, Salud, Registrar peso, Add cow), Button_Add, switch-on, slider track |
| Smartbell_Green_Dark | `#369A73` | Color/Secondary-Dark | Dark green accent (hover/pressed candidate) |
| Smartbell_Green_Ligth | `#97F6D2` | Color/Secondary-ligth | Light green, range slider rail, "LightGreen_Mark" |
| Smartbell_Red | `#EB004E` | Color/ Red Complementary | Heat (celo) brand red. "Celos a confirmar" KPI tile, heat/sick icons, notification badge, error banner (Alert_Message), Button_Delete, over-limit plan counter |
| Smartbell_Pink | `#FFF2FC` | Color/ Red Complementary (2nd, 1461:93713) | Pale red/pink tint background |
| Smartbell_DarkRed | `#CA0E07` | Color/Error | Error. Annotated as the bg of the "Celos a confirmar" tile in the spec, though the render looks `#EB004E` (see Open questions). "Malo" range on the efficiency gauge |
| Smartbell_Orange | `#FF7B01` | Color/Alert | Warning. "Aceptable" range, Orange_Mark, OrangeDate_Icon, web palette |
| Smartbell_Yellow | `#FEC011` | Color/Alert-2 | Secondary warning |
| Smartbell_Black | `#333E49` | Color/Gray Dark | Darkest text |
| Smartbell_DarkGray | `#4D5965` | Color/Gray | Body text, table header bg (Header Table*), switch-off knob, chip borders. The web file names it `Smartbell_DarkGrey` |
| Smartbell_Gray | `#979797` | Color/LightGray | Placeholder text, disabled buttons ("Dar de baja"), inactive icons, input borders. Spec calls it "Smartbell_Grey" |
| Smartbell_Gray_Light | `#DADADA` | (none) | Progress/stepper track ("Smartbell_Light_Grey" in the Vuetify note), disabled toggle bg, table dividers |
| Smartbell_White | `#F9FDFE` | Color/White | App/page background, Generic-card and Onboarding-card bg |
| Smartbell_PureWhite | `#FFFFFF` | (none) | Popover-Filter-card bg, text on dark/colored surfaces, inputs |

The "Colores oficiales Smartbell" board (M 0-12) shows two hexes that differ from the styles:
- **F15C00** instead of FF7B01 for orange
- **FF006A** instead of EB004E for red

Treat the **styles** as the source of truth.

Web file (W 5273-131) variables use lowercase variants: `Smartbell_blue` #1460AA, `Smartbell_green` #65D9AC, `Smartbell_green_ligth` #97F6D2, `Smartbell_DarkGrey` #4D5965, `Smartbell_Orange` #FF7B01. The values are the same.

Proposed semantic aliases:

| Alias | Value |
|---|---|
| `primary` | Blue |
| `primary-dark` | Blue_Dark |
| `primary-light` | Blue_Light |
| `primary-50` | Light_Blue_2 |
| `success` / `cta` | Green |
| `success-dark` | Green_Dark |
| `success-light` | Green_Ligth |
| `heat` / `danger` | Red |
| `danger-bg` | Pink |
| `error` | DarkRed |
| `warning` | Orange |
| `caution` | Yellow |
| `text-strong` | Black |
| `text` | DarkGray |
| `text-muted` | Gray |
| `border` / `track` | Gray_Light |
| `bg` | White |
| `surface` | PureWhite |

### 1.2 Typography

There are two families:
- **Montserrat** (display, headings, numerals, buttons, nav)
- **Open Sans** (body, forms, tables, descriptions)

Style names follow `<size>pt-<Family>-<Weight>`. "pt" is really px. Line heights come from the CSS notes on the Typography Styles board (M 3140-76656). The Figma style objects themselves report lineHeight 100% (auto).

| Style | Family | Size | Weight | Line-height | Notes / usage |
|---|---|---|---|---|---|
| 40pt-Montserrat-Medium | Montserrat | 40 | 500 | 50 | KPI big numerals (02 / 00). The mobile spec annotates "40pt-Montserrat-Bold", which has no style (see Open questions) |
| 32pt-Montserrat-Bold | Montserrat | 32 | 700 | 40 | Large page titles |
| 24pt-Montserrat-Bold | Montserrat | 24 | 700 | 32 | Tablet section titles, "Vacas en Sistema" (tablet), counter labels (tablet) |
| 24pt-Montserrat-Medium | Montserrat | 24 | 500 | 32 | Header user name (tablet), KPI labels (tablet), mobile KPI counts (002) |
| 18pt-Montserrat-Bold | Montserrat | 18 | 700 | 22 | Card headers (tablet), counter numbers |
| 18pt-Montserrat-Semibold | Montserrat | 18 | 600 | 24 | Mobile section title, "Vacas en Sistema" (mobile), counters (mobile) |
| 18pt-Montserrat-Regular | Montserrat | 18 | 400 | 24 | Ranch selector placeholder |
| 16pt-Montserrat-Bold | Montserrat | 16 | 700 | 20 | Card header labels (mobile, DIM/Enfermas/Preñadas), KPI tile caption (tablet) |
| 16pt-Montserrat-Semibold | Montserrat | 16 | 600 | 20 | Header user name (mobile), buttons |
| 16pt-Montserrat-Regular | Montserrat | 16 | 400 | 20 | KPI labels (mobile) "A revisar hoy" |
| 12pt-Montserrat-Bold | Montserrat | 12 | 700 | 16 | KPI tile caption (mobile) "Celos a confirmar", small buttons |
| 10pt-Montserrat-Semibold-Uppercase | Montserrat | 10 | 600 (CSS note says bold) | 12 | Bottom nav labels (VACAS, GRUPOS...), uppercase |
| 20pt-OpenSans-Regular | Open Sans | 20 | 400 | 30 | Large body |
| 18pt-OpenSans-Bold | Open Sans | 18 | 700 | 24 | Emphasised body |
| 18pt-OpenSans-Regular | Open Sans | 18 | 400 | 24 | Body / inputs (most used text style on spec page) |
| 18pt-OpenSans-Regular-Link | Open Sans | 18 | 400 | 24 | Underlined link |
| 16pt-OpenSans-Semibold | Open Sans | 16 | 600 | 24 | Table header text |
| 16pt-OpenSans-Regular | Open Sans | 16 | 400 | 24 | Table rows, descriptions |
| 16pt-OpenSans-Regular-Italic | Open Sans | 16 | 400 italic | 24 | Hints |
| 12pt-OpenSans-Semibold | Open Sans | 12 | 600 | 16 | Small labels |
| 12pt-OpenSans-Regular | Open Sans | 12 | 400 | 16 | Captions |
| 12pt-OpenSans-Italic | Open Sans | 12 | 400 italic | 16 | Captions/hints |
| 8pt-OpenSans-Semibold | Open Sans | 8 | 600 | 12 | Badges/micro labels |

Responsive type scaling is visible in the dashboard specs, from mobile (≤600) to tablet (600–960):

| Element | Mobile | Tablet |
|---|---|---|
| Header user name | 16 Montserrat Semibold | 24 Montserrat Medium |
| Section title "¿Cómo va él rancho?" | 18 Semibold | 24 Bold |
| KPI tile caption | 12 Bold | 16 Bold |
| KPI card header (DIM...) | 16 Bold | 18 Bold |
| KPI count (002) | 24 Medium | 40 Medium |
| KPI secondary label | 16 Regular | 24 Medium |
| "Vacas en Sistema" bar | 18 Semibold | 24 Bold |
| Counter chips | 18 Semibold | 24 Bold label + 18 Bold number |
| Bottom nav (unchanged) | 10 Semibold Uppercase | 10 Semibold Uppercase |

The page has a designer's TODO: "Especificar cambios de tamaño en la tipografía por cada cambio de tamaño en las pantallas por breakpoint" (gloss: specify type-size changes for each screen size per breakpoint). Desktop scaling is therefore unspecified.

### 1.3 Spacing

There is no spacing token set in Figma. Values are inferred from grids, symbols and web layout:

- **Base unit 4.** Observed steps: 4, 8, 12, 16, 20, 24, 32, 40, 44, 48, 60, 72.

Mobile:
- Page margin 16
- Grid gutter 20 (360) / 16 (320)
- Card internal padding about 12–16
- Gap between KPI cards about 12–16

Tablet:
- Margin 44, gutter 24

Web desktop (W 5273-131):
- Sidebar 256 wide
- Content starts at x=280 (24 gap) with 12 top offset
- Upper bar 72 tall
- Title bar 48
- Input row 64 (40 control + 12 pad)
- CardItemGroup padding 16 with 48 title/action rows
- Event dialogs (`heat-event`) padding 24, field-label to control gap 8, label rows 52/77/133/158

Control heights:
- 22 (text links)
- 30 (icon buttons)
- 34–36 (mobile chips, SINIIGA field)
- **40 (standard button/input/dropdown)**
- 48 (large button / main textbox / table row)
- 60 (headers/footers)

### 1.4 Radii

| Token | Value | Where |
|---|---|---|
| `radius-sm` | 4px | Generic-card, Onboarding-card, buttons, inputs, dropdowns, table rows |
| `radius-top` | 4px 4px 0 0 | Popover-Filter-card (bottom sheet) |
| `radius-pill` | 50% / 9999 | Progress/stepper bars (8px high), switches, date-range pill, calendar day cells |
| `radius-full` | circle | KPI icon discs, avatar, Boton Imagen (photo picker), Button_Add/Delete, status marks |

### 1.5 Elevation

| Token | CSS (from Card_Styles_n_Pttrns, M 3168-2951) | Figma style |
|---|---|---|
| `shadow-card` | `0 4px 10px rgba(0,0,0,.25)` | Generic_Shadow (used by buttons and Generic-card) |
| `shadow-popover` | `0 -2px 7px rgba(0,0,0,.15)` (upward; bottom sheet, `width:100vw`) | (none) |
| `shadow-onboarding` | `0 4px 12px rgba(0,0,0,.2), 0 -6px 12px rgba(0,0,0,.16)` | (none) |

Card patterns:

| Pattern | Background | Shadow | Radius |
|---|---|---|---|
| Popover-Filter-card | PureWhite | shadow-popover | 4 4 0 0 |
| Generic-card | White | shadow-card | 4 |
| Onboarding-card | White | shadow-onboarding | 4 |

Progress bar: value color Smartbell_Blue, track Smartbell_Light_Grey (#DADADA), height 8, radius 50%.

### 1.6 Grids

These are layout grid symbols, measured from renders.

| Symbol | Link | Frame | Columns | Margin | Gutter | Column width |
|---|---|---|---|---|---|---|
| Grid/Mobile_Smartbell_Official | M 1555-208 | 360×750 | 4 | 16 | 20 | 67 |
| Grid/Mobile_320 | M 0-95 | 320×1024 | 4 | 16 | 16 | 60 |
| Grid/Tablets | M 0-74 | 768×1024 | 8 | 44 | 24 | 64 |
| Grid/Iphone_8 | M 0-48 | 375×667 | not measured | | | |
| Grid/iPhone_XS | M 0-61 | 375×812 | not measured | | | |
| Grid/Tablets_horizontal | M 0-108 | 1024×768 | not measured | | | |
| Grid/Desktop_regular | M 0-137 | 1366×768 | not measured | | | |

The **official** mobile grid is 360×750 and is used 27× on the spec page. The Grids page (M 0-1) also has a "Mobile" sample (M 0-42) with Color/Primary 72px header + 16px band.

Web desktop frames do not use a column grid in the metadata. They are a fixed layout:
- Sidebar 256
- Content 1050 at 1332/1366 width, 864/768 tall

### 1.7 Breakpoints

From the spec rulers on Breakpoints_and_specs.

Widths:

| Width | Device / meaning |
|---|---|
| 320 | Small mobile |
| **360** | Base mobile design width |
| **600** | "Android General 600", the mobile→tablet switch |
| 768 | "ipad pro / air2 / mini4", reference only (dashed line) |
| **960** | Tablet max ("600><960") |
| 1024 | Tablet horizontal |
| 1280 / 1366 | Desktop (Web_Sizes frames are 1332–1366 × 768–864) |

Heights:
- 750 (mobile viewport)
- 900 (mobile max height)
- 1024 / 1280 (tablet heights)

Tablet frames are named `<600>900_Tablet_*`, meaning widths 600–960 and min height 900.

Proposed tiers:

| Tier | Width |
|---|---|
| `sm` | <600 (mobile; design at 360, verify at 320) |
| `md` | 600–959 (tablet; same single-column layout scaled up, larger type and icons) |
| `lg` | 960–1279 |
| `xl` | ≥1280 (web: left sidebar + content) |

KPI icon sizes on tablet:
- Heat/Vaccine discs 92
- Pregnant 80
- DIM 80×90
- Sick 80×86

Mobile discs are about 60. Base symbols are 84.

---

## 2. Components inventory (Mobile file, Symbols page `0:47`)

"Used in" is derived from instance names on the Breakpoints_and_specs screens. Screen names abbreviate frame names: Dashboard, Alerts_Selection, Cow_Registry_Data, Cow list/filters, Cow_Stall, Cow_Profile, Journal, Vaccination, etc.

### 2.1 Buttons (frame `80:574`, M 80-574)

| Symbol | Id | Label (es) / gloss | Variants / states | Props | Used in |
|---|---|---|---|---|---|
| Boton Omitir Paso | 81:572 | "Omitir Paso" / skip step | text link, gray | label | Onboarding footers. The instance "Buttons Omitir Paso" appears on 31 screens |
| Boton Continuar | 81:589 | "Continuar >" / continue | text link + chevron, blue | label | Onboarding steppers |
| Boton Regresar | 81:607 | "< Regresar" / back | text link + chevron | label | Onboarding steppers |
| Boton Registrar Vaca | 81:619 | "Agregar Vaca" + cow icon / add cow | green 220×40 | label, icon | Dashboard onboarding, cow list |
| Boton Registrar Grupo | 81:651 | "Agregar Potrero" + stall icon / add paddock | blue 220×40 | label, icon | Cow_Stall, Stall_Configuration, Group filter |
| Boton 48h | 84:812 | "Registrarme" / sign up | green 192×48 | label | Sign-up / account |
| Boton 40h | 119:977 | "Registrarme" | green 192×40 | label | Registry, filters, profile delete |
| Boton 40h Deactivated | 604:24431 | "Dar de baja" / deactivate | gray disabled 120×40 | label | Cow profile delete |
| Boton Responder | 961:1583 | "Responder" + reply icon / reply | green | label, icon | Messages/alerts |
| Boton Answer | 961:2131 | "Enviar" + send icon / send | blue | label, icon | Messages |
| Boton agregar foto | 246:12 | "Agregar Foto" + image icon / add photo | blue | label, icon | Profile/onboarding |
| Boton Edit | 369:5907 | "Editar" + pencil | blue 132×40 | label, icon | Cards, profile |
| Boton Save | 369:5908 | "Guardar" + disk | blue 132×40 | label, icon | Forms |
| Delete | 780:31163 | "Eliminar Potrero" + trash / delete paddock | light-blue 192×40 | label, icon | Stall config |
| Health Button | 716:245 | "Salud" + sick icon + (+) / health | green 192×48 | label, icon | Cow profile events |
| Weight Button | 1911:101474 | "Registrar peso (+)" / log weight | green 210×40 | label | Cow profile |
| Add cow / Add cow_small | 1725:93606 / 1725:93607 | "Vaca (+)" / icon only (+) | green 142 / 112 ×40 | label? | Dashboard counters row ("Agregar Vaca") |
| Boton Imagen | 81:795 | photo placeholder circle + blue (+) | 100×98 | image | Dashboard onboarding, Map_Data, Account config, User profile |
| Button_Add | 164:1098 | green (+) circle 30 | single | (none) | Journal, vaccination, dashboard |
| Button_Delete | 164:1097 | red (x) circle 30 | single | (none) | Lists |
| Button_edit_icon | 1691:1546 | blue pencil circle 40 | single | (none) | Profile |
| Button_Filter | 1881:99630 | sliders icon square 40 | single | (none) | Lists/filters |
| Boton Vacas en Sistema | 118:202 | "Vacas en Sistema / 000" / cows in system | split bar light-blue + blue count, 280×40 | label, count | Dashboard, Cow_Stall |
| Boton Vaca / Vaquilla / Toro -On / -Off | 84:1348, 84:1374, 84:1386, 84:1361, 1301:112, 1301:191 | cow / heifer / bull type selector with radio | **On** = blue + filled radio. **Off** = light gray. 132×40 | animalType, selected | Cow registry (animal type) |
| ..._mobile variants | 1568:653–655, 1568:767–769 | same, icon-only + radio | On/Off, 80×36 | animalType, selected | Mobile registry |
| Boton Toro-inactive_mobile | 2005:4086 | bull icon, no bg | disabled | (none) | Mobile registry when bull not allowed |
| Boton Text On / Off | 130:1829 / 130:1844 | "Automático" / "Manual" radio-button card | On/Off | label, selected | Alerts_Selection, settings |
| Boton Text 2 lines On / Off | 1906:102122 / 1903:101080 | "Un Botón de 2 líneas" | On/Off | label | Same |
| Boton Text Check_On / Off | 1635:96694 / 1635:96695 | label + checkbox | On/Off | label, checked | Multi-select options |
| Cow / Calf / Bull Counter _activated / _deactivated (+ _mobile) | 1781:98973/4, 1196:43679/80, 1724:897/8, 1780:3182–3187 | animal icon + count "008" | **activated** = dark-blue filled. **deactivated** = outlined. Mobile 100×40, desktop 132×40 | animalType, count, active | Dashboard counters (Vaquillas/Toros), cow list filters. The instance "Cow_Counter" appears on 7 screens |
| Switch Deactivated / Off / On | 481:0 / 481:7 / 481:549 | toggle 40×22 | disabled / off / on (green) | checked, disabled | Table rows (Header_Alerts_Mobile), settings |
| Scroll / Scroll2 | 120:976 / 164:959 | custom scrollbar 8×216 | 2 styles | (none) | Long lists (desktop) |

### 2.2 Inputs

| Symbol | Id | Placeholder (es) / gloss | Size | Variants | Used in |
|---|---|---|---|---|---|
| Menu Rancho | 81:688 | "Nombre del Rancho" / ranch name (dropdown) | 220×40 | (none) | Every screen header (122 instances). Web "change-ranch" 200×40 |
| Dropdown Nano | 84:1400 | "1234" | 160×40 | (none) | Numeric pickers |
| Dropdown Chico | 84:1405 | "DD/MM/AAAA" | 209×40 | (none) | Date fields |
| Dropdown Mediano | 84:1410 | "Holstein" (breed) | 280×40 | (none) | Breed select |
| Dropdown Medium deactivated | 130:1382 | "Variable" | 320×40 | disabled | Forms |
| Search Box 40h | 176:227 | "ID Vaca" + magnifier | 280×40 | (none) | Cow list |
| Search Box 40h with filter | 925:41056 | magnifier + "ID Vaca" + chevron | 280×40 | combobox | Cow list/filters |
| Textbox Main-Grande | 49:1986 | "Nombre de tu rancho" / your ranch name | 624×48 | centered | Onboarding account |
| Textbox Main-Mediano | 84:1426 | "Nombre (s)" / first name(s) | 300×48 | centered | Sign-up |
| Textbox Mediano / Chico / Nano | 84:1415 / 83:1172 / 83:1180 | "0000-0000-0000" / "0000-0000" | 280 / 200 / 160 ×40 | masked numeric | Phone/ID fields |
| ID SINIIGA | 1302:418 | label "ID SINIIGA" + "MX-00-00-0000-0000" | 205×34 | inline-label masked | Cow registry (Mexican national cattle ID) |
| Checkbox-On / Off | 84:799 / 84:757 | 16×16 | on/off | checked | Tables, filters |
| Radio-on / off | 951:8 / 951:9 | 16×16 | on/off | checked | Option cards |
| Date_Picker_Define | 2362:688 | "13 Mar / 28 Mar" range pill | 266×40 | (none) | Reports / date filter |
| Calendar_OneDate | 1892:100371 | "Seleccionar Fecha Inicio" / pick start date | 320×598 | single date | Event dates |
| Calendar_TwoDates | 1892:100429 | "Seleccionar Fecha Fin" / pick end date, range fill | 320×598 | range. Actions "Borrar" (clear) / "Cancelar" | Date range |

### 2.3 Navigation and structure

| Symbol / instance | Id | Description | Mobile/Web |
|---|---|---|---|
| Global-header (instance) | (spec page) | Blue_Dark 60h bar: bell (notifications) left, "- Nombre Usuario -" centered, avatar with red count badge right | Mobile/tablet. 129 instances |
| Home-Footer-nav (instance) | (spec page) | Bottom tab bar, Smartbell_Blue bg. Tabs **VACAS** (cows), **GRUPOS** (groups), **HISTORIAL** (history), **REPORTES** (reports), **ALERTAS** (alerts); icon + 10pt uppercase label, underline on active | Mobile/tablet only |
| Ranch-Selector (instance) | (spec page) | = Menu Rancho under header | Shared |
| Encabezado | 64:1 | Desktop header 1366×60: Smartbell logo, bell + badge, "-nombre usuario-", avatar, logout | Web (old) |
| Footer Onboarding / Footer System | 63:346 / 130:1502 | Desktop footer links: Preguntas Frecuentes (FAQ), Ayuda (help), Precios (pricing), Calcula tu eficiencia (efficiency calculator), Aviso de Privacidad (privacy notice), Términos y condiciones (terms) | Web |
| Sidebar (web) | W 5273-132 | 256-wide left nav in Web_Sizes frames | Web only |
| Tabs (instance) | (spec page) | Cow profile tabs | Shared |
| Accordion_Closed (instance) | (spec page) | Collapsible sections (registry, stall config, profile) | Shared |
| Pagination / Pagination_big | 118:360 / 1883:98509 | `< 1 [00] 00 >` / with ellipses | Shared |
| Steper Bar 1/2, 1/3, 1/4, 1/5 (card top / independent) | 716:1378, 1442:55793, 716:1284, 716:1411, 716:1560 | 8px progress bar on top of onboarding card, Blue_Light on Gray_Light | Shared |
| Stepper_Slider / 2 / 3 | 1196:43475 / 2186:206298 / 2315:175168 | Range slider "Meses" 1–9 with value labels/pins (2, 5) | Shared (filters, e.g. months pregnant / DIM) |
| Stepper_Slider3 | 2315:175168 | Efficiency gauge: Malo 45% (red), Aceptable 60% (orange), Bueno 75% (light green), Excelente 95% (green), with a pin (65%) | Reports / efficiency calculator |
| Stepper_Counter | 2315:175338 | Pin marker with value | Shared |
| Cow_counter_for_plan / - Red | 874:38168 / 873:38121 | "Llevas **15 vacas** de 50" / you have 15 of 50 cows. Blue normal, red near limit (45/50) | Plan/pricing limit |
| Alert_Message | 2467:174953 | Red banner + warning icon + close: "Selecciona al menos un canal" / select at least one channel | Shared (validation) |

### 2.4 Cards and data display

| Symbol / instance | Id | Description | Used in |
|---|---|---|---|
| Group Chip | 165:2132 | Paddock card 280×335. Blue title "Potrero General", description ("Este es el grupo general... ¡Aquí están todas las vacas en tu rancho!"), "Vacas en Potrero 001" bar, heat disc + "Vacas en Celo 000", footer "Editar ✎ / Eliminar 🗑". Web equivalent is CardItemGroup (W 5248-163688, 290×368; mobile 230×302 W 5249-163688) | Cow_Stall, Cow_Stall_lists |
| Generic-card (pattern) | (none) | KPI cards: colored tile (icon disc + caption) + two "NN label" rows; or header strip (DIM/Enfermas/Preñadas) + icon + count | Dashboard and 30 screens |
| Popover-Filter-card (pattern) | (none) | Bottom sheet for filters | Lists, filters, vaccination |
| Header Table / Component Table | 176:0 / 176:1 | Desktop table 1008 wide. Columns ☐, ID Vaca, Raza (breed), Estado (status), DIM, Grupo, Acciones (move ⇄, delete 🗑), sortable ⇅. Header DarkGray bg, white Open Sans 16 Semibold; row 48h PureWhite | Web/tablet lists |
| Header Table_Mobile / Component_Table_Mobile | 1635:95524 / 1635:95525 | 328 wide: ☐, ID Vaca, Estado, DIM, delete | Cow list, filters, sick list |
| Header Table_Mobile_Calf | 1810:97545 | ☐ ID Vaquilla, Estado, DIM | Heifer list |
| Header_Alerts_Mobile / Component_Alerts_Mobile | 2150:25 / 2150:24 | ID Vaca, Estado, DIM, switch toggle | Alerts per cow |
| Component_Table_Tablet (instance) | (spec page) | Tablet table row | Cow list (tablet) |
| ID_Event, Buttons_Events, Profile_Picture, Button_Eliminate_Cow, Icon_KPI_Event (instances) | (spec page) | Cow profile building blocks: event row with id, event action buttons, photo, delete cow, info dot | Cow_Profile*, Journal |
| Payment Methods: Mastercard / Visa / Paypal | 1109:29 / 1109:30 / 1109:27 | Card brand logos | Plans/billing |

### 2.5 Web-only components (Web_Sizes `5200:0`, from metadata)

Frames:

| Frame | Link | Size |
|---|---|---|
| GroupForm | W 5200-1 | 1576×864 |
| DashGroup | W 5273-131 | (not recorded) |
| GroupDetail | W 5281-163719, W 5282-163688 | (not recorded) |
| AnimalForm Desktop Cow | W 5310-163962 | (not recorded) |
| AnimalForm Desktop Heifer | W 5341-2 | (not recorded) |
| AnimalDetail Heifer | W 5363-164090 | (not recorded) |
| Cow Profile Heat_Confirmation | W 5363-163690 | 1366×768 |
| Tablet versions (AnimalForm- Tablet, GroupDetail - Tablet, GroupDash - Tablet) | (not recorded) | 362–377×670 |
| Mobile copies | (not recorded) | 360×750 |

Components:
- **primary-button / secondary-button** (W 5402-164704 / W 5402-164702): 40h, widths 74 / 125 / 130 / 164. Example labels: "Registrar evento" (log event); paired secondary/primary at 74w (likely Cancelar / Aceptar).
- **heat-event / pegnant-event / health-event dialogs**: 534 wide, heights 224 / 262 / 382 / 457 / 538 / 619. Padding 24. Title (e.g. "Registro de celo" / heat record), label "Evento a registrar" (event to record) + select 200×40, "Fecha de diagnóstico" (diagnosis date) date input, "Descripción" (description) textarea 485×120, primary button bottom-right. The variants are labelled by state constants: `CONFIRM_HEAT`, `NOT_HEAT`, `CONFIRM_CLEAN`, `CONFIRM_TREATMENT`, `CONFIRM_INSEMINATED`, `CONFIRM_PEV`, `DIRTY_WITHOUT_MEDICATION_HEAT`, `DIRTY_WITH_MEDICATION_HEAT`, `NOT_INSEMINATED_HEAT`, `PEV_HEAT`, `INSEMINATED_HEAT`. The screen inventories cover the domain meaning.
- **Sidebar** (256w), **change-ranch** (200×40, three positions in upper bar), **input** (187 / 300 ×40), **Table** (W 5280-0).

---

## 3. Icons inventory

### 3.1 Symbols/Iconos frame (M 83-790)

Brand:
- **Smartbell_Logo** (84:820): bell + wordmark, blue, 252×64
- **Smartbell_Logo_bco**: white version
- **favicon**: 16
- **Bell_icon** (1051:15): white bell on blue disc, 86

Feature discs (84×84 base; mobile about 60, tablet 80–92):

| Icon | Id | Look | Meaning |
|---|---|---|---|
| Icon_Cows_Heat | 84:851 | red outline disc, red cows | heat |
| Icon_Pregnated_Cows | 84:879 | navy disc, cow with red uterus | pregnant |
| Icon_Sick_Cows | 84:905 | white disc + red cross | sick |
| Icono DIM | 84:918 | navy disc + milk bottle | days in milk |
| Icon_Calf | 392:8896 | navy disc, cow + calf | calving |
| Icon_Vaccine | 2666:145498 | light-blue disc, calendar + syringe | vaccines/treatments. A separate 45px line Icon_Vaccine (1416:555) is a syringe |
| Icon_Ranch | 3220:100215 | light-blue disc, barn | ranch |
| Avatar | 893:95 | light-blue disc, farmer with hat | user avatar |

Animal line icons (50×40, gray outline; used in buttons/tables/counters):
- Icon_Cow_Adult (164:267)
- Icon_Bull (1022:41784)
- Icon_Cow_Calf (248:1171)

UI line icons:

| Icon | Id | Size |
|---|---|---|
| Search | 925:39480 | 22 |
| Show / No show (password eye) | 925:39085 / 84:1324 | 30 |
| Icon_Pencil | 118:259 | 22 |
| Icon_Garbage | 118:253 | 18×22 |
| Icon_Email | 888:430 | 28×18 |
| left / right arrow | 120:1176 / 120:1175 | 12×24 |
| up / down arrow | 894:37921 / 894:37920 | 17 |
| expand / contract | 541:28 / 1697:94004 | 10 |
| expand_2 / contract_2 | 2754:1362 / 2754:1354 | 20 |
| ImageIcon | 248:328 | 30×24 |
| Icon_Save | 370:5959 | 30 |
| Reply / Answer | 960:39927 / 961:2096 | 28×20 |
| Logout | 1118:42758 | 20×28 |
| Download | 1118:42768 | 28×20 |
| Stall (barn) | 974:41595 | 33×24 |
| Report_Icon (bar chart) | 1461:93759 | 32×30 |
| Alerts_Icon (calendar check) | 1461:93805 | 30×32 |
| Filter_Icon (sliders) | 1635:95122 | 28 |
| Diet_Icon (leaf/grain) | 2071:260309 | 22 |
| more_info_icon | 1118:43598 | 14 |
| Icon_KPI_Event (orange "i" dot) | 576:20419 | 16 |
| Icon_Medical_Event (red cross) | 600:1959 | 16 |
| Format_Icon (TXT file) | 1121:42929 | 45×58 |

Status marks (24): Green_Mark ✓, Red_Mark ✗, Orange_Mark ✓, LightGreen_Mark (empty). Also:
- OrangeDate_Icon (48): date badge "junio 2020"
- Alert_icon (36×29): red triangle

Alert channels:

| Channel | Large (70×60) | Small (v2) |
|---|---|---|
| email | Icon_Email 84:1255 | Icono Email2 |
| SMS | Icon_SMS 84:1266 | Icono SMS2 |
| Alerta Web | Icon_WebAlert 84:1272 | Icono WebAlert2 |
| Notificación | Icon_Notification 84:1283 | Icono Notificacion2 |

Illustrations (mascot cow, ~200–260×290–330; empty/success/error states):
- Cow_Sitted (1033:44695)
- Cow_Dancing (1033:44696)
- Cow_Glass_Milk (1033:44697)
- Cow_Sad (1033:44698)
- Bull_Glass_Milk (1302:1122)

### 3.2 Icons page (`3633:95078`, M 3633-95078): 32×30 frames, newer set (gray placeholder tiles with icon)

- **Animal Form**:
  - Información General de Animal (general info, clipboard)
  - Reproducción de Animal (reproduction, uterus)
  - Vaquilla / Toro / Vaca para Tipo de Animal (heifer/bull/cow animal-type)
  - Adicional (additional, clipboard +)
- **Animal Form - events**:
  - Celo (heat)
  - preñez (pregnancy)
  - parto (calving)
  - salud (health)
  - Borrar (delete)
- **Global Menu**:
  - Animales (animals)
  - Grupos (groups / Stall)
  - historial (history)
  - Reportes (reports)

Web file extras: `calf_blue 1`, `Vaca adulta` (28×17), sized 32×30 (W 5307-1, W 5397-0).

### 3.3 Export plan

1. **Line/UI icons → SVG sprite / icon components.** Export each symbol as SVG from Figma, normalise to a 24 viewBox (keep 32×30 artboards for the new set), strip fills to `currentColor` so the color tokens drive them. Name them kebab-case English with the Spanish alias in metadata: `icon-search`, `icon-heat`, `icon-pregnant`, `icon-calving`, `icon-health`, `icon-dim`, `icon-vaccine`, `icon-stall`, `icon-report`, `icon-alerts`, `icon-history`, `icon-cow`, `icon-heifer`, `icon-bull`, `icon-calf`, `icon-diet`, `icon-filter`, `icon-email`, `icon-sms`, `icon-web-alert`, `icon-push`...
2. **Feature discs** (multi-color KPI icons): export as SVG keeping their brand colors. Do not recolor them. Render at token sizes `disc-sm` 60 (mobile), `disc-md` 80, `disc-lg` 92 (tablet/desktop).
3. **Illustrations and logos**: SVG (fallback PNG @1x/@2x/@3x for the mascots if the vectors are heavy). Favicon set from `favicon` + Bell_icon (16, 32, 180, 192, 512).
4. **Payment logos**: SVG from the official brand kits, not the Figma copies.
5. Prefer the **Icons page set (3633:95078)** where it overlaps the older Iconos frame (it is the newer 32×30 system used by web Animal Form / Global Menu). Keep the old 84px discs only for dashboard KPIs.

---

## 4. Extraction plan (no code yet)

### 4.1 Token format

- **Single source**: `tokens.json` in the W3C Design Tokens format, with groups `color`, `font`, `text` (composite typography), `space`, `radius`, `shadow`, `size` (control heights, icon/disc sizes), `breakpoint`, `grid`.
- **Generated outputs** via Style Dictionary or a small script:
  1. **CSS custom properties** (`--sb-color-primary`, `--sb-text-title-md`, `--sb-shadow-card`, ...) on `:root`. Responsive type tokens switch at `600px` / `960px` media queries, which implements the mobile→tablet scaling table in §1.2.
  2. **Tailwind theme** (`theme.extend`) mapping `colors`, `fontFamily` (`display: Montserrat`, `body: Open Sans`), `fontSize` (with line-heights), `spacing` (4-based), `borderRadius`, `boxShadow` (`card`, `popover`, `onboarding`), `screens` (`md: 600px`, `lg: 960px`, `xl: 1280px`) to the CSS variables.
  3. Optional: a native theme object (React Native / Flutter) if mobile goes native, generated from the same JSON.
- Keep **raw** Figma names as primitive tokens (`smartbell.blue`) and expose **semantic** aliases (`primary`, `heat`, `text-muted`) to components. Components consume semantics only.
- Fonts: self-host Montserrat (400/500/600/700) and Open Sans (400/600/700 + 400 italic).

### 4.2 Component build order

1. Foundations: tokens, fonts, icon sprite, layout grid/container (4-col 16/20 mobile, 8-col 44/24 tablet, sidebar layout ≥1280).
2. Primitives: Button (variants `primary` blue, `cta` green, `soft` light-blue, `danger` red, `disabled` gray, `link` text; sizes 40/48; leading/trailing icon), IconButton (Add/Delete/Edit/Filter circles), Checkbox, Radio, Switch, TextField (+ masked: phone, SINIIGA `MX-00-00-0000-0000`), Select/Dropdown (Nano/Chico/Mediano widths become a `width` prop), SearchBox (+ with filter/combobox), DatePicker (single/range calendar), Textarea.
3. Selection controls: OptionCard (Boton Text On/Off, 2-line, Check), AnimalTypeToggle (Vaca/Vaquilla/Toro On/Off/inactive; compact mobile variant), AnimalCounterChip (Cow/Calf/Bull activated/deactivated, count), RangeSlider (Meses), EfficiencyGauge.
4. Feedback: ProgressBar / StepperBar (1/N), PlanLimitCounter (normal/red), AlertBanner (Alert_Message), Snackbar, Empty/illustration state (mascots), Badge (notification count).
5. Surfaces: Card (generic/onboarding), BottomSheet (Popover-Filter-card), Dialog (web event dialogs 534w), Accordion, Tabs.
6. Data display: DataTable (desktop columns; mobile compact columns; row actions; sortable headers; selectable; toggle column), Pagination, KPI tiles (KpiSplitCard: colored tile + two rows; KpiStatCard: header strip + disc + count; "Vacas en Sistema" SplitStatBar), GroupCard (Group Chip / CardItemGroup).
7. Navigation and shell: RanchSelector, GlobalHeader (mobile), BottomNav (mobile/tablet), Sidebar + WebHeader + WebFooter (desktop), Onboarding stepper footer (Omitir Paso / Regresar / Continuar).

### 4.3 Mobile-only vs shared vs web-only

| Scope | Components |
|---|---|
| **Shared** (same component, responsive tokens) | Button family, inputs, dropdowns, search, date pickers, checkbox/radio/switch, option cards, animal counters, sliders, progress/stepper bars, alert banner, cards, accordion, tabs, pagination, KPI cards, group card, event dialogs/forms, ranch selector, icons, illustrations |
| **Mobile/tablet only (<960)** | GlobalHeader (Blue_Dark bar with bell/name/avatar), Home-Footer-nav bottom tabs, Popover-Filter-card bottom sheet, compact `_mobile` toggles/counters, Table_Mobile row layouts, Boton Imagen photo picker (camera) |
| **Web only (≥960/1280)** | Sidebar (256), WebHeader (Encabezado with logout), Footer Onboarding/System link bars, full DataTable (Raza/Grupo/Acciones columns), custom Scroll bars, modal event dialogs (on mobile these are probably full screens; confirm), payment method logos (billing likely web) |

---

## 5. Open questions / inconsistencies

1. **Palette mismatches**: the official color board shows `F15C00` (orange) and `FF006A` (red), but the styles are `FF7B01` and `EB004E`. Which is canonical?
2. **Red vs DarkRed**: the dashboard spec annotates the "Celos a confirmar" tile background as `Smartbell_DarkRed #CA0E07`, but the render is magenta-red (`#EB004E`). Confirm which the heat color is.
3. **Color symbol names vs values**: "Color/Gray" renders `#4D5965` (DarkGray) and "Color/Gray Dark" renders `#333E49` (Smartbell_Black). There are two symbols named "Color/ Red Complementary" (Red and Pink). Typos: "ligth", "Semobold", "Smartbell_Grey" vs "Gray".
4. **Missing typography style**: the mobile spec references `40pt-Montserrat-Bold`, but only `40pt-Montserrat-Medium` exists. The 10pt uppercase style is named Semibold, but its CSS note says `bold`.
5. **Line heights**: the Figma text styles are set to auto (100%). The CSS notes give explicit line-heights (used above). Confirm which to honor.
6. **Desktop typography scaling** was never specified (designer TODO on the page). Only mobile and tablet are defined.
7. **Grids not measured** (rate limit): Desktop_regular 1366, iPhone_8/XS 375 and Tablets_horizontal 1024. The web frames (1332/1366) use a fixed 256 sidebar rather than a column grid. Confirm the desktop grid.
8. **Breakpoint semantics**: the frames are labelled `<600>900` (width 600–960, height ≥900?). Is height used as a breakpoint (750/900 rulers), or only as a scroll/fold guide?
9. **Two icon systems**: the older Iconos frame (84px discs, 50×40 animal line icons) and the newer Icons page (32×30). Web uses the newer one. Should mobile migrate?
10. **Two header systems**: mobile Global-header (Blue_Dark) vs desktop Encabezado (Smartbell_Blue with logo + logout) vs the Web_Sizes Sidebar layout. Is Encabezado deprecated by the sidebar design?
11. **Web button naming** (`primary-button` / `secondary-button`) is not a symbol in the mobile library, and its styling was not screenshotted. Do they map to the Blue and outline variants?
12. **Missing states in the library**: no hover, focus, pressed or error states for buttons or inputs. There is no input error style (only the Alert_Message banner), no loading/skeleton, no toast/snackbar symbol, and no modal/dialog symbol on mobile. A reference link to "states of UI screens" (uxdesign.cc) sits on the Symbols page, so these were intended but not drawn.
13. **Vuetify reference**: the spec assumes Vue/Vuetify (`v-progress-linear`). Confirm the target stack before choosing between Tailwind and a component library theme.
14. **Payment methods / plan limit** (Mastercard/Visa/Paypal, "Llevas 15 vacas de 50" = you have 15 of 50 cows) imply billing and a cow-count plan cap that no screen in these pages covers.
