// Picks the database. MongoDB (Atlas) whenever MONGODB_URI is set, which is
// required in production; a local SQLite file only for development without Atlas.
import { createMongoStore } from './store-mongo.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createSqliteStore } from './store-sqlite.js';

export async function createStore(cfg) {
  if (cfg.mongoUri) return createMongoStore({ uri: cfg.mongoUri, dbName: cfg.mongoDb });
  if (cfg.production) throw new Error('MONGODB_URI is required in production. Set it to your MongoDB Atlas connection string.');
  console.warn(`MONGODB_URI not set: using a local SQLite file for development (${cfg.dbFile}).`);
  mkdirSync(dirname(cfg.dbFile), { recursive: true });
  return createSqliteStore(cfg.dbFile);
}
