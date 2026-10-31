# Lockdown findings (2026-10-31)

Where each finding comes from: **code** is the FlutterFlow export, **emulator** is a test in this folder, **console** is a read-only RevenueCat API call. Nothing here was read from live Firestore: those reads were blocked in this session, so run the scripts in [deploy-runbook.md](deploy-runbook.md).

The deployed rules are known from the screenshot the user shared. `firestore.deployed-model.rules` rebuilds them from that summary. It is a model, not a copy.

## Invites

- **Invites fail partway today (emulator, code).** `invite_user` updates the ranch, then updates the invitee's `Users` doc. The own-doc rule refuses the second write, so the exception skips the success dialog and the Mixpanel event. The ranch has already changed, so the owner sees no confirmation for an invite that half worked. The invitee still finds the ranch in the ranch menu, which reads `Ranches.invitedUsers`, but not on the Ranches page, which reads `Users.invitedRanchesList`.
- **It also writes the wrong ranch (code).** The invitee's list gets the owner's first ranch (`ranchList.first`), not the selected one. Removing the write fixes this too.
- **`invitedRanchesList` isn't needed.** `Ranches.invitedUsers` holds the same fact. The release stops reading it.
- **There is no accept step (code).** Tapping an invited ranch only writes `currentSelectedRanch`. The orchestrator decided that tap becomes accept, with no new screen.
- **`Users.email` can't identify anyone (code).** Users can edit their own doc, so someone could copy a victim's address and catch their invites. The callable resolves emails through Firebase Auth.
- **Removing a worker today only edits `workesList` (code).** `invitedUsers` keeps them. The release must also clear `memberIds` and `invitedUsers`.
- **Disabling a worker does nothing today (code).** `edit_user` stores `Disabled` or `Desactivado` in the row, and nothing reads it.

- **Deleted ranches leave their data behind (code).** `ranchlist` deletes only the `Ranches` doc. Anyone who knows the id could recreate it and own the leftovers, so `onRanchChanged` writes a tombstone the rules check, and the backfill adds tombstones for ranches deleted earlier.

## Premium

- **Entitlements (console).** `Pro` is premium: monthly, annual and lifetime products on both stores. `User` is a separate additional-seat entitlement, sold as consumables.
- **Seats need no handling here.** No screen reads RevenueCat entitlements at all, so seats aren't enforced anywhere. The webhook looks only at `Pro`, so buying a seat never grants premium. Enforcing seats would be a new feature.
- **No webhooks exist (console), so nothing clears premium.** The app user id is the Firebase uid (`revenue_cat.login(user?.uid)` in `main.dart`).
- **The client write is in five places (code):** `membership_onboarding` (twice), `membership_annual`, `membership_monthly`, `membership_lifetime`.
- **Older app versions.** After the final rules, their premium write is refused. The purchase itself goes through and the webhook sets premium, but the old screen then stops on the error instead of its success path.

## Queries the strict rules would refuse

77 of 114 app queries have no `ranch_id` filter, and strict rules refuse them, including 12 with no filter at all. The list is in [query-changes.md](query-changes.md). Several read every cow in the database only to show a loading state, for example `queryCowsRecord()` in `delete_cow`, which is also a cost and privacy problem today.

The backfill makes every active `workesList` entry a member, including invitees who never opened the ranch, because the export can't tell them apart: the app adds that row at invite time and nothing marks acceptance. Disabled workers are excluded. This was the orchestrator's call, so nobody loses access. Those people can already open the ranch today, and the dry run counts them. An owner can remove anyone afterwards.

17 creates write no `ranch_id`, so strict rules would refuse them. Adding a cow or finishing the onboarding cow step would end in an error. The release fixes the forms and the backfill stamps old logs from the parent animal.

- `bull_weight_new_log`:384
- `onboarding_step04_cow_profile_form`:1328, 1582
- `cow_profile_form`:3439, 3720
- `cow_profile_form_cow_mother`:3773, 4064
- `cow_profile_form_cow_m_g_mother`:3770, 4060
- `cow_profile_form_cow_p_g_mother`:3778, 4071
- `cow_profile_form_bull_mother`:3794, 4131
- `cow_profile_form_bull_m_g_mother`:3814, 4044
- `cow_profile_form_bull_p_g_mother`:3825, 4163

## Algolia

- **Exposure (code).** The app ships the app id and search key in `lib/backend/algolia/algolia_manager.dart`. All the `search()` calls, for example `CowsRecord.search(term: ...)`, pass no ranch filter, and the export has none on the client. A client filter wouldn't protect anything anyway: anyone can take the key from the app. Unless the key is restricted on the server, every indexed cow and bull is readable across ranches, whatever the Firestore rules say.
- **Not verified:** the indexed fields, record counts and any restriction on the key. `scripts/audit-live.mjs --algolia` prints them.
- **Fix, recommended:** after the Firestore queries are scoped, replace the search calls with a Firestore query on the current ranch, filtering the loaded list on the device, then delete the Algolia key and indexes. A dairy herd is small enough for this, and the new product drops Algolia anyway.
- **Alternative if server search must stay:** a callable that returns a secured key limited to the caller's ranch. It needs `ranch_id` as a filterable attribute and the current key revoked. More work for something being retired.

Without one of these, cow data stays readable across ranches after the rules ship.

## Storage

`users/{uid}/**` is world-readable. The app stores `getDownloadURL` links, which carry a token and work without `allow read` (code), so public read doesn't look needed for photos. Check that stored image fields are all tokenised links before changing it. Not changed in this work.

## Other

- `ff_user_push_notifications` lets any signed-in user send a push to any user. Left as it is: out of scope.
- A monthly-plan expiry for a lifetime member sends EXPIRATION. This is why the webhook asks RevenueCat for current state instead of trusting event types.
