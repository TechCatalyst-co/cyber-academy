// MongoDB adapter behaviour: id mapping, unique keys, and query-operator injection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMongoStore, toFilter } from '../server/store-mongo.js';
import { createFakeMongoClient } from './fake-mongo.js';

const make = async () => {
  if (process.env.TEST_STORE === 'mongo' && process.env.MONGODB_URI) {
    const s = await createMongoStore({ uri: process.env.MONGODB_URI, dbName: process.env.MONGODB_TEST_DB || 'cyber_academy_test' });
    await s.dropAll();
    return { s, done: async () => { await s.dropAll(); await s.close(); } };
  }
  return { s: await createMongoStore({ client: createFakeMongoClient(), dbName: 't' }), done: async () => {} };
};
const tenant = (id, slug) => ({ id, name: slug, slug, plan: 'premium', status: 'active', program_start: '2026-01-01T00:00:00.000Z', settings: { pass_mark: 90 }, created_at: '2026-01-01T00:00:00.000Z' });

test('rows round-trip with id stored as _id and JSON kept as objects', async () => {
  const { s, done } = await make();
  await s.insert('tenants', tenant('t1', 'alpha'));
  const t = await s.get('tenants', 't1');
  assert.equal(t.id, 't1');
  assert.equal(t._id, undefined);
  assert.equal(t.settings.pass_mark, 90);
  const upd = await s.update('tenants', 't1', { plan: 'essentials', id: 'hijack' });
  assert.equal(upd.plan, 'essentials');
  assert.equal(upd.id, 't1');
  assert.equal((await s.list('tenants', { plan: ['essentials', 'premium'] })).length, 1);
  await done();
});

test('unique keys surface as UNIQUE errors', async () => {
  const { s, done } = await make();
  await s.insert('tenants', tenant('t1', 'alpha'));
  await assert.rejects(() => s.insert('tenants', tenant('t2', 'alpha')), (e) => e.code === 'UNIQUE');
  await done();
});

test('filters refuse unknown columns and query operators', () => {
  assert.throws(() => toFilter('users', { password_hash: { $ne: null } }), /plain value/);
  assert.throws(() => toFilter('users', { $where: '1' }), /Unknown column/);
  assert.throws(() => toFilter('users', { email: ['a@b.c', { $gt: '' }] }), /plain value/);
  assert.deepEqual(toFilter('users', { id: 'u1', tenant_id: null }), { _id: 'u1', tenant_id: null });
});

test('remove refuses an empty filter', async () => {
  const { s, done } = await make();
  await assert.rejects(() => s.remove('tenants', {}), /without a filter/);
  await done();
});
