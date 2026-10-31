# App queries that need a ranch filter

Generated on 2026-10-31 from the FlutterFlow export. Paths are relative to `lib/`.

**70 queries** across 10 collections.

Firestore rules are not filters: the final rules refuse any query that doesn't prove it stays inside one ranch. Each query below must add `where ranch_id == currentUserDocument.currentSelectedRanch` (a Firestore query equal-to filter in FlutterFlow), keeping its existing filters. A query with an `orderBy` plus the new filter may need a composite index; Firestore logs a link to create it.

`Users` and `Ranches` queries are covered separately in [deploy-runbook.md](deploy-runbook.md).

## BullDietChanges

| Current filter | File | Line |
|---|---|---|
| bull_id | `sb_04_animals/sb_03_animal_profile/bull_profile_general/bull_profile_general_widget.dart` | 2016 |
| bull_id | `sb_04_animals/sb_03_animal_profile/bull_profile_nutrition_logs/bull_profile_nutrition_logs_widget.dart` | 230 |
| bull_id | `sb_04_animals/sb_03_animal_profile/bull_profile_nutrition_logs/bull_profile_nutrition_logs_widget.dart` | 687 |

## BullWeightHeight

| Current filter | File | Line |
|---|---|---|
| bull_id | `sb_04_animals/sb_03_animal_profile/bull_profile_general/bull_profile_general_widget.dart` | 937 |
| bull_id | `sb_04_animals/sb_03_animal_profile/bull_profile_general/bull_profile_general_widget.dart` | 1235 |
| bull_id | `sb_04_animals/sb_03_animal_profile/bull_profile_general/bull_profile_general_widget.dart` | 2734 |
| bull_id | `sb_04_animals/sb_03_animal_profile/bull_profile_logs/bull_profile_logs_widget.dart` | 269 |
| bull_id | `sb_04_animals/sb_03_animal_profile/bull_profile_logs/bull_profile_logs_widget.dart` | 442 |
| bull_id, dateTime | `sb_04_animals/sb_03_animal_profile/bull_profile_logs/bull_profile_logs_widget.dart` | 371 |
| bull_id, dateTime | `sb_04_animals/sb_03_animal_profile/bull_profile_logs/bull_profile_logs_widget.dart` | 685 |
| bull_id, dateTime | `sb_04_animals/sb_03_animal_profile/bull_profile_nutrition_logs/bull_profile_nutrition_logs_widget.dart` | 366 |

## Bulls

| Current filter | File | Line |
|---|---|---|
| Father | `custom_code/actions/can_delete_bull.dart` | 55 |
| Father | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 435 |
| Maternal_Grandfather | `custom_code/actions/can_delete_bull.dart` | 77 |
| Maternal_Grandfather | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 1730 |
| Maternal_Grandmother | `custom_code/actions/can_delete_cow.dart` | 77 |
| Mother | `custom_code/actions/can_delete_cow.dart` | 55 |
| Paternal_Grandfather | `custom_code/actions/can_delete_bull.dart` | 66 |
| Paternal_Grandfather | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 1079 |
| Paternal_Grandmother | `custom_code/actions/can_delete_cow.dart` | 66 |
| SINIIGA | `custom_code/actions/bulk_import_cows.dart` | 260 |
| SINIIGA | `custom_code/actions/validate_s_i_n_i_i_g_a.dart` | 50 |
| none | `components/bull_weight_edit_log/bull_weight_edit_log_widget.dart` | 105 |
| none | `components/bull_weight_new_log/bull_weight_new_log_widget.dart` | 105 |

## CowReproductionState

| Current filter | File | Line |
|---|---|---|
| cow_id | `custom_code/actions/delete_cow_and_related_data.dart` | 60 |

## CowWeightHeight

| Current filter | File | Line |
|---|---|---|
| cow_id | `custom_code/actions/delete_cow_and_related_data.dart` | 26 |
| cow_id | `sb_04_animals/sb_03_animal_profile/cow_profile_general/cow_profile_general_widget.dart` | 1393 |
| cow_id | `sb_04_animals/sb_03_animal_profile/cow_profile_general/cow_profile_general_widget.dart` | 2930 |
| cow_id | `sb_04_animals/sb_03_animal_profile/cow_profile_logs/cow_profile_logs_widget.dart` | 1477 |
| cow_id | `sb_04_animals/sb_03_animal_profile/cow_profile_logs/cow_profile_logs_widget.dart` | 1597 |
| cow_id, dateTime | `sb_04_animals/sb_03_animal_profile/cow_profile_logs/cow_profile_logs_widget.dart` | 1552 |
| cow_id, dateTime | `sb_04_animals/sb_03_animal_profile/cow_profile_logs/cow_profile_logs_widget.dart` | 1809 |
| cow_id, dateTime | `sb_04_animals/sb_03_animal_profile/cow_profile_nutrition_logs/cow_profile_nutrition_logs_widget.dart` | 394 |

## Cows

| Current filter | File | Line |
|---|---|---|
| Father | `custom_code/actions/can_delete_bull.dart` | 21 |
| Father | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 1015 |
| Father | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 1256 |
| Father | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 1666 |
| Father | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 1907 |
| Father | `sb_04_animals/sb_03_animal_profile/cow_profile_genealogy/cow_profile_genealogy_widget.dart` | 1089 |
| Father | `sb_04_animals/sb_03_animal_profile/cow_profile_genealogy/cow_profile_genealogy_widget.dart` | 1320 |
| Father | `sb_04_animals/sb_03_animal_profile/cow_profile_genealogy/cow_profile_genealogy_widget.dart` | 1720 |
| Father | `sb_04_animals/sb_03_animal_profile/cow_profile_genealogy/cow_profile_genealogy_widget.dart` | 1951 |
| Maternal_Grandfather | `custom_code/actions/can_delete_bull.dart` | 43 |
| Maternal_Grandmother | `custom_code/actions/can_delete_cow.dart` | 43 |
| Maternal_Grandmother | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 1971 |
| Mother | `custom_code/actions/can_delete_cow.dart` | 21 |
| Mother | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 665 |
| Paternal_Grandfather | `custom_code/actions/can_delete_bull.dart` | 32 |
| Paternal_Grandmother | `custom_code/actions/can_delete_cow.dart` | 32 |
| Paternal_Grandmother | `sb_04_animals/sb_03_animal_profile/bull_profile_genealogy/bull_profile_genealogy_widget.dart` | 1320 |
| SINIIGA | `custom_code/actions/bulk_import_cows.dart` | 248 |
| SINIIGA | `custom_code/actions/validate_s_i_n_i_i_g_a.dart` | 39 |
| groups | `custom_code/actions/update_cows_group_name.dart` | 28 |
| none | `components/cow_milk_edit_log_antibiotics/cow_milk_edit_log_antibiotics_widget.dart` | 64 |
| none | `components/cow_milk_edit_log_heifers/cow_milk_edit_log_heifers_widget.dart` | 64 |
| none | `components/cow_milk_edit_log_tank/cow_milk_edit_log_tank_widget.dart` | 63 |
| none | `components/cow_milk_new_log/cow_milk_new_log_widget.dart` | 63 |
| none | `components/cow_weight_edit_log/cow_weight_edit_log_widget.dart` | 104 |
| none | `components/cow_weight_new_log/cow_weight_new_log_widget.dart` | 103 |
| none | `components/delete_bull/delete_bull_widget.dart` | 59 |
| none | `components/delete_cow/delete_cow_widget.dart` | 59 |

## CowsDietChanges

| Current filter | File | Line |
|---|---|---|
| cow_id | `custom_code/actions/delete_cow_and_related_data.dart` | 49 |
| cow_id | `sb_04_animals/sb_03_animal_profile/cow_profile_general/cow_profile_general_widget.dart` | 2209 |
| cow_id | `sb_04_animals/sb_03_animal_profile/cow_profile_nutrition_logs/cow_profile_nutrition_logs_widget.dart` | 258 |
| cow_id | `sb_04_animals/sb_03_animal_profile/cow_profile_nutrition_logs/cow_profile_nutrition_logs_widget.dart` | 715 |

## Group_cow_changes

| Current filter | File | Line |
|---|---|---|
| cow_id | `custom_code/actions/delete_cow_and_related_data.dart` | 83 |

## cowHealth

| Current filter | File | Line |
|---|---|---|
| cow_id | `custom_code/actions/delete_cow_and_related_data.dart` | 72 |

## cowProductionPerDay

| Current filter | File | Line |
|---|---|---|
| cow_id | `custom_code/actions/delete_cow_and_related_data.dart` | 37 |
| cow_id | `sb_04_animals/sb_03_animal_profile/cow_profile_general/cow_profile_general_widget.dart` | 1676 |
| dateTime, cow_id, dateTime | `sb_04_animals/sb_03_animal_profile/cow_profile_logs/cow_profile_logs_widget.dart` | 277 |
