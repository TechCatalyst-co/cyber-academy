// In-memory storage adapter. Same interface as the SQLite adapter
// (server/store-sqlite.js); used by the browser demo and by tests.
import { TABLES } from './schema.js';

function check(table, where) {
  const def = TABLES[table];
  if (!def) throw new Error(`Unknown table ${table}`);
  for (const k of Object.keys(where || {})) if (!(k in def.columns)) throw new Error(`Unknown column ${table}.${k}`);
  return def;
}

function matches(row, where) {
  for (const [k, v] of Object.entries(where)) {
    if (v === null) { if (row[k] !== null && row[k] !== undefined) return false; }
    else if (Array.isArray(v)) { if (!v.includes(row[k])) return false; }
    else if (row[k] !== v) return false;
  }
  return true;
}

const clone = (r) => (r ? structuredClone(r) : r);

export function createMemoryStore() {
  const data = Object.fromEntries(Object.keys(TABLES).map((t) => [t, new Map()]));

  function normalize(table, row) {
    const def = TABLES[table];
    const out = {};
    for (const c of Object.keys(def.columns)) out[c] = row[c] === undefined ? null : row[c];
    return out;
  }

  return {
    kind: 'memory',
    async list(table, where = {}, opts = {}) {
      check(table, where);
      let rows = [];
      for (const r of data[table].values()) if (matches(r, where)) rows.push(r);
      if (opts.orderBy) {
        const k = opts.orderBy, dir = opts.desc ? -1 : 1;
        rows.sort((a, b) => (a[k] > b[k] ? dir : a[k] < b[k] ? -dir : 0));
      }
      if (opts.limit) rows = rows.slice(0, opts.limit);
      return rows.map(clone);
    },
    async get(table, id) {
      check(table);
      return clone(data[table].get(id)) || null;
    },
    async insert(table, row) {
      check(table, row);
      const r = normalize(table, row);
      if (data[table].has(r.id)) throw new Error('Duplicate id');
      if (table === 'users' || table === 'tenants') {
        const key = table === 'users' ? 'email' : 'slug';
        for (const x of data[table].values()) if (x[key] === r[key]) throw Object.assign(new Error('UNIQUE constraint failed'), { code: 'UNIQUE' });
      }
      data[table].set(r.id, r);
      return clone(r);
    },
    async insertMany(table, rows) {
      for (const r of rows) await this.insert(table, r);
      return rows.length;
    },
    async update(table, id, patch) {
      check(table, patch);
      const cur = data[table].get(id);
      if (!cur) return null;
      const next = { ...cur, ...structuredClone(patch), id };
      data[table].set(id, next);
      return clone(next);
    },
    async remove(table, where) {
      check(table, where);
      let n = 0;
      for (const [id, r] of data[table]) if (matches(r, where)) { data[table].delete(id); n++; }
      return n;
    },
  };
}
