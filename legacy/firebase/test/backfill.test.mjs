import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { planRanch } from '../scripts/backfill-plan.mjs';

const ref = (id) => ({ id });
const row = (id, status = 'Active') => ({ user: ref(id), status });

test('active workers become members, without the owner or duplicates', () => {
  const plan = planRanch({ user_id: ref('o'), memberIds: ['a'], workesList: [row('a'), row('b'), row('o'), {}] });
  assert.deepEqual(plan.addMembers, ['b']);
  assert.deepEqual(plan.removeMembers, []);
});

test('a disabled worker does not become a member and loses any access', () => {
  for (const status of ['Disabled', 'Desactivado']) {
    const plan = planRanch({ memberIds: ['d'], invitedUsers: [ref('d')], workesList: [row('d', status)] });
    assert.deepEqual(plan.addMembers, []);
    assert.deepEqual(plan.removeMembers, ['d']);
    assert.deepEqual(plan.removeInvited.map((r) => r.id), ['d']);
  }
});

test('a worker removed since the backfill is dropped from both lists', () => {
  const plan = planRanch({ memberIds: ['gone', 'kept'], invitedUsers: [ref('gone'), ref('kept')], workesList: [row('kept')] });
  assert.deepEqual(plan.removeMembers, ['gone']);
  assert.deepEqual(plan.removeInvited.map((r) => r.id), ['gone']);
});

test('pending invites are counted', () => {
  const plan = planRanch({ memberIds: ['a'], invitedUsers: [ref('a'), ref('b')], workesList: [row('a'), row('b')] });
  assert.equal(plan.pendingInvites, 1);
});

test('a ranch with no workers plans nothing', () => {
  const plan = planRanch({ user_id: ref('o') });
  assert.deepEqual([plan.addMembers, plan.removeMembers, plan.removeInvited], [[], [], []]);
});
