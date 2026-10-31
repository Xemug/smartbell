# Deploy runbook

The agent deployed nothing. Every step here is for the user, in this order. Each stage can stop safely before the next.

Do the work from a checkout of this repo:

```bash
cd legacy/firebase && npm ci && npm --prefix functions ci
```

## Rule 1: never press Deploy on FlutterFlow's Firestore Rules page again

FlutterFlow's Deploy replaces the live rules with the ones from its table, and it can't express these. Its docs give the Exclude checkbox for collections with custom rules. In FlutterFlow, open **Firestore > Firestore Settings > Firestore Rules** and tick **Exclude** on every collection. Whether a full Deploy still replaces the whole file wasn't tested, so treat that button as off-limits, and check the Firebase console after each FlutterFlow release.

## Stage 0: back up and measure (read-only apart from the export)

1. Export: `gcloud firestore export gs://<a-bucket-you-own>/pre-lockdown --project smartbell-app-2025`
2. Dry run: `node scripts/backfill-live.mjs --project smartbell-app-2025`. It prints counts only. Look at orphaned docs and ranches with no `user_id`: after the final rules nobody can read those.
3. Tamper check: `REVENUECAT_V2_KEY=<read-only v2 key> node scripts/audit-live.mjs --project smartbell-app-2025 --tamper`. Change nobody until you have reviewed it.
4. Algolia: `ALGOLIA_APP_ID=... ALGOLIA_SEARCH_KEY=... node scripts/audit-live.mjs --algolia`

## Stage 1: server, webhook and write lockdown (no app release needed)

This closes cross-ranch writes and deletes today. **Reads stay open until stage 3**, including every email and phone. One known gap until then: a log can claim someone else's animal in `cow_id` under the writer's own `ranch_id`, which can show on that animal or block its deletion on the old app. A per-document parent check would exceed the rules `get()` limit on group batches, and the final rules scope those queries, so this closes at stage 3.

1. Pick a long random webhook secret. Set it, including the word Bearer, and the RevenueCat v1 secret key:
   ```bash
   npx firebase functions:secrets:set REVENUECAT_WEBHOOK_AUTH --project smartbell-app-2025   # value: Bearer <secret>
   npx firebase functions:secrets:set REVENUECAT_SECRET_KEY --project smartbell-app-2025     # value: sk_...
   ```
2. Deploy the functions. `onRanchChanged` runs in `us-central1` by default; if the deploy complains about the Firestore region, add a `region` option matching the database in `functions/index.js`. The separate `lockdown` codebase leaves FlutterFlow's functions alone. `firebase.json` holds no rules, so this can't publish them. Allow sandbox for step 4 by setting it in a file:
   ```bash
   echo 'REVENUECAT_ALLOW_SANDBOX=true' > functions/.env.smartbell-app-2025
   npx firebase deploy --only functions:lockdown --project smartbell-app-2025
   ```
   `functions:lockdown` deploys the whole codebase. Check the output lists all four functions: `inviteUserByEmail`, `checkSiniiga`, `revenueCatWebhook` and `onRanchChanged`. If you deploy by function name instead, include `checkSiniiga`: the stage 2 release needs it live, and without it nobody on the new build can register an animal on a ranch with SINIIGA numbers turned on.
3. In the RevenueCat dashboard, open **Project settings > Integrations > Webhooks > Add new webhook**. URL: the `revenueCatWebhook` URL printed by the deploy. Authorization header value: `Bearer <secret>`.
4. Send a test event from RevenueCat, then make a sandbox purchase, refund or expire it, and check `Users.premium` follows. Then change that file to `REVENUECAT_ALLOW_SANDBOX=false` and run the same deploy command. Don't skip this: the deploy reads the file and won't ask, and the file is ignored by git. Left on `true`, sandbox purchases grant real premium.
5. Backfill: `node scripts/backfill-live.mjs --project smartbell-app-2025 --apply`. Run this once. It exits with an error if any write failed. Active workers become members so nobody loses access, and they keep their `invitedUsers` entry because today's app reads it. Disabled workers don't become members, and anyone with no active worker row is removed from both lists: the owner already took them off.
6. Publish `firestore.stage1.rules` by pasting it in **Firebase console > Firestore > Rules > Publish**. Check the milk log, animals and tasks on a real phone. To undo, publish the previous version from the same page.

## Stage 2: FlutterFlow release

Add `memberIds` (List of String) to the `Ranches` schema first, then:

1. **Invite button** (`invite_user`): remove the `Users` query and both Update Document actions, and add a custom action. The first-ranch bug goes with them:
   ```dart
   final result = await FirebaseFunctions.instance.httpsCallable('inviteUserByEmail').call({
     'ranchId': currentUserDocument!.currentSelectedRanch!.id,
     'email': email,
     'rol': rol,
     'status': status, // 'Active' or 'Activo', as today
   });
   return result.data['status'] as String; // invited, not_found, already_member, already_invited
   ```
   Show the existing success dialog for `invited` and the existing "email doesn't exist" dialog for `not_found`. A `resource-exhausted` error means more than 20 tries in an hour.
2. **Accept** (`ranch_list_menu`, invited row, on tap): before the existing update, add an Update Document on the tapped ranch: `memberIds` Add to List with the user uid, and `invitedUsers` Remove from List with the user reference.
3. **Member ranches** (`ranch_list_menu`): add a list for `Ranches` where `memberIds` array-contains the uid. Without it a member loses the ranch from the menu after accepting.
4. **Ranches page** (`ranchlist`): feed "Ranches I'm invited to" from `Ranches` where `invitedUsers` array-contains the user reference, instead of `Users.invitedRanchesList`, and add a list for `Ranches` where `memberIds` array-contains the uid. Without that second list an accepted ranch vanishes from this page. Remove the unfiltered `queryRanchesRecord()` in `animals_log_tabbed`:640 and `onboarding_step03_insight1`:367, or filter them by `user_id`.
5. **Remove or disable a worker** (`user_list`, `edit_user`): add `memberIds` Remove from List and `invitedUsers` Remove from List to both. Disabling then really cuts access. To bring someone back, remove them and invite them again, because the rules let people join only by accepting. Only the owner can change workers now, so hide these actions from members.
6. **Purchase:** remove the `premium: true` update from `membership_onboarding` (two places), `membership_annual`, `membership_monthly` and `membership_lifetime`. The webhook sets it within seconds. Go to the same success screen. If one stays, the purchase ends on an error under the final rules.
7. **Forms that write no `ranch_id`:** add `ranch_id` to the `cowProductionPerDay` create (two places in each form) in `cow_profile_form`, `onboarding_step04_cow_profile_form`, `cow_profile_form_cow_mother`, `cow_profile_form_cow_m_g_mother`, `cow_profile_form_cow_p_g_mother`, `cow_profile_form_bull_mother`, `cow_profile_form_bull_m_g_mother` and `cow_profile_form_bull_p_g_mother`, and to the create in `bull_weight_new_log`. Lines are in [findings.md](findings.md). Stage 1 hides this: under the final rules, adding a cow would end in an error.
8. **Queries:** every entry in [query-changes.md](query-changes.md), except the two `validateSINIIGA` queries, which go away. SINIIGA is a national id, so the duplicate check stays global, as it is today, but it moves to the `checkSiniiga` callable because the final rules can't allow a client lookup across ranches. Keep the function's format and state checks and its return codes, add a ranch argument, and replace both queries:
   ```dart
   // Pass the ranch this form saves as ranch_id. animalId is for a future edit form.
   Future<String> validateSINIIGA(String siniigaNumber, String ranchId, [String? animalId]) async {
     // ...today's cleaning, 'ERROR', 'ERRORStateCode' and formattedSINIIGA stay as they are...
     final result = await FirebaseFunctions.instance.httpsCallable('checkSiniiga').call({
       'siniiga': formattedSINIIGA,
       'ranchId': ranchId,
       if (animalId != null) 'animalId': animalId,
     });
     return result.data['status'] == 'available' ? formattedSINIIGA : 'ERRORCowQuery';
   }
   ```
   - **Don't catch errors and don't add new return codes.** The forms save whatever isn't a known error code as the SINIIGA number, so a new string would be written to the animal. An exception stops the button before anything is saved. That covers more than 60 checks an hour (`resource-exhausted`): the button then stops with no message, which was accepted for this release. Don't work around it in this function.
   - **Change the wording.** The callable says only available or taken, never cow or bull, so `ERRORCowQuery` now means either and `ERRORBull` no longer occurs. In the 15 forms, change the `ERRORCowQuery` snackbar to "This SINIIGA number is already registered" / "Este número SINIIGA ya está registrado". Otherwise a number held by a bull reads as assigned to a cow.
   - **Sold animals:** the old check counts them, so until this release a buyer can't register an animal even after the seller marks it sold to another ranch. With `checkSiniiga` the number is available in that case. If the seller sold it to a slaughterhouse, or the animal died, or the seller hasn't recorded the sale, it stays taken. The delete forms' sale labels must not change without updating `functions/lib.js`.
   - **`bulk_import_cows`:** its two SINIIGA queries look up an imported animal's parents, not duplicates. Filter them by `ranch_id` like the other queries: a parent belongs to the importing ranch.
9. **Algolia:** apply the fix in [findings.md](findings.md).
10. **Lost ranch:** at startup, read `currentSelectedRanch`. If the read is denied or the ranch is gone, clear it and open the ranch list. After a worker is removed or a ranch deleted, scoped queries are refused rather than empty, and the app's list screens would spin forever.
11. **Profile email:** `edit_my_profile` writes `Users.email` but not the sign-in email, and invites now use the sign-in email. Make that field read-only, or tell owners to invite the address people sign in with.
12. **Minimum version:** read a Remote Config value `min_build` at startup (the app already initialises Remote Config) and show a blocking "please update" screen when the build is lower. This only reaches this build and later ones.

Test the release against the stage 1 rules, then again against the emulator with the final rules, for login, milk log, animals, tasks, invites and purchase.

## Stage 3: final rules

Publish `firestore.rules` the same way as stage 1.

**Older app versions can't be forced to update**, because they have no gate. Once the final rules are live they show empty lists or errors on any unscoped query, invites fail, a purchase ends on an error even though premium is set, and registering an animal fails on ranches with SINIIGA numbers turned on, because the old duplicate check is refused.

| Option | Good | Bad |
|---|---|---|
| Wait for adoption, then publish (recommended) | Few users break | Emails, phones and herd data stay readable by any account until then |
| Publish the day the release is live | Closes the exposure now | Everyone not yet updated gets a broken app until they update |

Recommendation: publish when adoption of the new build reaches about 90%, or two weeks after release, whichever is first, and send a push asking people to update on release day. If you learn of active abuse, publish at once. Use Mixpanel or the store consoles to see adoption. After publishing, raise `min_build` for later releases.

After publishing, run the tamper check again: nobody can set `premium` from then on, but false values from before remain, and they still pass the app's gates and `inviteUserByEmail`. Clear the ones you approve by hand in the Firebase console. The webhook only updates a user when RevenueCat sends an event for them.

Right before publishing, catch up with what changed since stage 1, then check:

```bash
node scripts/backfill-live.mjs --project smartbell-app-2025 --reconcile --apply
node scripts/backfill-live.mjs --project smartbell-app-2025 --reconcile
```

This removes people owners took off or disabled on the old app and stamps logs written since stage 1. The second run must show nothing left to remove and no fixable docs. Always use `--reconcile` here: a plain run would turn pending invites into members.

The output also counts **invited, not yet members**. These are people invited after stage 1, who have been working in the ranch through the stage 1 allowance. After the final rules they see the ranch as an invite and must tap it once in the new app. Tell owners before publishing if the number is more than a few.
