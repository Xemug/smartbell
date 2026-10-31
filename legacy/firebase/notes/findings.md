# Lockdown findings (2026-10-31)

Where each finding comes from: **code** is the FlutterFlow export, **emulator** is a test in this folder, **console** is a read-only RevenueCat API call. Nothing here was read from live Firestore: those reads were blocked in this session, so run the scripts in [deploy-runbook.md](deploy-runbook.md).

The deployed rules are known from the screenshot the user shared. `firestore.deployed-model.rules` rebuilds them from that summary. It is a model, not a copy.

## Invites

- **Invites fail partway today (emulator, code).** `invite_user` updates the ranch, then updates the invitee\x27s `Users` doc. The own-doc rule refuses the second write, so the exception skips the success dialog and the Mixpanel event. The ranch has already changed, so the owner sees no confirmation for an invite that half worked. The invitee still finds the ranch in the ranch menu, which reads `Ranches.invitedUsers`, but not on the Ranches page, which reads `Users.invitedRanchesList`.
- **It also writes the wrong ranch (code).** The invitee\x27s list gets the owner\x27s first ranch (`ranchList.first`), not the selected one. Removing the write fixes this too.
- **`invitedRanchesList` isn\x27t needed.** `Ranches.invitedUsers` holds the same fact. The release stops reading it.
- **There is no accept step (code).** Tapping an invited ranch only writes `currentSelectedRanch`. The orchestrator decided that tap becomes accept, with no new screen.
- **`Users.email` can\x27t identify anyone (code).** Users can edit their own doc, so someone could copy a victim\x27s address and catch their invites. The callable resolves emails through Firebase Auth.
- **Removing a worker today only edits `workesList` (code).** `invitedUsers` keeps them. The release must also clear `memberIds` and `invitedUsers`.

## Premium

- **Entitlements (console).** `Pro` is premium: monthly, annual and lifetime products on both stores. `User` is a separate additional-seat entitlement, sold as consumables.
- **Seats need no handling here.** No screen reads RevenueCat entitlements at all, so seats aren\x27t enforced anywhere. The webhook looks only at `Pro`, so buying a seat never grants premium. Enforcing seats would be a new feature.
- **No webhooks exist (console), so nothing clears premium.** The app user id is the Firebase uid (`revenue_cat.login(user?.uid)` in `main.dart`).
- **The client write is in four screens (code):** `membership_onboarding` (twice), `membership_annual`, `membership_lifetime`. `membership_monthly` has no `premium: true` line in the export, so a monthly buyer may never get premium today. Check this on a device.
- **Older app versions.** After the final rules, their premium write is refused. The purchase itself goes through and the webhook sets premium, but the old screen then stops on the error instead of its success path.

## Queries the strict rules would refuse

76 of 113 app queries have no `ranch_id` filter, and strict rules refuse them, including 12 with no filter at all. The list is in [query-changes.md](query-changes.md). Several read every cow in the database only to show a loading state, for example `queryCowsRecord()` in `delete_cow`, which is also a cost and privacy problem today.

The bull weight form writes no `ranch_id`, so strict rules would refuse it and the old logs have none. The release fixes the form and the backfill fixes the logs.

## Algolia

- **Exposure (code).** The app ships the app id and search key in `lib/backend/algolia/algolia_manager.dart`. All the `search()` calls, for example `CowsRecord.search(term: ...)`, pass no ranch filter, and the export has none on the client. A client filter wouldn\x27t protect anything anyway: anyone can take the key from the app. Unless the key is restricted on the server, every indexed cow and bull is readable across ranches, whatever the Firestore rules say.
- **Not verified:** the indexed fields, record counts and any restriction on the key. `scripts/audit-live.mjs --algolia` prints them.
- **Fix, recommended:** after the Firestore queries are scoped, replace the search calls with a Firestore query on the current ranch, filtering the loaded list on the device, then delete the Algolia key and indexes. A dairy herd is small enough for this, and the new product drops Algolia anyway.
- **Alternative if server search must stay:** a callable that returns a secured key limited to the caller\x27s ranch. It needs `ranch_id` as a filterable attribute and the current key revoked. More work for something being retired.

Without one of these, cow data stays readable across ranches after the rules ship.

## Storage

`users/{uid}/**` is world-readable. The app stores `getDownloadURL` links, which carry a token and work without `allow read` (code), so public read doesn\x27t look needed for photos. Check that stored image fields are all tokenised links before changing it. Not changed in this work.

## Other

- `ff_user_push_notifications` lets any signed-in user send a push to any user. Left as it is: out of scope.
- A monthly-plan expiry for a lifetime member sends EXPIRATION. This is why the webhook asks RevenueCat for current state instead of trusting event types.
