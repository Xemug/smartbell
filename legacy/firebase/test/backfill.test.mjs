import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { PARENT_FIELD, RANCH_COLLECTIONS, planInvitedUsers, planMemberIds, sameList } from '../scripts/backfill-plan.mjs';

const ref = (id) => ({ id });

test('workers become members, without the owner or duplicates', () => {
  const ranch = { user_id: ref('o'), memberIds: ['a'], workesList: [{ user: ref('a') }, { user: ref('b') }, { user: ref('o') }, {}] };
  assert.deepEqual(planMemberIds(ranch), ['a', 'b']);
});

test('a ranch with no workers plans an empty list', () => {
  assert.deepEqual(planMemberIds({ user_id: ref('o') }), []);
});

test('a removed worker loses their leftover invite', () => {
  const ranch = { invitedUsers: [ref('kept'), ref('removed')], workesList: [{ user: ref('kept') }] };
  assert.deepEqual(planInvitedUsers(ranch).map((r) => r.id), ['kept']);
});

test('sameList ignores order', () => assert.equal(sameList(['a', 'b'], ['b', 'a']), true));

test('every collection with a parent field is covered', () => {
  for (const name of Object.keys(PARENT_FIELD)) assert.ok(RANCH_COLLECTIONS.includes(name));
});
