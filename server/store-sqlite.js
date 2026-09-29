// SQLite storage adapter using Node's built-in node:sqlite (Node >= 22.13).
// Table and column names come only from core/schema.js; all values are bound
// parameters, so filters cannot inject SQL.
import { DatabaseSync } from 'node:sqlite';
import { TABLES } from '../core/schema.js';

export function createSqliteStore(file = 'data/lms.db') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

  for (const [name, def] of Object.entries(TABLES)) {
    const cols = Object.entries(def.columns).map(([c, t]) => `"${c}" ${t}`).join(', ');
    db.exec(`CREATE TABLE IF NOT EXISTS "${name}" (${cols})`);
    for (const idx of def.indexes) {
      db.exec(`CREATE INDEX IF NOT EXISTS "ix_${name}_${idx.join('_')}" ON "${name}" (${idx.map((c) => `"${c}"`).join(', ')})`);
    }
  }

  const stmtCache = new Map();
  const prep = (sql) => {
    let s = stmtCache.get(sql);
    if (!s) { s = db.prepare(sql); stmtCache.set(sql, s); }
    return s;
  };

  function def(table) {
    const d = TABLES[table];
    if (!d) throw new Error(`Unknown table ${table}`);
    return d;
  }
  function col(d, table, c) {
    if (!(c in d.columns)) throw new Error(`Unknown column ${table}.${c}`);
    return `"${c}"`;
  }
  function encode(d, row) {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      if (!(k in d.columns)) continue;
      if (d.json.includes(k)) out[k] = v === null || v === undefined ? null : JSON.stringify(v);
      else if (typeof v === 'boolean') out[k] = v ? 1 : 0;
      else out[k] = v === undefined ? null : v;
    }
    return out;
  }
  function decode(d, row) {
    if (!row) return null;
    const out = { ...row };
    for (const k of d.json) if (typeof out[k] === 'string') out[k] = JSON.parse(out[k]);
    return out;
  }
  function whereSql(d, table, where) {
    const parts = [], params = [];
    for (const [k, v] of Object.entries(where || {})) {
      const c = col(d, table, k);
      if (v === null) parts.push(`${c} IS NULL`);
      else if (Array.isArray(v)) {
        if (!v.length) { parts.push('0'); continue; }
        parts.push(`${c} IN (${v.map(() => '?').join(',')})`);
        params.push(...v);
      } else { parts.push(`${c} = ?`); params.push(v); }
    }
    return { sql: parts.length ? ' WHERE ' + parts.join(' AND ') : '', params };
  }

  return {
    kind: 'sqlite',
    db,
    async list(table, where = {}, opts = {}) {
      const d = def(table);
      const w = whereSql(d, table, where);
      let sql = `SELECT * FROM "${table}"${w.sql}`;
      if (opts.orderBy) sql += ` ORDER BY ${col(d, table, opts.orderBy)} ${opts.desc ? 'DESC' : 'ASC'}`;
      if (opts.limit) sql += ` LIMIT ${Math.max(1, Math.floor(Number(opts.limit)))}`;
      return prep(sql).all(...w.params).map((r) => decode(d, r));
    },
    async get(table, id) {
      const d = def(table);
      return decode(d, prep(`SELECT * FROM "${table}" WHERE id = ?`).get(id));
    },
    async insert(table, row) {
      const d = def(table);
      const r = encode(d, row);
      const keys = Object.keys(r);
      try {
        prep(`INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => r[k]));
      } catch (e) {
        if (/UNIQUE/.test(e.message)) e.code = 'UNIQUE';
        throw e;
      }
      return this.get(table, row.id);
    },
    async insertMany(table, rows) {
      if (!rows.length) return 0;
      const d = def(table);
      db.exec('BEGIN');
      try {
        for (const row of rows) {
          const r = encode(d, row);
          const keys = Object.keys(r);
          prep(`INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => r[k]));
        }
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
      return rows.length;
    },
    async update(table, id, patch) {
      const d = def(table);
      const r = encode(d, patch);
      delete r.id;
      const keys = Object.keys(r);
      if (keys.length) prep(`UPDATE "${table}" SET ${keys.map((k) => `"${k}" = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => r[k]), id);
      return this.get(table, id);
    },
    async remove(table, where) {
      const d = def(table);
      const w = whereSql(d, table, where);
      if (!w.sql) throw new Error('Refusing to delete without a filter');
      return Number(prep(`DELETE FROM "${table}"${w.sql}`).run(...w.params).changes);
    },
    close() { db.close(); },
  };
}
