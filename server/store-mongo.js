// MongoDB storage adapter (MongoDB Atlas in production), using the official driver.
// Same interface as the SQLite and in-memory adapters: list, get, insert,
// insertMany, update, remove. Each table in core/schema.js is a collection;
// the row id is stored as _id. Filter keys are checked against the schema,
// so request data can never become a query operator.
import { MongoClient } from 'mongodb';
import { TABLES } from '../core/schema.js';

// Unique keys beyond _id. Everything else is a plain (non-unique) index.
const UNIQUE = { users: ['email'], tenants: ['slug'] };

function def(table) {
  const d = TABLES[table];
  if (!d) throw new Error(`Unknown table ${table}`);
  return d;
}

function field(d, table, key) {
  if (!(key in d.columns)) throw new Error(`Unknown column ${table}.${key}`);
  return key === 'id' ? '_id' : key;
}

// Values must be plain scalars; objects would let a caller smuggle in $ operators.
function scalar(v, table, key) {
  if (v !== null && typeof v === 'object') throw new Error(`Filter ${table}.${key} must be a plain value`);
  return v;
}

export function toFilter(table, where = {}) {
  const d = def(table);
  const f = {};
  for (const [k, v] of Object.entries(where)) {
    const name = field(d, table, k);
    if (Array.isArray(v)) f[name] = { $in: v.map((x) => scalar(x, table, k)) };
    else f[name] = scalar(v, table, k);
  }
  return f;
}

export function toDoc(table, row) {
  const d = def(table);
  const doc = {};
  for (const c of Object.keys(d.columns)) {
    const v = row[c] === undefined ? null : row[c];
    if (c === 'id') doc._id = v;
    else doc[c] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
  }
  return doc;
}

export function fromDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

function unique(e) {
  if (e && (e.code === 11000 || e.code === 11001)) e.code = 'UNIQUE';
  return e;
}

// `client` may be injected (tests); otherwise one is created from `uri`.
export async function createMongoStore({ uri, dbName = 'cyber_academy', client = null, ensureIndexes = true } = {}) {
  if (!client && !uri) throw new Error('MONGODB_URI is not set.');
  const c = client || new MongoClient(uri, {
    appName: 'cyber-academy',
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
    retryWrites: true,
  });
  if (!client) {
    try { await c.connect(); await c.db(dbName).command({ ping: 1 }); } catch (e) {
      throw new Error(`Could not connect to MongoDB (${e.message}). Check MONGODB_URI, the database user's password, and that this server's IP address is on the Atlas project's Network Access list.`);
    }
  }
  const db = c.db(dbName);
  const col = (table) => db.collection(table);

  if (ensureIndexes) {
    for (const [name, d] of Object.entries(TABLES)) {
      for (const idx of d.indexes) {
        if (idx.length === 1 && (UNIQUE[name] || []).includes(idx[0])) continue;
        await col(name).createIndex(Object.fromEntries(idx.map((k) => [k, 1])));
      }
      for (const k of UNIQUE[name] || []) await col(name).createIndex({ [k]: 1 }, { unique: true });
    }
  }

  return {
    kind: 'mongodb',
    db,
    async list(table, where = {}, opts = {}) {
      const d = def(table);
      const options = {};
      if (opts.orderBy) options.sort = { [field(d, table, opts.orderBy)]: opts.desc ? -1 : 1 };
      if (opts.limit) options.limit = Math.max(1, Math.floor(Number(opts.limit)));
      const docs = await col(table).find(toFilter(table, where), options).toArray();
      return docs.map(fromDoc);
    },
    async get(table, id) {
      def(table);
      return fromDoc(await col(table).findOne({ _id: scalar(id, table, 'id') }));
    },
    async insert(table, row) {
      const doc = toDoc(table, row);
      try { await col(table).insertOne(doc); } catch (e) { throw unique(e); }
      return fromDoc(doc);
    },
    async insertMany(table, rows) {
      if (!rows.length) return 0;
      const docs = rows.map((r) => toDoc(table, r));
      try {
        for (let i = 0; i < docs.length; i += 1000) await col(table).insertMany(docs.slice(i, i + 1000), { ordered: true });
      } catch (e) { throw unique(e); }
      return docs.length;
    },
    async update(table, id, patch) {
      const d = def(table);
      const set = {};
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'id' || !(k in d.columns)) continue;
        set[k] = v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v;
      }
      if (!Object.keys(set).length) return this.get(table, id);
      try {
        const doc = await col(table).findOneAndUpdate({ _id: scalar(id, table, 'id') }, { $set: set }, { returnDocument: 'after' });
        return fromDoc(doc);
      } catch (e) { throw unique(e); }
    },
    async remove(table, where) {
      const f = toFilter(table, where);
      if (!Object.keys(f).length) throw new Error('Refusing to delete without a filter');
      const r = await col(table).deleteMany(f);
      return r.deletedCount;
    },
    async ping() {
      await db.command({ ping: 1 });
      return true;
    },
    // Empties every collection but keeps the indexes (used by "seed --reset").
    async dropAll() {
      for (const name of Object.keys(TABLES)) await col(name).deleteMany({});
    },
    async close() {
      if (!client) await c.close();
    },
  };
}
