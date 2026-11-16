import type { AuthProfile, Endpoint, RequestSpec } from './model';
import { applyAuth } from './auth';
import { interpolate } from './vars';

export interface BuildInput {
  endpoint: Endpoint;
  baseUrl: string;
  path: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
  profile?: AuthProfile;
  vars?: Record<string, string>;
}

/** Pure function: endpoint + user input + environment + auth profile -> concrete request. */
export function buildRequest(i: BuildInput): RequestSpec {
  const v = i.vars ?? {};
  const sub = (s: string) => interpolate(s, v);

  let path = i.endpoint.path;
  for (const [k, val] of Object.entries(i.path)) {
    if (val !== '') path = path.replace(`{${k}}`, encodeURIComponent(sub(val)));
  }
  const qs = new URLSearchParams();
  for (const [k, val] of Object.entries(i.query)) if (val !== '') qs.append(k, sub(val));
  const query = qs.toString();

  const headers: Record<string, string> = {};
  for (const [k, val] of Object.entries(i.headers)) headers[k] = sub(val);

  const body = i.body?.trim() ? sub(i.body) : undefined;
  if (body && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  const req: RequestSpec = {
    method: i.endpoint.method,
    url: sub(i.baseUrl).replace(/\/+$/, '') + path + (query ? `?${query}` : ''),
    headers,
    body: i.endpoint.method === 'GET' || i.endpoint.method === 'HEAD' ? undefined : body,
    credentials: 'omit',
  };
  applyAuth(req, i.profile && { ...i.profile, value: i.profile.value ? sub(i.profile.value) : i.profile.value });
  return req;
}

export function toCurl(r: RequestSpec): string {
  let s = `curl -X ${r.method} '${r.url}'`;
  for (const [k, v] of Object.entries(r.headers)) s += ` \\\n  -H '${k}: ${v}'`;
  if (r.body) s += ` \\\n  -d '${r.body.replace(/'/g, `'\\''`)}'`;
  if (r.credentials === 'include') s += ` \\\n  --cookie-jar cookies.txt --cookie cookies.txt`;
  return s;
}
