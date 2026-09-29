// A small in-process stand-in for the MongoDB driver, covering exactly the calls
// server/store-mongo.js makes. It lets the full API suite run through the Mongo
// adapter without a database server. It is not MongoDB: run `npm run test:mongo`
// against a real Atlas database before going live.

function matchValue(docVal, cond) {
  if (cond && typeof cond === 'object' && '$in' in cond) return cond.$in.some((v) => matchValue(docVal, v));
  if (cond === null) return docVal === null || docVal === undefined;
  return docVal === cond;
}
const matches = (doc, filter) => Object.entries(filter).every(([k, v]) => matchValue(doc[k], v));

class Cursor {
  constructor(docs, opts) { this.docs = docs; this.opts = opts || {}; }
  async toArray() {
    let out = this.docs.slice();
    if (this.opts.sort) {
      const [[k, dir]] = Object.entries(this.opts.sort);
      out.sort((a, b) => (a[k] > b[k] ? dir : a[k] < b[k] ? -dir : 0));
    }
    if (this.opts.limit) out = out.slice(0, this.opts.limit);
    return out.map((d) => structuredClone(d));
  }
}

class Collection {
  constructor() { this.docs = new Map(); this.unique = []; }
  dupCheck(doc, ignoreId) {
    if (this.docs.has(doc._id) && doc._id !== ignoreId) throw Object.assign(new Error('E11000 duplicate key _id'), { code: 11000 });
    for (const k of this.unique) for (const d of this.docs.values()) {
      if (d._id !== (ignoreId ?? doc._id) && d[k] !== undefined && d[k] === doc[k]) throw Object.assign(new Error(`E11000 duplicate key ${k}`), { code: 11000 });
    }
  }
  async createIndex(spec, opts = {}) { if (opts.unique) this.unique.push(Object.keys(spec)[0]); return 'ok'; }
  find(filter, opts) { return new Cursor([...this.docs.values()].filter((d) => matches(d, filter)), opts); }
  async findOne(filter) { const d = [...this.docs.values()].find((x) => matches(x, filter)); return d ? structuredClone(d) : null; }
  async insertOne(doc) { this.dupCheck(doc); this.docs.set(doc._id, structuredClone(doc)); return { insertedId: doc._id }; }
  async insertMany(docs, { ordered = true } = {}) {
    for (const d of docs) { this.dupCheck(d); this.docs.set(d._id, structuredClone(d)); if (!ordered) continue; }
    return { insertedCount: docs.length };
  }
  async findOneAndUpdate(filter, update, opts = {}) {
    const d = [...this.docs.values()].find((x) => matches(x, filter));
    if (!d) return null;
    const next = { ...d, ...structuredClone(update.$set || {}) };
    this.dupCheck(next, d._id);
    this.docs.set(d._id, next);
    return structuredClone(opts.returnDocument === 'after' ? next : d);
  }
  async deleteMany(filter) {
    let n = 0;
    for (const [id, d] of this.docs) if (matches(d, filter)) { this.docs.delete(id); n++; }
    return { deletedCount: n };
  }
  async drop() { this.docs.clear(); this.unique = []; return true; }
}

export function createFakeMongoClient() {
  const dbs = new Map();
  return {
    db(name) {
      if (!dbs.has(name)) {
        const cols = new Map();
        dbs.set(name, {
          collection(n) { if (!cols.has(n)) cols.set(n, new Collection()); return cols.get(n); },
          async command() { return { ok: 1 }; },
          async dropDatabase() { cols.clear(); return true; },
        });
      }
      return dbs.get(name);
    },
    async close() {},
  };
}
