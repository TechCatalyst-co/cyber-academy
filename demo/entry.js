// Browser demo: runs the real API in the page with an in-memory database and seeded data.
import { createMemoryStore } from '../core/store-memory.js';
import { createApp } from '../core/app.js';
import { createAuth } from '../core/auth.js';
import { seedDemo, DEMO_PASSWORD } from '../core/seed.js';
import { boot } from '../client/js/app.js';

(async () => {
  const store = createMemoryStore();
  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
  const auth = createAuth({ secret, iterations: 2000 });
  const app = createApp({ store, auth, brand: 'Cyber Academy', demo: true, logger: console });
  const accounts = await seedDemo({ store, app, passwordHash: await auth.hash(DEMO_PASSWORD) });
  globalThis.__LMS_LOCAL__ = app;
  await boot({ demoAccounts: accounts, demoPassword: DEMO_PASSWORD });
})();
