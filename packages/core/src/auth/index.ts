import type { AuthProfile, AuthType, RequestSpec } from '../model';

export interface AuthStrategy {
  type: AuthType;
  label: string;
  /** Mutates the request to attach credentials. */
  apply(req: RequestSpec, profile: AuthProfile): void;
}

const addQuery = (url: string, k: string, v: string) =>
  url + (url.includes('?') ? '&' : '?') + encodeURIComponent(k) + '=' + encodeURIComponent(v);

const strategies = new Map<AuthType, AuthStrategy>();

/** Register (or replace) an auth strategy. Adding OAuth2 later = one new file + one call. */
export function registerAuth(s: AuthStrategy): void {
  strategies.set(s.type, s);
}

registerAuth({ type: 'none', label: 'None', apply() {} });
registerAuth({
  type: 'bearer',
  label: 'Bearer token',
  apply(req, p) {
    if (p.value) req.headers['Authorization'] = `Bearer ${p.value}`;
  },
});
registerAuth({
  type: 'apikey',
  label: 'API key',
  apply(req, p) {
    if (!p.value) return;
    if (p.keyIn === 'query') req.url = addQuery(req.url, p.keyName || 'api_key', p.value);
    else req.headers[p.keyName || 'X-API-Key'] = p.value;
  },
});
registerAuth({
  type: 'basic',
  label: 'Basic (user:password)',
  apply(req, p) {
    if (p.value) req.headers['Authorization'] = `Basic ${btoa(p.value)}`;
  },
});
registerAuth({
  type: 'cookie',
  label: 'Cookies (browser session)',
  apply(req) {
    req.credentials = 'include';
  },
});

export const authStrategies = (): AuthStrategy[] => [...strategies.values()];

export function applyAuth(req: RequestSpec, profile?: AuthProfile): void {
  if (!profile) return;
  strategies.get(profile.type)?.apply(req, profile);
  if (profile.sendCookies) req.credentials = 'include';
}
