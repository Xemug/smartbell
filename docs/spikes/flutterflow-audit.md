# Spike: audit of the exported FlutterFlow app

Date: 2026-10-29. Status: read-only audit. Nothing was built, run or changed.

- **Source:** `/Users/juan/Development/smartbell-flutterflow/smartbell`. App name `smartbell`, version 1.3.0+205. Bundle/app ID `com.juanbordesontiveros.smartbell`. Firebase project `smartbell-app-2025`.
- **Size:** 525 Dart files under `lib/`, about 233k lines.
  - Live product code is in `lib/smartbell_m_v_p_01/` (184 files, about 137k lines).
  - FlutterFlow template code is in `lib/design_lab/` (220 files, about 57k lines).
- **Compared against:** `docs/domain-model.md` (§1–§4 and §7) and `docs/reconciliation-v4.md`.
- **Secrets:** this document names the files that contain keys and copies none of their values.

**Bottom line.** The app is a working Firebase MVP. Its features are milk logging, manual tasks, a cow and bull registry with genealogy, weight and diet logs, multiple ranches with invites, and a store paywall. It has **no reproductive engine**: the reproduction and health cards are fake doors. The code is generated, has no tests, and relies on inline Firestore queries in very large widgets. The security rules leave every ranch's data open to any signed-in user, and the `Users` collection is open to anyone. Treat the app as a **specification and a data source**, not as a code base to extend. The detail is in §7.

---

## 1. Inventory

### 1.1 Navigation shell
- **Router:** go_router, set up in `lib/flutter_flow/nav/nav.dart` with 116 `FFRoute`s, most of them template routes.
  - At `/`, a signed-in user gets `NavBarPage`. Anyone else gets `OnboardingStep00Slides2Widget` (the "insights-first" onboarding).
- **Bottom nav** (`lib/main.dart`, `NavBarPage`, about L254): **Leche** (`MilkLogTabbed`) · **Animales** (`AnimalsLogTabbed`) · **Tareas** (`TaskList`) · **Perfil** (`MyProfile`).
  - Animales is a tab, so the shipped app goes beyond the "milk + tasks only" described in reconciliation-v4 §1. The registry is live; reproduction is not.
- **Startup** (`lib/main.dart`, in this order):
  1. Firebase init.
  2. `initMixpanel`, then `onesignal()`.
  3. Theme, i18n (en/es) and `FFAppState`.
  4. RevenueCat `initialize`.
  5. Crashlytics.
  6. Remote Config.
- **Login hook:** `revenue_cat.login(user.uid)` (main.dart about L103).

### 1.2 Live pages (`lib/smartbell_m_v_p_01/`, reachable from the nav or the onboarding entry)
I checked reachability with a reference walk from `NavBarPage` and the initial route. 57 of the 58 pages are reachable.

| Feature | Page (route) | What it does |
|---|---|---|
| **Auth** | `s_b_00_authentication/login2` (`/Login2`) | Email, Google and Apple login. Goes to MilkLogTabbed, or to the onboarding if it is unfinished |
| | `s_b_00_authentication/signup` (`/Signup`) | Older sign-up that starts onboarding flow 1 |
| | design_lab `forgot_password`, `privacy_policy`, `terms_of_service` | The only template pages that are live |
| **Onboarding 2 ("insights first", current entry)** | `onboarding_step00_slides2` → `onboarding_step01_signup2` → `onboarding_step01_welcome2` → `onboarding_step03_insight1` → `onboarding_step04_cow_profile_form` → `onboarding_step05_cow_compare` → `membership_onboarding` | Slides, then sign-up. Sign-up **auto-creates the ranch "Mi Rancho"** with the device location and sets `Users.rol` to "Dueño"/"Admin". Then a loss insight (§5), the first cow (a short form), a cow comparison and the paywall. Fires the `addUser` Cloud Function (OneSignal) and the Facebook `app_launch` event |
| **Onboarding 1 ("milk log", legacy, still reachable from `/Signup`)** | `onboarding_step00_welcome` → `onboarding_step01_ranch` → `onboarding_step02_goal` → `onboarding_step01b_herd_size` / `onboarding_step03_task_creation` → `onboarding_step04_milk_production` → `membership_onboarding` | Ranch form, goal, herd size (writes `cows_in_production`/`total_cows` on the ranch), first task, first milk log. Schedules a reminder push |
| | `onboarding_slides` | **Dead.** No inbound references |
| **Milk** | `milk_log_tabbed` (`/milkLogTabbed`, tab) | Dashboard with charts (tank, calves, antibiotics), litres per cow, prices, and a floating "new log" menu. The shake gesture schedules a 7 pm "Recuerda registrar tu producción" push |
| | `milk_log_history_tank`, `_heifers`, `_antibiotics`, `ranch_log_history`, `milk_price_log_history` | Paged histories with edit and delete bottom sheets (`components/milk_edit_log_*`, `cows_milk_price_*`, `cows_in_production_*`) |
| **Animals** | `sb_02_animal_lists/animals_log_tabbed` (tab) | Cows and Bulls tabs. Firestore list filtered by `ranch_id`. Algolia search. CSV bulk import of cows |
| | `sb_02_animal_lists/animal_groups` | Groups (potreros) list, edit, and group diet change |
| | `sb_01_animal_forms/cow_profile_form`, `bull_profile_form` | Create a cow or a bull |
| | 12 parent/grandparent forms (`cow_parents_forms/*`, `bull_parents_forms/*`, `*_grand_parents/*`) | Near-identical copies (3.9k–4.3k lines each) that create a mother, father or grandparent inline and link it back |
| | `sb_03_animal_profile/cow_profile_general`, `bull_profile_general` | Profile with DIM, average litres, genealogy, diet, and **Reproduction and Health cards that are fake doors** ("Feature under development → See Plans", about L2412 and L2680) |
| | `cow_profile_genealogy`, `cow_profile_logs`, `cow_profile_nutrition_logs`, and the bull equivalents | Genealogy tree, weight/height logs, milk logs, diet logs |
| **Tasks** | `sb_03_tasks/task_list` (tab), `task_creation`, `task_edition`, `task_view` | Manual tasks per ranch, ordered by due date. "Mark as done" **hard-deletes the doc** (`task_view_widget.dart` about L457) |
| **Profile and settings** | `my_profile` (tab), `edit_my_profile`, `ranchlist` (switch, create and edit ranches), `user_list` (ranch workers), `export_documents` (CSV export of cows, bulls and milk) | Multi-ranch switcher via `Users.currentSelectedRanch` |
| **Membership** | `membership_onboarding`, `membership_monthly`, `membership_annual`, `membership_lifetime` | RevenueCat paywalls (§4) |

The 34 bottom sheets and dialogs are in `lib/smartbell_m_v_p_01/components/`. They include:
- Milk, weight and diet new/edit logs.
- `delete_cow`, `delete_bull`.
- `invite_user`, `edit_user`.
- `new_ranch_log`, `edit_ranch`, `new_group_log`, `edit_group`.
- `floating_menu*`, `k_p_i_membership_profile`.

### 1.3 Template leftovers
- **`lib/design_lab/`** (220 files, 55 page widgets): FlutterFlow template library (e-commerce, e-learning, social, maps, calendar, paywall1/2, onboarding1/7/10, page templates).
  - All of it is registered in `nav.dart`.
  - Only `forgot_password`, `privacy_policy` and `terms_of_service` are reachable. The rest is dead.
- **`lib/your_app_screens_rename/page_template_scrolling_copy`**: dead.
- **`lib/walkthroughs/`** (`animals_lists.dart`, `log_milk_production.dart`): **live**. tutorial_coach_mark tours are used by `milk_log_tabbed` and `animals_log_tabbed`.
- **Schema-only leftovers**, never read or written by live code:
  - Collections: `CowReproductionState`, `cowHealth`, `Groups_Bulls`, `Group_bull_changes`.
  - Structs: `shop_list`, `messages`, `event`.
  - Enums: all of `enums.dart`; UI enums only.
  - The `GetApiData` API call, which points at jsonplaceholder.

---

## 2. Data model

### 2.1 Firestore collections (`lib/backend/schema/`)
Every field is nullable. `ref` means DocumentReference. Most collections carry `user_id` (ref, the creator) and `ranch_id` (ref); I do not repeat them below.

| Collection | Fields (Firestore name: type) |
|---|---|
| `Users` (doc id = Firebase uid) | email, display_name, photo_url, phone_number, userName: str; dateOfBirth: ts; userRole: str; premium: bool; created_time: ts; uid: str; ranch_list: ref[]; onboarding: bool; currentSelectedRanch: ref; onboardingStep: int; rol: str; lifetimeMember: bool (unused); invitedRanchesList: ref[]. **Subcollection** `fcm_tokens` (written by the `addFcmToken` function) |
| `Ranches` | user_id (owner); ranch_name; location: str (a `LatLng.toString()`); cows_in_production, total_cows: int; created_time, updated_time: ts; dateString: str; workesList: `WorkersStruct[]` {user: ref, rol, status, userName: str}; invitedUsers: ref[]; siniigaNumbers: bool. **Subcollection** `productionPerDays` |
| `Ranches/{id}/productionPerDays` | milk, milkHeifers, milkAntibiotics: int (litres); dateTime: ts; user_id: **str (uid, not a ref)**; ranch_id: ref. The class comment calls it "test for subcollection", but it is the live herd milk log |
| `cowProductionPerDay` | cow_id: ref; milk, milkHeifers, milkAntibiotics: int; dateTime: ts |
| `Cows_In_Production_change` | cow_in_production_log_change: int (the number of cows milked); created_time, updated_time: ts |
| `MilkPrices` | milkPrice: double; milkPriceDate: ts |
| `Cows` | Birthday, DeleteAt: ts; isDead, Healthy, CrossBreed_boolean: bool; Mother, Father, Paternal_Grandfather/Grandmother, Maternal_Grandfather/Grandmother: ref; Cow_Internall_ID [sic], SINIIGA, Breed, CrossBreed, CrossBreed_Level, AgeClass_Cow, image, delete_Reason, sold_type, group (denormalised name): str; DIM_Cow, LactatingCycle: int; LastCalving: ts; groups: ref; group_change_date: ts; created_by: ref |
| `Bulls` | Same as Cows minus the lactation fields. Bull_Internal_ID, AgeClass_Bull, imgage [sic], CrossBreed_Boolean. No `group` string |
| `CowWeightHeight` / `BullWeightHeight` | cow_id/bull_id: ref; weight, height: int; dateTime: ts; weight_atBirth (bull: weight_atBirthday), weight_atWean, weight_atYear, height_atBirth/atWean/atYear: int |
| `CowsDietChanges` / `BullDietChanges` | cow_id/bull_id; feed_type: str; feed_change_date: ts; feed_amount, feed_cost: int; (cow) cow_reproduction_state: ref (unused) |
| `Groups` | name, description: str; number_of_cows: int |
| `Group_cow_changes` | groups_id, cow_id: ref; group_change_date: ts; group_change_reason, group_name: str |
| `Tasks` | task_name, task_category, task_description: str; task_creation_date, task_due_date: ts; created_by: ref. **No status, assignee or animal.** The category chips are never saved |
| Unused in code | `CowReproductionState` (cow_id, cow_reproductive_state, reproductive_date, reproductive_change_notes, insemination_bull, reproduction_cost); `cowHealth` (cow_health_state, health_change_date, notes, out_of_production, treatment_duration, treatment_cost); `Groups_Bulls`; `Group_bull_changes` |
| FlutterFlow push | `ff_push_notifications`, `ff_user_push_notifications` (scheduled pushes; see §3) |

- **Structs** (`schema/structs/`): `WorkersStruct` and `InvitedRanchesStruct` are live. `ChartCowsProductionStruct` and `MonthlyDataStruct` are chart view-models. `GroupsStruct`, `EventStruct`, `MessagesStruct` and `ShopListStruct` are template leftovers.
- **Enums** (`schema/enums/enums.dart`): UiCorners, Status, UiSize, UiType, EventRecurrency, UiAlign. None is a domain enum.
- **Enum-like domain values are free strings.** Dropdowns store the *localised display text*, including trailing spaces, for example `'Holstein '` and `'F4 (93.5% 15/16) '`. `rol` holds "Dueño"/"Admin" and "Veterinario"/"Veterinary" depending on the device language. **Expect mixed EN/ES values in production data.**
- **Supabase/SQL:** none. `sqflite` is a dependency, but no app code uses it.

### 2.2 Mapping to the domain model (§1 and §7)

| Firestore | Domain entity | Missing in Firestore | Conflicts and notes |
|---|---|---|---|
| `Users` | **User** | last_active_at; separate first/last name (only display_name/userName) | `premium`/`lifetimeMember` belong to Subscription, not User. `ranch_list`, `rol` and `invitedRanchesList` belong in Membership |
| `Ranches` | **Ranch** + **Membership** (`workesList`) | address, plan_id, vaccination_plan_status, RanchSettings | location is a stringified LatLng. Roles are free text: Field technician / Veterinary / Foreman, plus owner "Dueño". These map to TECNICO_CAMPO / MEDICO / **no "Encargado" role** in the domain / DUENO. No permission codes. Herd size (`cows_in_production`, `total_cows`) is a declared number, which matches §7.5's "declared × value" banner |
| `Cows` + `Bulls` | **Animal** (one table) | sex (implied by the collection: Cows=HEMBRA, Bulls=MACHO), development_stage, repro projection, removed_at as an event | `Cow_Internall_ID`/`Bull_Internal_ID` → `name_or_control_id`. `AgeClass_*` (Veal 0–6 mo, Weaned 6–12, Heifer 12–24, Cow 24+, Pregnant, Adult empty) is close to §7.1 `development_stage` (TERNERA, DESTETADA, NOVILLA, VACA_ADULTA, CARGADA, VACA_ADULTA_VACIA), but stored as localised text. Breeds: Holstein, Jersey, Simmental, Brown Swiss, Guernsey, Ayrshire, Shorthorn, French Normande; the domain adds OTRA and drops MIXTA. `CrossBreed_Level` matches FB–F1 (and carries the same "93.5%" label bug, reconciliation §4.9). `CrossBreed` → contributing_breed. `Mother`/`Father` → dam_id/sire_id. The four grandparent refs are redundant: derive them from the parents' parents. `DIM_Cow`, `LactatingCycle`, `LastCalving` and `Healthy` are typed in by hand, where the domain derives them from events (§2). **SINIIGA:** the app validates 10 digits with state code 01–32 and formats `484-00-SS-XXXX-XXXX` (`custom_code/actions/validate_s_i_n_i_i_g_a.dart`). The domain says 4–8 digits expanding to `MX-00-00-0000-1234`. Uniqueness is checked **globally across all ranches**, not per ranch |
| `isDead` / `delete_Reason` / `sold_type` / `DeleteAt` | **REMOVAL event** + status REMOVED | an event row | Reasons are "Data error at log", "Died" and "Sold", with "Sold to other ranch" and "Sold to slaughterhouse" as sub-options. These map 1:1 to ERROR_REGISTRO (hard delete via `delete_cow_and_related_data.dart`), MUERTE, VENTA_OTRO_RANCHO and VENTA_RASTRO |
| `CowWeightHeight` / `BullWeightHeight` | **WEIGHT events** + §7.1 weight_birth/weaning/one_year | — | Height has no domain field (add it or drop it). Integers only |
| `CowsDietChanges` / `BullDietChanges` | **DIET_CHANGE event** (§7.4: diet_type, daily_kg, daily_cost) | reason | feed_type → diet_type, feed_amount → daily_kg, feed_cost → daily_cost. Group-level diet changes fan out one doc per cow (`update_group_diet.dart`) |
| `Groups` | **Group** | type/preset, selection, auto_filter, kpi_indicator | `Cows.group` (a name) is denormalised and kept in sync by `update_cows_group_name.dart` |
| `Group_cow_changes` | **GROUP_CHANGE event** | from_group_id | Stores only the destination |
| `Tasks` | **Task** (§7.2) | source, kind, frequency, status, assignee, animal_id, completed_by/at, linked_event_id | Completion deletes the doc, so **there is no task history to migrate**. Categories (Change of paddock, Diet, Reproduction, Health, Other) match §7.2 `category` but are never saved |
| `productionPerDays` | **MilkHerdLog** (§7.3) | entered_by as a ref | The herd log is **split by destination** (tank/calves/antibiotics), but the domain has only total_liters and puts destinations on the per-cow log. No one-per-day rule: several logs per day are possible. Litres are integers |
| `cowProductionPerDay` | **MilkCowLog** (§7.3) | — | One row with three destination columns, where the domain has one row per destination |
| `Cows_In_Production_change` | none (derived in the domain) | — | The app divides litres by a **declared** number of milked cows. The domain divides by the count of lactating cows from the projection. Keep this as a fallback for ranches that have not registered their herd |
| `MilkPrices` | none | — | **New entity** for the domain: price per litre over time. It feeds the "loss" insight and the money KPIs |
| `CowReproductionState`, `cowHealth` | Event (HEAT, ILLNESS, …) | everything | Unused, so expect no data. Confirm in the console (§9) |
| (none) | Event/bitácora, Alert, Treatment, Vaccination*, HistoryEntry, Notification prefs, RanchSettings | — | Not present at all |

---

## 3. Backend usage

- **Cloud Functions** (`firebase/functions/index.js`, Node 22, firebase-functions v4; client wrapper `lib/backend/cloud_functions/cloud_functions.dart`):

  | Function | Kind | What it does |
  |---|---|---|
  | `addFcmToken` | callable | Saves FCM tokens to `Users/{uid}/fcm_tokens`. Called from `push_notifications_util.dart` |
  | `sendPushNotificationsTrigger` | onCreate `ff_push_notifications` | FlutterFlow broadcast push |
  | `sendUserPushNotificationsTrigger` | onCreate `ff_user_push_notifications` | Targeted push |
  | `sendScheduledPushNotifications` | pubsub, every 60 min | Sends scheduled pushes. This is how the 7 pm milk reminder works, so it is hour-granular |
  | `onUserDeleted` | auth onDelete | Deletes `Users/{uid}` |
  | `addUser` | callable | Creates the OneSignal user (external_id = uid, email subscription, tags). Called from onboarding step00/step04 |
  | `deleteUser` | callable | Deletes the OneSignal user by external_id |

  - `package.json` also lists braintree, stripe, razorpay, mux and langchain/openai/anthropic/google-genai. These are FlutterFlow defaults and nothing uses them.
  - `api_manager.js` is the generic FlutterFlow API proxy.
- **Secret hygiene:** `firebase/functions/index.js` hard-codes **OneSignal org/app REST API keys** (about L288–L292). Rotate them, and move them to Functions secrets in any future deploy.
- **Client-side keys** (public by design, but should move to config): RevenueCat iOS/Android public keys (`lib/main.dart`), Mixpanel token (`custom_code/actions/init_mixpanel.dart`), OneSignal app id (`custom_code/actions/onesignal.dart`), Algolia app/search key (`lib/backend/algolia/algolia_manager.dart`), Firebase web config (`lib/backend/firebase/firebase_config.dart`). Native Firebase config is in `android/app/google-services.json` and `ios/Runner/GoogleService-Info.plist`.
- **API calls** (`lib/backend/api_requests/api_calls.dart`): only `GetApiData` (jsonplaceholder), and nothing calls it. The app has **no external API dependencies**.
- **Algolia:** indexes `Cows`, `Bulls` and `Tasks` (the `search()` methods in `schema/*_record.dart`).
  - Used by `animals_log_tabbed` and `animal_groups`.
  - Results are filtered by ranch **on the client**, so the search key can return any ranch's animals.
  - The Firestore→Algolia sync is the FlutterFlow/Firebase extension, configured outside this repo.
- **Push**, two systems in parallel:
  1. FCM through the FlutterFlow functions above (scheduled reminders in onboarding and milk, via `triggerPushNotification`).
  2. **OneSignal** (`onesignal_flutter`; `actions.onesignal()` at start; the user is created by the `addUser` function). OneSignal is probably the marketing and journey channel. Check its journeys in the dashboard.
- **Remote Config** (`lib/flutter_flow/firebase_remote_config_util.dart`): one default key, `membership_annual` (paywall headline). No code reads it.
- **Analytics:**
  - Firebase Analytics: about 2,300 auto-generated `logFirebaseEvent` calls.
  - **Mixpanel** (`init/identify/track_mixpanel_event.dart`): about 165 call sites. Funnel events such as "Onboarding > …", "Action > Task creation end", "Create animal > Cow form extended", "paywall_loaded_*", "paywall_confirmed", "Signup start" and "Login". identify = uid.
  - **Facebook App Events** (`activate_app.dart`: `app_launch`; `purchase_event.dart`: `logPurchase`, hard-coded 'USD').
  - Crashlytics and Performance.
- **Auth** (`lib/auth/firebase_auth/`): **email/password, Google and Apple** are used. The anonymous, GitHub and JWT helpers are generated but unused. Password reset uses the design_lab forgot-password page.
- **Storage** (`firebase/storage.rules`): `users/{uid}/**` is world-readable and owner-writable. Animal and profile photos live there.

## 4. Subscriptions

- **Package:** `purchases_flutter` 10.2.3. Wrapper: `lib/flutter_flow/revenue_cat_util.dart`.
- **Identity:** `revenue_cat.login(uid)`, so **app_user_id = Firebase uid**.
- **Packages:** `current` offering, packages `$rc_monthly`, `$rc_annual` and `$rc_lifetime`.
  - Fallback prices in the UI are hard-coded ("24.99" etc.; see `membership_monthly_widget.dart` about L655).
  - Pages: `s_b_00_settings/membership_{onboarding,monthly,annual,lifetime}`.
  - `membership_onboarding` offers monthly and annual. `membership_lifetime` is reachable but not from the main flows (see reconciliation §4.5 on the lifetime licence).
- **Entitlement IDs:** **none are referenced.** `isEntitled`, `activeEntitlementIds` and `restorePurchases` are never called outside the util.
- **After a purchase:** if `purchasePackage` returns true, the client writes `Users.premium = true`, logs `purchaseEvent(amount, 'USD')` to Facebook, and goes to MyProfile.
  - No restore button.
  - No webhook. Nothing ever sets `premium` back to false, so lapses and refunds are never reflected.
  - `premium` is client-writable (§6), so anyone can set it.
- **Gating (corrected 2026-10-31):** `premium` does gate features, in the client only: invite users (`floating_menu`, `floating_menu_milk`, `user_list`), add a ranch (`ranchlist`), the four CSV exports (`export_documents`) and the WhatsApp community link (`my_profile`). Reproduction and health stay fake doors. The entry points to the paywall are:
  - the "Feature under development → See Plans" dialogs on the cow and bull profile Reproduction/Health cards;
  - the PayOption entries in `components/floating_menu*`;
  - the `KPIMembershipProfile` card on MyProfile;
  - the end of onboarding.

  In short, the paywall is a **fake door that sells a future reproductive module**.

## 5. Business logic

- **Custom functions** (`lib/flutter_flow/custom_functions.dart`):

  | Function | Rule | Compared with domain-model |
  |---|---|---|
  | `calculateDIM(lastCalving)` | today − LastCalving, floored at 0 | Same as §3.1, but the input is typed in, not derived from a CALVING event |
  | `getAverageMilkProduction(lastCalving, milk[])` | Sum of tank litres ÷ DIM | A per-cow lactation average. §7.3 wants a per-cow average and peak; this divides by DIM, not by the number of logged days, so it understates the average when days are missing |
  | `calculateMilkPerCowAverage(milk, cows)` | Litres ÷ declared cows, truncated to 2 decimals | §7.3 divides by lactating cows (see §2.2) |
  | `calculateLoss(liters, cows, price)` | `(25 − L/cow) × price × 30 × cows`, price default **10.5** | Onboarding "you are losing $X/month" insight. A 25 L/cow target and a 10.5 MXN/L default: **two new constants for RanchSettings** |
  | `calculateCattleAge` | Age in years, 1 decimal | Used for display |
  | `dailyLogReminderPush` | Next day 19:00 | The milk-reminder rule. The domain has no milk-log reminder; add one as a SYSTEM task kind or a Notification |
  | `productionDateTime`, `monthsList`, `totalCows`, `dateListToChart`, `chartVerticalValues`, `progressPercentage*`, `remainingCows`, calendar helpers | Period windows ("Last 7 days / Month / Quarter / Year") and chart shaping | §7.3 adds a Monday-start week and semester |

- **Custom actions** (`lib/custom_code/actions/`):
  - **Animal registry:**
    - `bulk_import_cows.dart`: CSV import. Accent-insensitive group matching, creates missing groups, resolves Mother/Father by SINIIGA.
    - `validate_s_i_n_i_i_g_a.dart`: see §2.2.
    - `can_delete_cow.dart` / `can_delete_bull.dart`: blocks the delete when the animal is anyone's parent or grandparent.
    - `delete_cow_and_related_data.dart`: batch hard delete of the cow and its weight, milk, diet, repro, health and group docs. Bulls get no equivalent cascade.
  - **Groups:**
    - `update_group_diet.dart`: one diet doc per cow in the group.
    - `update_cows_group_name.dart`: keeps the denormalised group name in sync.
  - **Export:** `export_c_s_v_*`.
  - **Analytics:** `init/identify/track_mixpanel_event`, `activate_app`, `purchase_event`.
  - **Push:** `onesignal`.
  - **Widget:** `custom_code/widgets/map_action.dart` (Google Maps location picker).
- **Reproduction, health and alerts:** **none.**
  - The repro state machine (§2) is absent.
  - So are the computed windows (§3.2–3.11), the event scheduling (§4), milk withdrawal (§3.6) and the alerts and automatic tasks (§7.2).
  - The only reproductive data is the hand-typed `LastCalving`, `LactatingCycle`, `DIM_Cow` and `AgeClass_Cow`.
  - The domain's projection must seed from these as `repro_stage` + `repro_stage_date` (§7.1).
- **Tasks:** manual only. Categories match §7.2 but are not saved. No frequency, assignee or animal.

## 6. Firestore security rules and indexes (`firebase/`)

- **`firestore.rules`:**
  - Every domain collection allows read, write and delete to **any signed-in user**. There is no `ranch_id` or membership check, so **any user can read or modify every ranch's herd**.
  - `Users` is `allow create, read, write: if true`. **It is open to unauthenticated clients.** Any client can read every email and phone number, set `premium`, or rewrite `ranch_list`. Delete is blocked.
  - `ff_user_push_notifications` checks the sender, which is the only scoped rule.
  - There is no rule for the `fcm_tokens` subcollection; only the Admin SDK writes it.
- **`storage.rules`:** `users/{uid}/**` is publicly readable.
- **`firestore.indexes.json`:** 12 composite indexes, plus 2 field overrides.
  - Tasks (ranch_id, task_due_date).
  - productionPerDays, collection and collection-group (ranch_id, dateTime desc).
  - Cows_In_Production_change ×2.
  - MilkPrices ×2.
  - cowProductionPerDay (cow_id, dateTime desc).
  - Cow/BullWeightHeight asc/desc.

  These indexes confirm the live query paths: milk, tasks and weights.
- **Implication:** the data is not tenant-safe today. If the Flutter app stays on Firebase even briefly, ship **membership-scoped rules first** and lock `Users` to the owner. Before any migration, check for tampering (unexpected `premium=true`, foreign writes).

## 7. Code quality and reuse

| Aspect | Finding |
|---|---|
| Structure | FlutterFlow layout: one folder per page (`*_widget.dart` plus `*_model.dart`). Pages run 500–4,300 lines with 10–20 levels of nesting. The 12 parent/grandparent forms are near-copies, about 48k lines in total |
| State | `FFAppState` (Provider ChangeNotifier, persisted with shared_preferences; holds stray test vars such as `errortest` and `temTest`) plus per-page `FlutterFlowModel`s. No domain layer or repositories. **143 `StreamBuilder`/`FutureBuilder`s query Firestore inline in the UI.** Business writes, such as `ProductionPerDaysRecord.createDoc(...).set(...)`, live in button callbacks |
| Generated coupling | Runtime: `flutter_flow_util`, `flutter_flow_theme`, `flutter_flow_widgets`, `nav.dart`, and `FFLocalizations`, which has about 3,200 strings keyed by random IDs such as `'j7ibcmbk'`. About 2,300 auto-named analytics calls. Dependencies are pinned exactly (including FlutterFlow git forks of `dropdown_button2` and `shake`). Leaving FlutterFlow is a one-way door: re-exporting would overwrite hand edits |
| Tests | `test/widget_test.dart` asserts `1 + 1 == 2`. Zero real tests. `analysis_options.yaml` uses flutter_lints only |
| Data typing | Domain values stored as localised strings. No enums. Integer litres and kg. Mixed ref/str user ids |
| Dead weight | design_lab (57k lines), unused auth providers, unused function dependencies, unused schema collections |

**Is it a viable base for agent-driven development outside FlutterFlow? Not as it stands.** An agent can edit it, but every feature would mean editing 3k-line generated widget trees that have no tests and no domain seam. The reproductive core, which is most of v1, has nothing to build on.

What a cleanup would take:

| Option | Work | Size |
|---|---|---|
| **A. Clean up in place** | Delete design_lab and dead routes. Replace the FF i18n with ARB. Add a repository/service layer and Riverpod/Bloc. Fold the 12 parent forms into one. Add enums and data cleaning. Add tests. Then build the repro engine and point the app at a new API | **L**: about as much as a rewrite, and you still inherit the FF widget style |
| **B. Rewrite the Flutter client against the new backend** | Reuse only assets, brand, copy and flows as the spec | **M–L**, depending on the v1 scope |
| **C. Keep it frozen on Firebase while the new product ships** | Lock down the rules (**S**). No new features. Then sunset it and migrate users | **S** now, plus the migration later |

**Recommendation:** C now, then B or a web/PWA client, depending on the stack decision (reconciliation §4.1). Do not adopt the exported code as the v1 base.

## 8. Migration notes (to Postgres)

- **Identity:**
  - `Users` doc id = **Firebase Auth uid**. The same uid is the RevenueCat app_user_id, the OneSignal external_id and the Mixpanel distinct_id.
  - Keep `firebase_uid` as a unique column on `user`, or reuse it as the user's external id.
  - Export users with `firebase auth:export`. It includes scrypt password hashes and the hash parameters from the console, so email users can migrate without a reset. Google and Apple users relink by provider uid and email.
  - Keeping the uid unchanged leaves RevenueCat, OneSignal and Mixpanel history intact.
- **What must move** (Firestore → Postgres):

  | Source | Target |
  |---|---|
  | `Users` | `user` (name split heuristically). `premium` becomes a hint only; RevenueCat is the source of truth |
  | `Ranches` | `ranch`. `location` parsed to lat/lng. `cows_in_production`/`total_cows` → declared herd size |
  | `Ranches.user_id` + `Users.ranch_list` + `workesList` + `invitedUsers` | `membership`. Owner = DUENO. Roles normalised from EN/ES text; "Encargado/Foreman" needs a domain role |
  | `Cows` + `Bulls` | `animal` (sex from the collection; normalise breed, level and stage; dam/sire from Mother/Father; drop the grandparent refs once they are checked for consistency) |
  | `isDead` etc. | status REMOVED + a REMOVAL event (reason mapping in §2.2) |
  | `LastCalving`/`LactatingCycle`/`AgeClass_Cow` | seed `repro_stage`, `repro_stage_date` and `lactation_number`. Optionally a synthetic CALVING event dated `LastCalving` so the projection works |
  | `*WeightHeight` | WEIGHT events + the birth/wean/year weight fields |
  | `*DietChanges` | DIET_CHANGE events |
  | `Group_cow_changes` | GROUP_CHANGE events |
  | `Groups` | `group` (CUSTOM, MANUAL) |
  | `productionPerDays` | `milk_herd_log`. Add destination columns or a child table. **Dedupe several logs on the same day** (sum or keep the latest; needs a decision) |
  | `cowProductionPerDay` | `milk_cow_log` rows per destination |
  | `MilkPrices` | new `milk_price` |
  | `Cows_In_Production_change` | new `declared_milking_cows` log |
  | `Tasks` | `task` (source MANUAL, status OPEN) |
  | Storage `users/{uid}/…` images | object storage; rewrite `image`/`photo_url` |
  | `fcm_tokens` | device tokens, if the new client keeps FCM |

- **Drop:** `ff_*push_notifications`, the unused collections (after confirming they are empty), and the Algolia indexes (use Postgres full-text or trigram search).
- **Data cleaning:** trim and map the localised strings, coerce the integer litres, resolve `user_id` str/ref, and keep SINIIGA unique nationally (domain-model §7.7).
- **Minimum feature parity**, to avoid regressing current users:
  1. Email, Google and Apple login.
  2. Ranch auto-create and the ranch switcher.
  3. Daily herd milk log by destination, with history and charts (week/month/quarter/year).
  4. Milk price log.
  5. Litres per cow per day.
  6. Cow and bull registry with parents, weights, diet and groups.
  7. Removal reasons.
  8. CSV import and export.
  9. Manual tasks.
  10. Inviting workers by email.
  11. Daily milk-log reminder push.
  12. Store subscription restore and recognition for existing RevenueCat subscribers. Use the same products or migrate them.

## 9. Open questions (need console data)

**Firestore** (project smartbell-app-2025):
1. Document counts per collection. Number of active users and ranches in the last 30/90 days. Is `CowReproductionState`/`cowHealth`/`Groups_Bulls` really empty?
2. How many `Users` have `premium=true`, and how many of those match a live RevenueCat entitlement? Is there any sign of tampering, given that the rules allow it?
3. What distinct values do `Breed`, `CrossBreed_Level`, `AgeClass_*`, `rol`, `workesList.rol`, `delete_Reason` and `sold_type` hold (the EN/ES mix)? What SINIIGA formats are in use?
4. How many `productionPerDays` days have more than one log? Do any ranches log per cow (`cowProductionPerDay`) at all?
5. Is the Algolia sync extension installed? Which fields does it index (privacy exposure)?
6. Auth provider split (email / Google / Apple). Password-hash parameters for the export.

**RevenueCat:**
7. Products and store IDs behind `$rc_monthly`, `$rc_annual` and `$rc_lifetime`, and their actual prices (USD and MXN). The entitlement ID(s) configured. Active subscribers and lifetime purchasers. Are webhooks configured anywhere?
8. Whether the lifetime product was ever sold (grant / lifetime licence, reconciliation §4.5).

**OneSignal and Mixpanel:**
9. Which OneSignal journeys or messages are live and depend on the `user_welcome` tag? Mixpanel funnel volumes for onboarding → paywall (to size the paywall's conversion before choosing pricing).
10. Is the shipped store build the same version as this export (1.3.0+205)? Is it the latest from FlutterFlow?

## 10. RevenueCat facts (planner, from the RevenueCat API, 2026-10-29)

- Project "Smartbell Dairy Farmers App" (`projca1c5dee`) has two apps: App Store and Play Store, both `com.juanbordesontiveros.smartbell`, with store credentials configured.
- Last 28 days: **24 active users, 6 new customers, 1 active subscription, MRR ≈ $83 MXN, revenue $0, 0 trials.**
- Entitlements:
  - `Pro`: monthly (iOS `sb_rc_2499_1M` "$4.99" / Android `01:01` $5), annual (iOS `sb_rc_24999_12M` "$49.99" / Android `01:02` $50), lifetime (iOS `sb_rc_99999_LM` / Android `03`).
  - `User` (additional user, Android only, consumables `01user` / `12user`).
- Offerings: `default` (current; monthly / annual / lifetime, RevenueCat paywall) and `users`, whose packages are empty.
- **Inconsistency:** the iOS store identifiers encode 24.99 / 249.99 / 999.99 (matching the paywall in the store screenshots), while the display names say 4.99 / 49.99. Check the real prices in App Store Connect.

**Conclusion:** the user base is small, so data and subscriber migration is cheap. The assets worth keeping are the store listings, the bundle id, the RevenueCat project and the Firebase Auth uids, which key RevenueCat, OneSignal and Mixpanel.
