// API client. Talks to the server over fetch, or to an in-page app in the demo build.
const mem = {};
const storage = {
  get(k) { try { return sessionStorage.getItem(k) ?? mem[k] ?? null; } catch { return mem[k] ?? null; } },
  set(k, v) { mem[k] = v; try { v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

export const session = {
  get token() { return storage.get('lms.token'); },
  set token(v) { storage.set('lms.token', v); },
  get tenantId() { return storage.get('lms.tenant'); },
  set tenantId(v) { storage.set('lms.tenant', v); },
};

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  if (session.tenantId) headers['X-Tenant-Id'] = session.tenantId;
  let status, data, file;
  const local = globalThis.__LMS_LOCAL__;
  if (local) {
    const [p, qs] = path.split('?');
    const out = await local.handle({ method, path: p, query: Object.fromEntries(new URLSearchParams(qs || '')), headers, body: body ? JSON.parse(JSON.stringify(body)) : {} });
    status = out.status; data = out.body; file = out.file;
  } else {
    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    status = res.status;
    const type = res.headers.get('content-type') || '';
    if (res.ok && type.startsWith('text/csv')) {
      const cd = res.headers.get('content-disposition') || '';
      file = { name: (cd.match(/filename="([^"]+)"/) || [])[1] || 'export.csv', type: 'text/csv', text: await res.text() };
    } else {
      data = type.includes('json') ? await res.json() : { error: await res.text() };
    }
  }
  if (status === 401 && path !== '/api/auth/login') { onUnauthorized(); throw new ApiError(401, data?.error || 'Sign in again.'); }
  if (status >= 400) throw new ApiError(status, data?.error || `Request failed (${status}).`);
  return file ? { __file: file } : data;
}

export const get = (p) => api('GET', p);
export const post = (p, b) => api('POST', p, b || {});
export const patch = (p, b) => api('PATCH', p, b || {});
