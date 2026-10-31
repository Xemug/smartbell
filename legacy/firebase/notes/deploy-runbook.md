# Deploy runbook

The agent deployed nothing. Every step here is for the user, in this order. Each stage can stop safely before the next.

Do the work from a checkout of this repo:

```bash
cd legacy/firebase && npm ci && npm --prefix functions ci
```

## Rule 1: never press Deploy on FlutterFlow\x27s Firestore Rules page again

FlutterFlow\x27s Deploy replaces the live rules with the ones from its table, and it can\x27t express these. Its docs give the Exclude checkbox for collections with custom rules. In FlutterFlow, open **Firestore > Firestore Settings > Firestore Rules** and tick **Exclude** on every collection. Whether a full Deploy still replaces the whole file wasn\x27t tested, so treat that button as off-limits, and check the Firebase console after each FlutterFlow release.

## Stage 0: back up and measure (read-only apart from the export)

1. Export: `gcloud firestore export gs://<a-bucket-you-own>/pre-lockdown --project smartbell-app-2025`
2. Dry run: `node scripts/backfill-live.mjs --project smartbell-app-2025`. It prints counts only. Look at orphaned docs and ranches with no `user_id`: after the final rules nobody can read those.
3. Tamper check: `REVENUECAT_V2_KEY=<read-only v2 key> node scripts/audit-live.mjs --project smartbell-app-2025 --tamper`. Change nobody until you have reviewed it.
4. Algolia: `ALGOLIA_APP_ID=... ALGOLIA_SEARCH_KEY=... node scripts/audit-live.mjs --algolia`

## Stage 1: server, webhook and write lockdown (no app release needed)

This closes cross-ranch writes and deletes today. **Reads stay open until stage 3**, including every email and phone.

1. Pick a long random webhook secret. Set it, including the word Bearer, and the RevenueCat v1 secret key:
   ```bash
   npx firebase functions:secrets:set REVENUECAT_WEBHOOK_AUTH --project smartbell-app-2025   # value: Bearer <secret>
   npx firebase functions:secrets:set REVENUECAT_SECRET_KEY --project smartbell-app-2025     # value: sk_...
   ```
2. Deploy the functions. The separate `lockdown` codebase leaves FlutterFlow\x27s functions alone. Answer `false` to `REVENUECAT_ALLOW_SANDBOX`, or `true` while testing step 4:
   ```bash
   npx firebase deploy --only functions:lockdown --project smartbell-app-2025
   ```
3. In the RevenueCat dashboard, open **Project settings > Integrations > Webhooks > Add new webhook**. URL: the `revenueCatWebhook` URL printed by the deploy. Authorization header value: `Bearer <secret>`.
4. Send a test event from RevenueCat, then make a sandbox purchase, refund or expire it, and check `Users.premium` follows. Set sandbox back to `false` and redeploy.
5. Backfill: `node scripts/backfill-live.mjs --project smartbell-app-2025 --apply`. Existing workers become members so nobody loses access. It leaves `invitedUsers` alone because today\x27s app reads it.
6. Publish `firestore.stage1.rules` by pasting it in **Firebase console > Firestore > Rules > Publish**. Check the milk log, animals and tasks on a real phone. To undo, publish the previous version from the same page.

## Stage 2: FlutterFlow release

Add `memberIds` (List of String) to the `Ranches` schema first, then:

1. **Invite button** (`invite_user`): remove the `Users` query and both Update Document actions, and add a custom action. The first-ranch bug goes with them:
   ```dart
   final result = await FirebaseFunctions.instance.httpsCallable(\x27inviteUserByEmail\x27).call({
     \x27ranchId\x27: currentUserDocument!.currentSelectedRanch!.id,
     \x27email\x27: email,
     \x27rol\x27: rol,
     \x27status\x27: status, // \x27Active\x27 or \x27Activo\x27, as today
   });
   return result.data[\x27status\x27] as String; // invited, not_found, already_member, already_invited
   ```
   Show the existing success dialog for `invited` and the existing "email doesn\x27t exist" dialog for `not_found`. A `resource-exhausted` error means more than 20 tries in an hour.
2. **Accept** (`ranch_list_menu`, invited row, on tap): before the existing update, add an Update Document on the tapped ranch: `memberIds` Add to List with the user uid, and `invitedUsers` Remove from List with the user reference.
3. **Member ranches** (`ranch_list_menu`): add a list for `Ranches` where `memberIds` array-contains the uid. Without it a member loses the ranch from the menu after accepting.
4. **Ranches page** (`ranchlist`): feed "Ranches I\x27m invited to" from `Ranches` where `invitedUsers` array-contains the user reference, instead of `Users.invitedRanchesList`. Remove the unfiltered `queryRanchesRecord()` in `animals_log_tabbed`:640 and `onboarding_step03_insight1`:367, or filter them by `user_id`.
5. **Remove a worker** (`user_list`): add `memberIds` Remove from List and `invitedUsers` Remove from List. Only the owner can change workers now, so hide edit and remove from members.
6. **Purchase:** remove `premium: true` from `membership_onboarding` (two places), `membership_annual` and `membership_lifetime`. The webhook sets it within seconds. Go to the same success screen. Check the monthly screen as noted in findings.
7. **Bull weight form** (`bull_weight_new_log`): add `ranch_id`.
8. **Queries:** every entry in [query-changes.md](query-changes.md).
9. **Algolia:** apply the fix in [findings.md](findings.md).
10. **Minimum version:** read a Remote Config value `min_build` at startup (the app already initialises Remote Config) and show a blocking "please update" screen when the build is lower. This only reaches this build and later ones.

Test the release against the stage 1 rules, then again against the emulator with the final rules, for login, milk log, animals, tasks, invites and purchase.

## Stage 3: final rules

Publish `firestore.rules` the same way as stage 1.

**Older app versions can\x27t be forced to update**, because they have no gate. Once the final rules are live they show empty lists or errors on any unscoped query, invites fail, and a purchase ends on an error even though premium is set.

| Option | Good | Bad |
|---|---|---|
| Wait for adoption, then publish (recommended) | Few users break | Emails, phones and herd data stay readable by any account until then |
| Publish the day the release is live | Closes the exposure now | Everyone not yet updated gets a broken app until they update |

Recommendation: publish when adoption of the new build reaches about 90%, or two weeks after release, whichever is first, and send a push asking people to update on release day. If you learn of active abuse, publish at once. Use Mixpanel or the store consoles to see adoption. After publishing, raise `min_build` for later releases.

Check the live data for orphans (stage 0, step 2) right before publishing.
