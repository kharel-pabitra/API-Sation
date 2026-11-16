import type { RequestSpec, ResponseResult } from '../model';

/** Swap implementations (direct fetch, proxy, Tauri, ...) without touching the UI. */
export interface Transport {
  send(req: RequestSpec): Promise<ResponseResult>;
}

export class NetworkError extends Error {
  constructor(message: string, public hint: string) {
    super(message);
  }
}

export function corsHint(origin: string): string {
  return [
    'The browser gives no detail for network and CORS errors. Check:',
    '  1. Is the backend running and is the base URL correct?',
    `  2. Does the backend allow this origin (${origin}) in Access-Control-Allow-Origin?`,
    '  3. Does it allow your headers (Authorization, Content-Type) in Access-Control-Allow-Headers',
    '     and the method in Access-Control-Allow-Methods? Is the OPTIONS preflight answered?',
    '  4. For cookies: Access-Control-Allow-Credentials: true and a specific origin (not *).',
    '  5. Page is https but backend is http? Mixed content is blocked by the browser.',
  ].join('\n');
}

export const fetchTransport: Transport = {
  async send(req) {
    const t0 = performance.now();
    let res: Response;
    try {
      res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        credentials: req.credentials,
      });
    } catch (e) {
      const origin = typeof location !== 'undefined' ? location.origin : 'unknown';
      throw new NetworkError((e as Error).message, corsHint(origin));
    }
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: [...res.headers.entries()],
      body,
      ms: Math.round(performance.now() - t0),
      size: new TextEncoder().encode(body).length,
    };
  },
};
