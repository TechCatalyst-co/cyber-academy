// Tenant isolation. Every request inside a company goes through a scoped store
// that forces tenant_id on reads and writes, so a bug in a handler cannot
// return or change another company's rows.
import { TABLES } from './schema.js';

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function scopedStore(store, tenantId) {
  if (!tenantId) throw new Error('scopedStore requires a tenant');
  const guard = (table) => {
    if (!TABLES[table]?.tenantScoped) throw new Error(`${table} is not tenant scoped`);
  };
  return {
    tenantId,
    async list(table, where = {}, opts) {
      guard(table);
      return store.list(table, { ...where, tenant_id: tenantId }, opts);
    },
    async get(table, id) {
      guard(table);
      const row = await store.get(table, id);
      return row && row.tenant_id === tenantId ? row : null;
    },
    async insert(table, row) {
      guard(table);
      return store.insert(table, { ...row, tenant_id: tenantId });
    },
    async insertMany(table, rows) {
      guard(table);
      return store.insertMany(table, rows.map((r) => ({ ...r, tenant_id: tenantId })));
    },
    async update(table, id, patch) {
      guard(table);
      const row = await this.get(table, id);
      if (!row) return null;
      const { tenant_id, id: _id, ...rest } = patch;
      return store.update(table, id, rest);
    },
    async remove(table, where) {
      guard(table);
      return store.remove(table, { ...where, tenant_id: tenantId });
    },
  };
}
