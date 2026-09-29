// Loads the fictional demo data (five client companies) into the database.
//   npm run seed            -> refuses if the database already has companies
//   npm run seed -- --reset -> empties the database first (MongoDB collections or the SQLite file)
// Demo data never belongs in a production database, so NODE_ENV=production is refused
// unless ALLOW_DEMO_SEED=1 is set (for a separate demo or staging database).
import { existsSync, rmSync } from 'node:fs';
import { loadConfig } from './config.js';
import { createStore } from './store.js';
import { createApp } from '../core/app.js';
import { createAuth } from '../core/auth.js';
import { seedDemo, DEMO_PASSWORD } from '../core/seed.js';

const cfg = loadConfig();
if (cfg.production && process.env.ALLOW_DEMO_SEED !== '1') {
  console.error('Refusing to load demo data with NODE_ENV=production. Point MONGODB_DB at a separate demo database and set ALLOW_DEMO_SEED=1.');
  process.exit(1);
}
const reset = process.argv.includes('--reset');
if (reset && !cfg.mongoUri) for (const ext of ['', '-wal', '-shm']) if (existsSync(cfg.dbFile + ext)) rmSync(cfg.dbFile + ext);

const store = await createStore(cfg);
if (reset && store.dropAll) {
  console.log(`Emptying database "${cfg.mongoDb}"...`);
  await store.dropAll();
}
if ((await store.list('tenants')).length) {
  console.error('The database already has companies. Run "npm run seed -- --reset" to empty it and load demo data.');
  await store.close();
  process.exit(1);
}
const auth = createAuth({ secret: cfg.secret, iterations: cfg.pbkdf2Iterations });
const app = createApp({ store, auth, brand: cfg.brand });
const accounts = await seedDemo({ store, app, passwordHash: await auth.hash(DEMO_PASSWORD), brandDomain: cfg.brandDomain });
console.log(`\nDemo data loaded into ${store.kind === 'mongodb' ? `MongoDB database "${cfg.mongoDb}"` : cfg.dbFile}. Every demo account uses the password:`, DEMO_PASSWORD, '\n');
console.table(accounts);
await store.close();
