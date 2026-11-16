import type { ResponseResult } from '@apic/core';

export type Outcome = { kind: 'ok'; res: ResponseResult } | { kind: 'err'; message: string; hint: string; curl: string } | { kind: 'pending' } | null;

const pretty = (s: string) => {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
};

/** Raw, as-is output. No decoration beyond status colour. */
export function Terminal({ outcome }: { outcome: Outcome }) {
  if (!outcome) return <pre className="term dim">Response appears here. Ctrl+Enter to send.</pre>;
  if (outcome.kind === 'pending') return <pre className="term dim">Sending…</pre>;
  if (outcome.kind === 'err') {
    return (
      <pre className="term">
        <span className="bad">Request failed: {outcome.message}</span>
        {'\n\n' + outcome.hint + '\n\nRequest was:\n' + outcome.curl}
      </pre>
    );
  }
  const { res } = outcome;
  return (
    <pre className="term">
      <span className={res.ok ? 'ok' : 'bad'}>HTTP {res.status} {res.statusText}</span>
      <span className="dim">{`  ${res.ms}ms  ${res.size}B\n`}{res.headers.length ? res.headers.map(([k, v]) => `${k}: ${v}`).join('\n') : '(no readable headers: backend must send Access-Control-Expose-Headers)'}</span>
      {'\n\n' + pretty(res.body)}
    </pre>
  );
}
