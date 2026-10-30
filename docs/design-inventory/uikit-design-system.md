# Smartbell UI Kit (Moon-based) design system inventory

Source file: **"Smartbell UI Kit (Copy)"**, fileKey `61o8icnDCev7fz5IN4irtj`.

Pages covered:

| Page | Id |
|---|---|
| 02 - Foundations | `30390:24927` |
| 03 - Widgets | `31189:366` |
| 04 - Components | `31303:2` |
| 05 - Icons | `31916:36672` |

Link prefix: **K** = `https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=`. So "K 39718-19691" means https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=39718-19691.

Coverage:
- Full metadata was parsed for all 4 pages.
- Variables were read on 8 nodes: light colours, dark colours, typography, the Moon template frames, shadows, Button, Text Input.
- Screenshots were taken of: Colors (light), Grid & layout, Typography, Button set, Bottom Nav, Brand guidelines.
- About 24 Figma calls were used.
- Per-component screenshots were **not** taken for most widgets and components. Their variant/prop lists below come from component-variant names in the metadata, and their visuals were not checked.

What this file is:
- It is a **Moon Design System (moon.io) Figma kit**. Instances are named `MDS-TW-*` / `MDS-Public-TW-*`, there are "Moon / Light" and "Moon / Dark" THEME TEMPLATE boards, and a layer is called "Button {Replace to moon}".
- Its tokens were **re-mapped to FlutterFlow's theme schema**: colours Primary / Secondary / Tertiary / Alternate / Primary-background / Primary-text / Info…, and type styles Display / Headline / Title / Label / Body × Large / Medium / Small.
- Every widget/component slide has `Figma:` and `FlutterFlow:` reference fields (57 occurrences). This is the design library for the FlutterFlow app.
- The Cover is a template ("09 ProJECT / Month 2024", "REPLACE DESCRIPTION"), which dates the kit to about 2024.

Key frames:

| Frame | Link |
|---|---|
| Colors – Light mode | K 31170-4525 |
| Colors – Dark mode | K 31170-32828 |
| Typography | K 31175-32928 |
| Iconography spec | K 31603-1786 |
| Logo | K 31719-502 |
| Background photos | K 31787-7261 |
| Grid & layout | K 31944-509 |
| Shadows / Elevation (Moon template) | K 31078-544 |
| Brand guidelines | K 40617-240 |
| App icon exports (color) | K 40911-347 |
| App icon exports (white) | K 40912-348 |
| Widgets index | K 31243-4578 |
| Components index | K 31303-10478 |

---

## 1. Tokens

### 1.1 Color (Figma variables, collection with Light / Dark modes)

Legend for the "Stock / custom" column:
- **SB** = Smartbell brand value.
- **FF** = FlutterFlow default-theme slot name.
- **Moon** = inherited from Moon.

#### Brand colors (same in both modes)

| Variable | Light | Dark | Role | Stock / custom |
|---|---|---|---|---|
| Brand Colors/Primary | `#1460AA` | `#1460AA` | Primary actions (Fill button, active tab, focus ring), links | SB value in FF slot |
| Brand Colors/Secondary | `#57A7F5` | `#57A7F5` | Light-blue accent | SB |
| Brand Colors/Tertiary | `#BAE5FD` | `#BAE5FD` | Pale blue fill | SB |
| Brand Colors/Alternate | `#65D9AC` | `#65D9AC` | Brand green (CTA / positive accent) | SB |

#### Neutral colors (invert between modes)

| Variable | Light | Dark | Role |
|---|---|---|---|
| Neutral 1 | `#FFFFFF` | `#000000` | Surface / inverse |
| Neutral 2 | `#E2E2E2` | `#444444` | Borders, dividers, disabled bg |
| Neutral 3 | `#757B84` | `#949AA5` | Muted icons, placeholder |
| Neutral 4 | `#000000` | `#FFFFFF` | Max-contrast text |

All are generic, not Smartbell-specific.

#### Utility colors (FF slots)

| Variable | Light | Dark | Role |
|---|---|---|---|
| Primary-background | `#F9F9F9` | `#121212` | App/page background |
| Secondary-background | `#EBEBEB` | `#1F1F1F` | Cards, sections, input fills |
| Primary-text | `#333333` | `#E0E0E0` | Body text |
| Secondary-text | `#666666` | `#AAAAAA` | Secondary text |

#### Semantic colors (same in both modes)

| Variable | Value | Role | Note |
|---|---|---|---|
| Info | `#57A7F5` | Info | = Secondary |
| Warning | `#FEC011` | Warning | = old Smartbell_Yellow |
| Error | `#EB004E` | Error / danger | = old Smartbell_Red (heat red) |
| Success | `#369A73` | Success | = old Smartbell_Green_Dark |

#### Custom colors (alpha tints)

| Variable | Light | Dark | Note |
|---|---|---|---|
| Button-text | `#FFFFFF` | `#FFFFFF` | Text on Fill buttons |
| Opacity | `#2A2A2A1A` | `#FFFFFF1A` | Hover/pressed overlay (Moon "heles"-like) |
| Primary-60 / Primary-10 | `#073460` @60% / @10% | @60% / @30% | Base is **#073460** (the brand-guide navy), not #1460AA |
| Info-60 / -10 | `#4D8FF3` @60/10 | `#3448F0` @60/30 | Base differs from Info `#57A7F5` |
| Warning-60 / -10 | `#F4C158` | `#FFB319` | Base differs from Warning `#FEC011` |
| Error-60 / -10 | `#F85065` | `#FF4E64` | Base differs from Error `#EB004E` |
| Success-60 / -10 | `#4CCE80` | `#15B756` | Base differs from Success `#369A73` |
| Scrim | `#0000008F` | `#0000008F` | Modal / bottom-sheet backdrop |
| new-custom ×3 | (empty placeholders) | | Template leftovers |
| [Archived]/heles `#0000001A`, [Archived]/Pressed `#07346080` | | | Leftover Moon token names. They are still bound in Button and Iconography |

Brand-guideline palette (K 40617-240, "Colors" block):

| Hex | Note |
|---|---|
| **`#073460`** | Large tile: dominant brand navy, used as logo background |
| `#57A7F5` | |
| `#BAE5FD` | |
| `#97F6D2` | |
| `#F9FDFE` | |

`#073460` and `#97F6D2` are **not** theme variables. `#F9FDFE` is also absent from the theme, which uses `#F9F9F9` as background.

Moon template boards (K 31078-286 "Moon / Light", K 31078-331 "Moon / Dark", K 31078-376 "Supportive"):
- These are stock Moon swatch slots: Piccolo, Hit, Goku, Gohan, Beerus, Goten, Bulma, Trunks.
- They render as empty / hidden (the screenshot came back 1×1) and are bound to the FF variables above.
- Treat them as **template residue, not tokens**.
- Two "Hover" / "Focus" demo boards (K 31078-5017, K 31078-5035, "Hover Transparent bg Bulma") document Moon's state rule: hover = transparent overlay on the base colour.

### 1.2 Typography (FF / Material-3 scale, Figma text-style variables)

| Style | Family | Weight | Size | Line height | Letter spacing | Likely use |
|---|---|---|---|---|---|---|
| Display Large | Montserrat | Bold 700 | 56 | 64 | -1.5 | Hero numerals |
| Display Medium | Montserrat | Bold 700 | 48 | 56 | -1 | |
| Display Small | Montserrat | Bold 700 | 40 | 48 | -0.5 | KPI big numbers (old 40pt) |
| Headline Large | Montserrat | Bold 700 | 32 | 40 | -0.5 | Page title |
| Headline Medium | Montserrat | SemiBold 600 | 24 | 32 | 0 | |
| Headline Small | Montserrat | Bold 700 | 24 | 32 | 0 | Section title |
| Title Large | Montserrat | SemiBold 600 | 20 | 32 | 0 | |
| Title Medium | Montserrat | SemiBold 600 | 18 | 28 | 0 | Card titles |
| Title Small | Montserrat | SemiBold 600 | 16 | 24 | 0 | |
| Label Large | Open Sans | SemiBold 600 * | 16 | 24 | 0 | Buttons lg/xl, field labels |
| Label Medium | Open Sans | SemiBold 600 * | 14 | 22 | 0 | Buttons md (bound in Button) |
| Label Small | Open Sans | SemiBold 600 * | 12 | 18 | 0 | Buttons xs/sm, tags |
| Body Large | Open Sans | Regular 400 | 16 | 24 | -0.5 | Inputs (lg) |
| Body Medium | Open Sans | Regular 400 | 14 | 22 | 0 | Default body, inputs |
| Body Small | Open Sans | Regular 400 | 12 | 18 | 0 | Captions, helper/error text |

\* The Typography board labels the Label styles "Medium". The variables say SemiBold 600. **Variables win.**

Notes:
- The fonts are **Smartbell-customised**: stock Moon uses DM Sans, and stock FF defaults to Inter/Readex.
- The Brand guidelines page names **Open Sans** as the brand typeface ("Designed By Steve Matteson"; Light / Regular / SemiBold / Bold / ExtraBold shown).
- The SmartBell wordmark is set in a geometric bold that looks like Montserrat.
- There is no responsive type scaling defined. It is one scale for all breakpoints.

### 1.3 Spacing

From the Grid & layout board (K 31944-509) and the variables bound in Button and Text Input:
- **4-px base**. Scale shown: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Tailwind-style variable names (Moon is Tailwind-based):

| Group | Variables | Values |
|---|---|---|
| Paddings & Gaps | p-1, p-2, p-3, p-4, p-6, p-8 | 4, 8, 12, 16, 24, 32 |
| gap | gap/0 … gap/4 | 0, 4, 8, 12, 16 |
| Directional padding | px/2–4, py/1–4, pl/1–4, pr/2–4, pt/3, pb/2 | Same 4-based steps |
| Height | height/h-12 | 48 |

These are **stock Moon / Tailwind**.

### 1.4 Radii (stock Moon naming and values)

Interactive elements (buttons, inputs, chips):

| Token | Value |
|---|---|
| `--radius-i-xs` | 4 |
| `--radius-i-sm` | 8 (default for buttons and inputs) |
| `--radius-i-md` | 12 |

Surfaces (cards, sheets, dialogs):

| Token | Value |
|---|---|
| `--radius-s-xs` | 4 |
| `--radius-s-md` | 12 (seen on the Shadows board) |

Moon also defines s-sm 8 and s-lg 16. They were not observed bound here and are assumed present.

### 1.5 Elevation (stock Moon shadows, Light / Dark sets, effect variables)

| Token | Light | Dark |
|---|---|---|
| shadow-sm | `0 0 1px #00000066, 0 6px 6px -6px #00000029` | `0 0 1px #0000008F, 0 6px 6px -6px #000000A3` |
| shadow-md | `0 0 1px #00000033, 0 12px 12px -6px #00000029` | `0 0 1px #0000008F, 0 12px 12px -6px #000000A3` |
| shadow-lg | `0 0 1px #00000066, 0 8px 24px -6px #00000029` | `0 0 1px #0000008F, 0 24px 24px -6px #000000A3` |
| shadow-xl | `0 0 1px #00000033, 0 0 32px -8px #0000001F, 0 32px 32px -8px #00000014` | `0 0 1px #000000B8, 0 48px 48px -6px #000000E0` |

### 1.6 Grid and breakpoints (K 31944-509)

Grid board anatomy:
- Global navigation (side nav) **min/max 236 px**.
- Preferred content container **1328** (Full HD).
- Gutters 16 / 24 / 32.
- 12 or 16 columns; 20 or 24 for "big data".

Layout examples shown:

| Layout | Columns | Width | Gutter | Column width |
|---|---|---|---|---|
| Desktop | 12 | 1328 | 16 | 96 |
| Mobile | 4 | 360 | 16 | (not given) |

Breakpoints:
- **No explicit breakpoint tokens.** Only the two layouts (mobile 360, desktop 1328 + nav) are defined.
- Widget/component frames are drawn at **375** wide (iPhone). Example: App Bar 375×64, Bottom Nav 375×70, Bottom Sheet 375×812.
- Header Navigation has Desktop 1440×80 and Mobile 375×72 variants.
- There is no tablet layout.

### 1.7 Iconography spec (K 31603-1786)

- Default interface icon is 32 px (20 px content), outline stroke.
- Size pairs (placeholder → content):

| Placeholder | Content |
|---|---|
| 32 | 20 |
| 24 | 16 |
| 16 | 10 |
| 8 | 6 |

- Moon icon variants appear as `Text=bullets-list, Type=stroke, Size=16/24/32px` and `Other=moon, …`.

### 1.8 Brand assets (Smartbell-specific)

Logo (K 31719-502, K 40617-240):
- Variants: Horizontal, Horizontal Monochrome, Vertical, Vertical Monochrome, Logo Icon, Logo Icon Monochrome.
- Logo = white bell in a circle + "SmartBell" wordmark on navy `#073460`.
- Colour variants exist on `#073460`, `#57A7F5`, `#97F6D2` and `#F9FDFE` backgrounds.
- The guide includes safe-space and misuse rules: do not rotate, distort, add effects, or place on busy backgrounds.

Export frames:
- Color set (K 40911-347):
  - `logo_app_icon_{1024,512,256,128,96,72,48}_Color`
  - `logo_icon_120x120_Color`
  - `logo_splash_400x400_Color.png`
  - `logo_vertical_200x150_color`
  - `logo_horizontal_300x80_Color`
- White set (K 40912-348): the same files with the `_White` suffix.

Background photos (K 31787-7261), with source URLs in the frame:
- "Monterrey Sierra"
- "Gnome"
- "Desert"
- Dairy photos (`cows-farm-dairy-cow-cowshed-summer-pasture`, `cattleman-holding-tablet-observing-domestic-animals-milk-production`)

---

## 2. Components inventory

Almost everything here is **stock Moon / FlutterFlow-template**, recoloured by the Smartbell tokens. Nothing is dairy-specific.

Each section has three parts:
- a "Slide" doc frame (description + Figma / FlutterFlow fields),
- a "Component" demo frame,
- the variant set (linked below).

### 2.1 Widgets (page 03, index K 31243-4578)

| Component | Set link | Variant props (values) | Sizes / notes |
|---|---|---|---|
| Avatar | K 39718-6001 | Size 24/32/40/48/56/64; Type Picture/initial | |
| Bottom Sheet | K 39718-20333 | Drag handle T/F | 375×812 (inner `MDS-TW-Bottom Sheet` 320×216). Two "Design" frames (K 40694-15750, K 40694-16858) are 375-wide sheet examples |
| Button | K 39718-19691 | Type Fill/Outline/Ghost; Size xs/sm/md/lg/xl; Leading Icon T/F; State Default/Hover/Pressed/Focus/Disabled (150 variants) | Heights ≈26/30/38/48/56. Radius i-sm 8. Labels Open Sans SemiBold 12/14/16. Fill = Primary `#1460AA` + white text. Outline = Neutral-2 border, Primary-text label. Ghost = Primary text, no border. Disabled = Neutral-2 bg, Secondary-text. Pressed = darker navy (Primary-60 / `#073460`) |
| Checkbox | K 39718-21602 | Type Fill/Outline; Selected T/F; State Active/Disable | 24×24 |
| Chip | K 39718-21856 | State Unselected/Selected/Disabled; Size Small(32)/Medium(40); Icon T/F | |
| Count Controller | K 31243-3218 | Size xSmall 24 / Small 32 / Medium 40 / Large 48 | −/value/+ stepper |
| Date Picker | symbol K 32095-22875 (334×411) + "Days" row K 32093-11102 | Single component | Slides K 32261-2160 |
| Dialog | K 32217-8389 | Close button T/F | 375×812 modal |
| Divider | K 31243-4505 | Rotation Horizontal/Vertical | |
| FAB | K 31241-3894 | Type Fill/Outlined/Disabled; Size Small 56 / Large 72 | |
| Icon Button | K 31838-5135 | Type Fill/Outline/Ghost; Size xs–xl (24–56); State ×5; Circle Yes/No (150 variants) | |
| Image Type | K 31242-2593 | type 16:9, 1:1, 3:4, 9:16, Circle Border, Circle Small | |
| Progress Bar | K 39718-37453 | Variant Linear/Circular; Size xxSmall–Large (2/4/8/12/16 px tracks); pin T/F | |
| Radio Button | K 39718-37664 | State Selected/Not-Selected; Label T/F; Button Position Left/Right | |
| Segmented Control | K 39718-38647 | Items 2/3/4; Size sm 40 / md 48; Icon T/F | |
| Slider | K 31228-2568 | Variant Single/Range | |
| Page View Indicator | K 31228-3974 | active 1/2/3; size sm/lg | Dots |
| Snackbar | K 31225-8326 | Leading icon T/F; Line length Single/Multi; Close T/F | 320 wide |
| Tabs | K 39718-47803 | Type Default/Lined/Solid; Size sm/md; State Actived/Disabled; Leading/Trailing element; Icon only | |
| Tag | K 39718-48644 | Type Solid/Outline; Size Small 22 / Medium 30; Icon T/F | |
| Text Area | K 39718-49250 | Scaling T/F; Button F | 386×132 |
| Text Input | K 39718-51227 | Type Text/Number/Password/Search; Size sm/md/lg/xl; Floating label T/F; Input Label T/F; Leading/Trailing icon T/F; State Default/Active/Error (162 variants) | Heights 30–80 (with label). Radius 8. Body Medium/Large. Error = `#EB004E` border + Body Small helper |
| Toggle Button | K 31243-4236 | Size sm/lg; 1st/2nd active | Two-option pill, 272/304 wide |
| Toggle Switch | K 31224-5724 | State On/Off; Size 2xs/xs/sm; Icon T/F; Custom colour T/F | 28×16 – 60×32 |
| Tooltip | K 39718-53477 | Pointer T/F; position ×9 | |
| Placeholder | K 39724-22650 | (single) | Slot helper |

### 2.2 Components (page 04, index K 31303-10478)

Relevance key:
- **H** = high: an obvious use in Smartbell.
- **M** = maybe.
- **L** = likely unused template content.

| Component | Set link | Variant props | Relevance |
|---|---|---|---|
| Accordion | K 39718-2383 | Size sm/md/lg/xl; Expanded T/F; Expand icon T/F; Leading element F/Icon/True | H (registry, profile sections) |
| Alert | K 39718-5657 | Icon, Title, Close (T/F) | H (validation banners) |
| App Bar | K 31365-9938 | Background On/Off (375×64) | H |
| App Bar Element | K 32002-8131 | Element Avatar/Back/Icons/Logo/Title | H |
| Audio Player | K 32162-7767 | Default/Variant2 | L |
| Badge | K 32162-7805 | State/Size/Color/Dot/Left/Right/Just Icon (only Normal/Small/Blue/Off drawn; 16/24/32) | H (notification count) |
| Bottom Nav | K 31241-2891 | Type 4/5 menus; Menu Actived #1–#5 | H. Demo tabs Home/Explore/Favourite/Profile/Settings. Active = Primary blue icon + label. Bar bg `#F9F9F9` + top border. Icon 24 line, label Open Sans ~12 |
| Chart | K 31415-2517 | Type 1–9 | M (reports) |
| Chat Block | K 31304-5701 | send/receive, lines 1–3, corner sharp | L |
| Choice Chips | K 31332-6287 | Icon T/F; Size Small/Medium; Layout Row/Wrap | H (filters, multi-select) |
| Combobox | K 39718-22932 | Size sm–xl; Floating label; Input Label; Selected counter; Expanded | H (breed, group pickers) |
| Confirmation Box | K 31365-10148 | Status Success/Pending/Failed | H (event saved) |
| Credit Card | K 31389-8037 | 3 variants | M (billing) |
| Dropdown | K 39718-26010 | Type Single; Custom T/F | H |
| Event | K 32095-23708 | Default/Variant2 (269×86) | H (calendar event row) |
| Feed | K 31417-4929 | Image Short/Tall, Image+Text(+CTA/+Actions), User+Image | L |
| General Listing | K 31363-8447 | Image Type Circle/Square/None × Content Text/Text+Button/Text+Icon (375×83) | H (cow list rows) |
| Image Card | K 31362-5537 | type Avatar/Image Background/Image Card; align; Circle Button | M |
| Image Slider | K 31332-6309 | slider 1–7 | L (onboarding?) |
| Image Type Grid | K 31363-7266 | type 1–5 | L |
| Listing Tiles | K 31363-7947 | Type Checkbox/List/Switch/Switch 2 | H (settings, alert toggles) |
| Map | K 31374-4353 | map base/detail/direction/multiple location × dark | M (ranch location) |
| Pin Code | K 32162-5676 | Type Border/Box/Circle; Size md/lg; State; Input Type (72 variants) | M (OTP login) |
| Rating / Single Star | K 32162-3673 / K 32162-3938 | 0–5 stars, 3 sizes | L |
| Shop Listing | K 31365-8888 | Card / Card CTA / Card Counter / Tile… | L |
| Subscription Card | K 31384-6435 | Size S/M/L; Selected Yes/No | M (plans) |
| Tab Group | K 31318-5339 | Type Lined/Solid; 2/3/4 tabs (375×48) | H (cow profile tabs) |
| Text Block | K 31304-5324 | title + subtitle + details; align L/C/R | M |
| Timer | K 32162-9314 | SS, MM:SS, HH:MM:SS, HH:MM:SS:MS | L |
| Toast | K 31389-8098 | state success/error/loader (dark, 335×40) | H |
| Feature Cards | K 32735-3945 | Alignment Left/Center/no_icon (430 wide) | M (dashboard tiles) |
| Header Navigation | K 32735-3980 | Dropdown header nav / Desktop 1440×80, Mobile 375×72 | M (web header) |

### 2.3 Gaps (nothing in the kit for these Smartbell needs)

These need custom components:
- **Data table** (cow list with columns and sort). General Listing is row-only.
- **KPI stat cards** with feature discs.
- **Animal-type selector** (Vaca / Vaquilla / Toro). Segmented Control or Choice Chips could host it.
- **Animal counters**.
- **Group / paddock card**.
- **Plan limit counter**.
- **Pagination**.
- **Date-range calendar**. The Date Picker is single only, as far as the metadata shows.
- **Stepper footer** (Omitir / Regresar / Continuar).
- **Empty states** with the mascot illustrations.
- **Side nav** (236 px). It is specified on the grid board but not drawn as a component.

---

## 3. Icons inventory (page 05)

1,179 icon symbols, all **24 px**, in 21 category frames:

| Category | Id | Count | Category | Id | Count |
|---|---|---|---|---|---|
| Layout | 31916:54727 | 63 | Users | 31916:56708 | 41 |
| Charts | 31916:54918 | 49 | Media & devices | 31916:56833 | 108 |
| Security | 31916:55067 | 36 | Images | 31916:57159 | 29 |
| Education | 31916:55184 | 31 | Communication | 31916:57248 | 58 |
| Development | 31916:55279 | 57 | Editor | 31916:57424 | 104 |
| Arrows | 31916:55453 | 92 | Time | 31916:57738 | 28 |
| Finance & eCommerce | 31916:55731 | 79 | Files | 31916:57824 | 57 |
| General | 31916:55970 | 193 | Maps & travel | 31916:57997 | 45 |
| Alerts & feedback | 31916:56551 | 26 | Weather | 31916:58161 | 52 |
| Shapes | 31916:56631 | 25 | Ambitious Icons | 31916:58134 | 4 |
| Brand Icons | 32092:11025 | 4 (google, apple, ambitious ×2) | | | |

Naming:
- The set uses `kebab-name-NN` naming (`align-bottom-01`, `bar-chart-03`, `bell-01`, `calendar-check-01`, `user-01`). This is the **Untitled UI icon set** style (24 px stroke), not Moon's own icon names.
- "Ambitious" icons are the template vendor's logo marks.

Coverage for Smartbell:
- **No livestock or domain icons** (no cow, heifer, bull, calf, heat, pregnancy, syringe, barn or milk).
- Generic needs are covered: bell (alerts), calendar (events), bar-chart (reports), users, file, filter, search, edit, trash, plus, chevrons, eye, mail, phone, map-pin, settings, log-out.

**Stock vs custom:** the whole icon page is stock. The only Smartbell-specific graphics in this file are the logo / app-icon / splash exports (§1.8) and the dairy background photos.

---

## 4. Extraction plan (no code yet)

### 4.1 Token source

1. Export the Figma variable collections to W3C DTCG JSON with the Light and Dark modes: Brand, Neutral, Utility, Semantic and Custom colours; text styles; spacing; radii; shadows. Use the Variables REST API, or a plugin such as "Variables Export"/Tokens Studio.
2. Keep **two naming layers**:
   - (a) FF names (`primary`, `secondaryBackground`, `primaryText`, `bodyMedium`…). These are what FlutterFlow and Flutter `ThemeData` use.
   - (b) Moon semantic aliases (`piccolo` = primary, `goku` = primary-background, `gohan` = secondary-background / surface, `bulma` = primary-text, `trunks` = secondary-text, `beerus` = neutral-2 border, `chichi` = error, `krillin` = warning, `roshi` = success, `whis` = info, `hit` = alternate). Moon code libraries expect these, see §6.4.
3. Generate:
   - CSS variables (Moon expects `--piccolo`, `--goku`, … as RGB channels),
   - a Tailwind preset,
   - a Flutter `MoonTokens` / `ThemeData` file.
4. Fix the Custom-tint bases before export (see §6.3). Derive `primary-10/60` etc. from the real semantic colours.

### 4.2 Assets

- Logo and app icons: export from K 40911-347 / K 40912-348 as SVG (logo) and PNG (app-icon sizes already laid out: 48–1024, splash 400, horizontal 300×80, vertical 200×150).
- Icons: do **not** export the 1,179 Figma icons. Use the matching npm/pub package (Untitled UI icons, or Moon icons if Moon code is adopted), and add a small custom **domain icon set** from the older library (see design-system.md §3).
- Background photos: re-download from the source URLs in K 31787-7261 for licensing, rather than exporting from Figma.

### 4.3 Component mapping order

1. Theme and fonts (Montserrat 600/700; Open Sans 400/600, optionally 300/800 for brand use).
2. Primitives: Button, Icon Button, Text Input, Text Area, Checkbox, Radio, Toggle Switch, Chip, Tag, Divider, Avatar, Badge.
3. Selection: Segmented Control, Toggle Button, Choice Chips, Combobox, Dropdown, Date Picker, Slider, Count Controller.
4. Feedback: Alert, Snackbar, Toast, Progress (linear/circular), Confirmation Box, Tooltip.
5. Surfaces: Bottom Sheet, Dialog, Accordion, Tabs / Tab Group.
6. Shell: App Bar (+ elements), Bottom Nav (5 menus), Header Navigation (web), side nav 236 (custom).
7. Lists: General Listing, Listing Tiles, Event, Feature Cards.
8. Custom Smartbell components (§2.3).

---

## 5. Open questions / inconsistencies (this file)

1. **Navy:** the brand guide's main colour `#073460` is not a theme variable. It only appears as the base of Primary-60/10 and the archived Pressed token. Should it be a token (e.g. `primary-dark`)?
2. **Background:** the brand-guide palette has `#F9FDFE`, but the theme background is `#F9F9F9`.
3. **Tint bases:** the Custom tints (Info/Warning/Error/Success -60/-10) use bases (`#4D8FF3`, `#F4C158`, `#F85065`, `#4CCE80`) that do not match their semantic colours. They are template defaults that were never re-derived.
4. **Label weight:** the Typography board says "Medium" but the variables say SemiBold 600.
5. **Template residue:** Moon THEME TEMPLATE boards (empty/hidden), `[Archived]/heles` and `Pressed` tokens still bound, "new-custom" placeholder colours, "Button {Replace to moon}" layer, Cover "REPLACE DESCRIPTION".
6. **Dark mode:** it is defined for neutrals and utility colours only. Brand and semantic colours are unchanged, and `#1460AA` on `#121212` is low contrast (about 3:1). Is dark mode in scope at all?
7. **Breakpoints:** there is no tablet layout or breakpoint tokens. Components are drawn at 375 wide, but the grid says 360 mobile.
8. **Icon size:** the iconography spec says 32 px default, but every icon symbol is 24 px.
9. **`FlutterFlow:` links:** the slide fields exist, but their link targets are not readable via metadata. Confirm whether a FlutterFlow project / library is linked.

---

## 6. Reconciliation with previous analysis (`design-system.md`)

### 6.1 Which is newer and canonical

| | Older library (design-system.md) | This UI Kit |
|---|---|---|
| Files | Mobile `gv5ugNqVKPF8N2Ol5cQCyV` + Web `6UCRP77ZAdWb1ut1A91yJX` | `61o8icnDCev7fz5IN4irtj` |
| Era | About 2020 (assets dated "junio 2020") | About 2024 (template cover), with brand guidelines and app-icon exports |
| Stack implied | Vue + Vuetify (`v-progress-linear` notes) | FlutterFlow, built on Moon |
| Token tech | Colour/text **styles**, ad-hoc names (`Smartbell_Blue`, `18pt-OpenSans-Regular`) | Figma **variables** with Light/Dark modes, FF/M3 names, Tailwind spacing and radii |
| Component quality | Bespoke Spanish-named symbols, no hover/focus/error states | Full variant matrices with states (Default/Hover/Pressed/Focus/Disabled/Error) |
| Domain coverage | Rich (cow/heat/pregnancy icons, KPI discs, tables, animal toggles, mascots) | None (generic kit) |

**Verdict:**
- The **UI Kit is the newer, canonical foundation**: tokens, type scale, spacing, radii, elevation, generic components and brand/logo.
- The **older library is still the only source for domain-specific pieces**: feature discs, livestock icons, mascots, tables, KPI cards, animal selectors and counters.
- The brand hues carried over almost 1:1. The kit is a re-platforming of the same brand, not a rebrand.

### 6.2 Token-by-token

Colours:

| Concept | Old (design-system.md) | UI Kit | Status |
|---|---|---|---|
| Primary | Smartbell_Blue `#1460AA` | Primary `#1460AA` | **Match** |
| Primary dark | Smartbell_Blue_Dark `#063664` | Brand-guide navy `#073460` (not a variable; base of Primary-60/10) | **Conflict:** near-identical but different hex, and missing as a token |
| Primary light | Blue_Light `#57A7F5` | Secondary `#57A7F5` (also Info) | Match (renamed) |
| Pale blue | Light_Blue_2 `#BAE5FD` | Tertiary `#BAE5FD` | Match (renamed) |
| Green / CTA | Green `#65D9AC` | Alternate `#65D9AC` | Match. Role changes: "alternate", no longer the main CTA |
| Green dark | Green_Dark `#369A73` | Success `#369A73` | Match (now semantic success) |
| Green light | Green_Ligth `#97F6D2` | Brand-guide only, not a variable | Dropped from theme |
| Red / heat | Red `#EB004E` | Error `#EB004E` | Match. **Heat red and error now share one token** |
| Error dark red | DarkRed `#CA0E07` | (none) | Dropped |
| Pink tint | Pink `#FFF2FC` | Error-10 (`#F85065` @10%) | Replaced, different hue |
| Orange | Orange `#FF7B01` (board: `#F15C00`) | (none) | **Dropped**. The efficiency gauge "Aceptable" and orange marks lose their token |
| Yellow | Yellow `#FEC011` | Warning `#FEC011` | Match (now warning, replacing orange) |
| Text strong | Black `#333E49` | Primary-text `#333333` | Changed (neutral, not blue-grey) |
| Text | DarkGray `#4D5965` | Secondary-text `#666666` | Changed |
| Muted | Gray `#979797` | Neutral 3 `#757B84` | Changed |
| Border / track | Gray_Light `#DADADA` | Neutral 2 `#E2E2E2` | Changed |
| Page bg | White `#F9FDFE` | Primary-background `#F9F9F9` (brand guide still `#F9FDFE`) | Changed (minor) |
| Surface | PureWhite `#FFFFFF` | Neutral 1 `#FFFFFF` / Secondary-background `#EBEBEB` | Match / new |
| Dark mode | (none) | Full Light/Dark collection | New |

Other tokens:

| Concept | Old | UI Kit | Status |
|---|---|---|---|
| Fonts | Montserrat (display) + Open Sans (body) | Same pair | **Match** |
| Type scale | 24 ad-hoc styles; body 18/16; buttons Montserrat SemiBold 16 | 15-step M3 scale; body 14/16; buttons **Open Sans** SemiBold 12–16 | Conflict: smaller body, and buttons switch family |
| KPI numerals | 40 Montserrat Medium (spec said Bold) | Display Small 40 Bold | Resolved toward Bold |
| Responsive type | Mobile → tablet scaling table | None | Gap |
| Spacing | 4 base, inferred | 4 base, explicit (p-1…p-8, gap-0…4) | Match, now formal |
| Control height | 40 standard / 48 large | md 38–40 / lg 48 / xl 56; sm 30, xs 26 | Compatible |
| Radius | 4 everywhere; pill for bars | 8 interactive (4/12 alternates), 12 surfaces | **Conflict:** rounder look |
| Shadow | `0 4px 10px rgba(0,0,0,.25)` card; popover; onboarding | Moon shadow-sm/md/lg/xl (soft, 2-layer) | Replaced |
| Grid mobile | 4 col, 360, margin 16, gutter 20 | 4 col, 360, gutter 16 | Gutter differs (20 vs 16) |
| Tablet | 8 col, 768, margin 44, gutter 24; 600–960 tier | (none) | Gap |
| Desktop | Sidebar 256, content about 1050 | Side nav 236, container 1328, 12 col × 96 / gutter 16 | **Conflict** (256 vs 236) |
| Breakpoints | 600 / 960 / 1280 | None explicit | Keep old tiers unless decided otherwise |

### 6.3 Component-by-component

| Old component | UI Kit equivalent | Note |
|---|---|---|
| Boton Registrar Vaca / Grupo / 40h / 48h / Edit / Save / Responder / Answer / agregar foto / Weight / Health | **Button** Fill/Outline/Ghost, xs–xl, leading icon | Old colour-coded variants (green CTA vs blue) collapse into Primary Fill. Decide whether a green "Alternate" fill variant is needed |
| Boton 40h Deactivated | Button State=Disabled | |
| Delete (light-blue), Button_Delete (red ×) | Button / Icon Button + Error colour | No danger variant drawn. Add one |
| Button_Add / Button_edit_icon / Button_Filter | **Icon Button** (Circle Yes/No) / **FAB** | |
| Boton Omitir / Continuar / Regresar | Button Ghost | |
| Switch On/Off/Deactivated | **Toggle Switch** | |
| Checkbox / Radio | **Checkbox** / **Radio Button** | |
| Boton Text On/Off, 2 lines, Check | **Radio Button** with label / **Listing Tiles** / **Choice Chips** | |
| Boton Vaca / Vaquilla / Toro On/Off (+ mobile) | **Segmented Control** (3 items, icon) or **Toggle Button** | Needs livestock icons |
| Cow / Calf / Bull Counter | (none); Chip Selected + Badge could approximate | Custom |
| Menu Rancho, Dropdown Nano / Chico / Mediano | **Dropdown** / **Combobox** (sm–xl) | Width becomes a layout concern |
| Search Box (+ filter) | **Text Input** Type=Search | |
| Textbox Main / Mediano / Chico / Nano, ID SINIIGA | **Text Input** Text/Number + mask | Masks are code-side |
| Calendar_OneDate / TwoDates, Date_Picker_Define | **Date Picker** (single) | Range mode missing |
| Steper Bar 1/N | **Progress Bar** Linear | |
| Stepper_Slider (Meses) | **Slider** Single/Range | |
| Stepper_Slider3 efficiency gauge | (none) | Custom; loses the orange token |
| Alert_Message | **Alert** | |
| (no toast / snackbar / dialog in old) | **Snackbar**, **Toast**, **Dialog**, **Confirmation Box** | New, fills the old gaps |
| Accordion_Closed | **Accordion** | |
| Tabs | **Tabs** / **Tab Group** | |
| Pagination | (none; Page View Indicator is dots) | Custom |
| Global-header (Blue_Dark bar) | **App Bar** + App Bar Element | Bar colour now theme-driven (light bg) vs old navy bar. Decide |
| Home-Footer-nav (blue bg, 5 tabs) | **Bottom Nav** 5 menus | Kit style: light bar, blue active item. Old: blue bar, white items |
| Encabezado / Sidebar (web) | **Header Navigation** Desktop / side nav 236 (spec only) | |
| Popover-Filter-card | **Bottom Sheet** | |
| Generic-card KPI, Group Chip / CardItemGroup | **Feature Cards** / **Image Card** (partial) | Custom KPI and group cards |
| Header Table / Component Table (+ mobile variants) | (none); General Listing for mobile rows | Custom data table |
| Cow_counter_for_plan | Progress Bar + text / **Subscription Card** | |
| Payment methods logos | **Credit Card** | |
| Avatar, Boton Imagen | **Avatar**, **Image Type** Circle | |
| Feature discs, line icons, alert-channel icons, mascots | (none) | Keep from the old library |
| Smartbell_Logo, favicon, Bell_icon | Logo set + app-icon exports (§1.8) | **UI Kit wins** |

### 6.4 What Moon offers in code (from knowledge, verify versions before adopting)

React / web:
- **`@heathmont/moon-core-tw`**: Moon's React component library built on **Tailwind CSS** (v10+). It provides Button, IconButton, Input, InsetInput, Textarea, Checkbox, Radio, Switch, Chip, Tag, Avatar, Accordion, Alert, Modal, BottomSheet, Drawer, Dropdown, Combobox, MenuItem, Tabs, Tooltip, Popover, Snackbar, Progress, CircularProgress, Loader, Pagination, Search, Table (in `moon-table-tw` / older `moon-cmps-tw`) and others.
- Theming uses a Tailwind preset / plugin (`@heathmont/moon-core-tw/lib/private/presets/ds-moon-preset` or `withMoonTheme`) plus CSS custom properties named after Moon tokens: `--piccolo`, `--hit`, `--goku`, `--gohan`, `--beerus`, `--bulma`, `--trunks`, `--chichi`, `--krillin`, `--roshi`, `--whis`, and radii `--radius-i-*` / `--radius-s-*`. These are exactly the radius and spacing names bound in this kit.
- Companion packages: `@heathmont/moon-icons-tw` (icons), `@heathmont/moon-cmps-tw` (extra components such as Table, Pagination, Datepicker in some versions). An older styled-components line (`@heathmont/moon-core`) is legacy.

Flutter:
- **`moon_design`** on pub.dev (by Coingaming / Heathmont, "Moon Design for Flutter").
- It provides `MoonTheme` / `MoonTokens` as a `ThemeExtension`, plus `MoonFilledButton` / `MoonOutlinedButton` / `MoonTextButton`, `MoonTextInput`, `MoonTextArea`, `MoonCheckbox`, `MoonRadio`, `MoonSwitch`, `MoonChip`, `MoonTag`, `MoonAvatar`, `MoonAccordion`, `MoonAlert`, `MoonModal`, `MoonBottomSheet`, `MoonDropdown`, `MoonPopover`, `MoonTooltip`, `MoonToast`, `MoonTabBar`, `MoonSegmentedControl`, `MoonLinearProgress` / `MoonCircularProgress`, `MoonDotIndicator`, `MoonAuthCode` (pin code), `MoonMenuItem` and others.
- Icons come via `moon_icons`.

FlutterFlow:
- There is no first-class Moon integration.
- The kit's variables mirror FlutterFlow's **Theme settings** (colour slots and the Display…Body type scale). The FF app most likely uses native FF widgets themed with these values, not the `moon_design` package. This is an inference; confirm in the FF project.

### 6.5 What this means for the build

1. **Tokens:** adopt the UI Kit variables as the single token source, with the Light/Dark structure, the M3 type scale and Moon spacing/radii/shadows. Add back the domain tokens the kit lost: `heat` (= Error `#EB004E` or separate), `warning-orange` `#FF7B01`, `primary-dark` `#073460`, `success-light` `#97F6D2`.
2. **React / web:** `@heathmont/moon-core-tw` + Tailwind is a near-zero-translation path. Map Moon CSS vars (`--piccolo: #1460AA`, `--goku: #F9F9F9`, `--gohan: #FFFFFF` / `#EBEBEB`, `--bulma: #333333`, `--trunks: #666666`, `--beerus: #E2E2E2`, `--chichi: #EB004E`, `--krillin: #FEC011`, `--roshi: #369A73`, `--whis: #57A7F5`, `--hit: #65D9AC`) and set the font families to Montserrat / Open Sans.
   - Alternative: shadcn/Radix + a Tailwind theme from the same tokens, if Moon's maintenance cadence is a concern.
   - Either way the old Vuetify assumption in design-system.md is **obsolete**.
3. **Flutter (if leaving FlutterFlow or adding custom code):** `moon_design` can consume the same tokens via `MoonTokens`. Otherwise generate a `ThemeData` matching FF slots.
4. **Custom work is unavoidable** for:
   - data table,
   - KPI / feature-disc cards,
   - animal-type selector and counters,
   - group card,
   - efficiency gauge,
   - date-range picker,
   - pagination,
   - side nav,
   - domain icon set and mascots (port from the old library).

### 6.6 Conflicts needing the user's decision

1. **Canonical library:** confirm the UI Kit supersedes the 2020 Mobile/Web library for all foundations.
2. **Navy `#073460` vs `#063664`:** pick one, and decide whether it becomes a `primary-dark` token (header bars, pressed states).
3. **Primary CTA colour:** is the main CTA blue Primary (kit) or green `#65D9AC` (old "Agregar Vaca" / "Registrarme")?
4. **Heat vs error:** keep the heat red as the same token as error (`#EB004E`) or separate them?
5. **Orange:** reinstate it (`#FF7B01` or `#F15C00`) for "Aceptable" / medium-severity states, or use Warning yellow `#FEC011`?
6. **Neutrals:** adopt the kit's pure greys (`#333 / #666 / #757B84 / #E2E2E2`) over the old blue-greys (`#333E49 / #4D5965 / #979797 / #DADADA`)?
7. **Background:** `#F9F9F9` (theme) or `#F9FDFE` (brand guide / old)?
8. **Radii:** 8 / 12 (kit) or 4 (old)?
9. **Body size:** 14 (kit Body Medium) or 16–18 (old)? Note that the target users are farmers in the field, so larger text may matter.
10. **Button font:** Open Sans SemiBold (kit) or Montserrat SemiBold (old)?
11. **Header and bottom-nav styling:** light App Bar / Bottom Nav (kit) or solid navy / blue bars (old)?
12. **Side-nav width:** 236 (kit grid) or 256 (old web)? Plus tablet/breakpoint tiers: keep the old 600 / 960 / 1280.
13. **Dark mode:** in scope for v1?
14. **Code stack:** Moon React (`moon-core-tw`) vs another Tailwind kit for web, and whether the FlutterFlow app stays the mobile client or is replaced.
