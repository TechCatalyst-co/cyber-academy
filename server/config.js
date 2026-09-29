// Runtime configuration from environment variables.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

export function loadConfig(env = process.env) {
  // Local folder for development only (SQLite file, generated session secret).
  const dataDir = resolve(env.DATA_DIR || 'data');
  const ensureDir = () => { if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true }); };
  let secret = env.SESSION_SECRET;
  if (!secret && env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is required in production (48+ random characters). Every server instance must share the same value.');
  if (!secret) {
    ensureDir();
    const file = join(dataDir, '.session-secret');
    if (existsSync(file)) secret = readFileSync(file, 'utf8').trim();
    else {
      secret = randomBytes(48).toString('base64url');
      writeFileSync(file, secret, { mode: 0o600 });
      console.warn(`SESSION_SECRET not set; generated one in ${file}. Set SESSION_SECRET in production.`);
    }
  }
  return {
    port: Number(env.PORT || 3000),
    host: env.HOST || '0.0.0.0',
    dataDir,
    dbFile: env.DB_FILE || join(dataDir, 'lms.db'),
    mongoUri: env.MONGODB_URI || null,
    mongoDb: env.MONGODB_DB || 'cyber_academy',
    production: env.NODE_ENV === 'production',
    secret,
    brand: env.BRAND_NAME || 'Cyber Academy',
    brandDomain: env.BRAND_DOMAIN || 'techcatalyst.example',
    adminEmail: env.ADMIN_EMAIL,
    adminPassword: env.ADMIN_PASSWORD,
    adminName: env.ADMIN_NAME || 'Provider Admin',
    hsts: env.HSTS === '1',
    trustProxy: env.TRUST_PROXY === '1',
    pbkdf2Iterations: Number(env.PBKDF2_ITERATIONS || 310000),
    sessionHours: Number(env.SESSION_HOURS || 12),
  };
}
