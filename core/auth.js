// Password hashing (PBKDF2-SHA256) and signed session tokens (HMAC-SHA256).
// Uses Web Crypto, so the same code runs in Node 22+ and in browsers.
const enc = new TextEncoder();
const subtle = () => globalThis.crypto.subtle;

function b64url(bytes) {
  let s = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export function createAuth({ secret, iterations = 310000, ttlSeconds = 12 * 3600, now = () => new Date() }) {
  if (!secret || secret.length < 32) throw new Error('Session secret must be at least 32 characters.');
  let hmacKey;
  const key = async () => (hmacKey ??= await subtle().importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']));

  async function derive(password, salt, iter) {
    const base = await subtle().importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, 256));
  }

  return {
    async hash(password) {
      const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
      const dk = await derive(password, salt, iterations);
      return `pbkdf2-sha256$${iterations}$${b64url(salt)}$${b64url(dk)}`;
    },
    async verify(password, stored) {
      if (typeof stored !== 'string') return false;
      const [alg, iter, salt, hash] = stored.split('$');
      if (alg !== 'pbkdf2-sha256' || !hash) return false;
      const dk = await derive(password, fromB64url(salt), Number(iter));
      return equal(dk, fromB64url(hash));
    },
    async sign(payload) {
      const iat = Math.floor(now().getTime() / 1000);
      const body = b64url(enc.encode(JSON.stringify({ ...payload, iat, exp: iat + ttlSeconds })));
      const sig = b64url(await subtle().sign('HMAC', await key(), enc.encode(body)));
      return `${body}.${sig}`;
    },
    async verifyToken(token) {
      const [body, sig] = String(token).split('.');
      if (!body || !sig) return null;
      let ok = false;
      try { ok = await subtle().verify('HMAC', await key(), fromB64url(sig), enc.encode(body)); } catch { return null; }
      if (!ok) return null;
      let payload;
      try { payload = JSON.parse(new TextDecoder().decode(fromB64url(body))); } catch { return null; }
      if (!payload.exp || payload.exp < Math.floor(now().getTime() / 1000)) return null;
      return payload;
    },
  };
}
