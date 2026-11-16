import { useMemo, useState } from 'react';
import { buildRequest, fetchTransport, getByPath, NetworkError, parseKeyValueLines, stringifyKeyValues, toCurl } from '@apic/core';
import type { Endpoint, RequestSpec } from '@apic/core';
import { useStore, useActiveEnv } from '../store';
import { Terminal } from './Terminal';
import type { Outcome } from './Terminal';

export function RequestPanel({ endpoint }: { endpoint: Endpoint }) {
  const env = useActiveEnv();
  const { profiles, activeProfile, updateProfile } = useStore();
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(endpoint.params.filter((p) => p.in !== 'header').map((p) => [`${p.in}:${p.name}`, p.example])),
  );
  const [headers, setHeaders] = useState(() =>
    stringifyKeyValues(Object.fromEntries(endpoint.params.filter((p) => p.in === 'header').map((p) => [p.name, p.example])), ':'),
  );
  const [body, setBody] = useState(endpoint.body ?? '');
  const [override, setOverride] = useState('');
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [tokenPath, setTokenPath] = useState('');
  const [note, setNote] = useState('');

  const profile = profiles.find((p) => p.id === (override === 'none' ? 'none' : override || activeProfile));

  const req = useMemo<RequestSpec | null>(() => {
    const pick = (kind: string) =>
      Object.fromEntries(Object.entries(vals).filter(([k]) => k.startsWith(kind + ':')).map(([k, v]) => [k.slice(kind.length + 1), v]));
    try {
      return buildRequest({
        endpoint, baseUrl: env.baseUrl, path: pick('path'), query: pick('query'),
        headers: parseKeyValueLines(headers, ':'), body, profile, vars: env.vars,
      });
    } catch {
      return null;
    }
  }, [endpoint, env, vals, headers, body, profile]);

  const send = async () => {
    if (!req) return;
    setOutcome({ kind: 'pending' });
    try {
      setOutcome({ kind: 'ok', res: await fetchTransport.send(req) });
    } catch (e) {
      setOutcome({ kind: 'err', message: (e as Error).message, hint: e instanceof NetworkError ? e.hint : '', curl: toCurl(req) });
    }
  };

  const saveToken = () => {
    try {
      const v = outcome?.kind === 'ok' ? getByPath(JSON.parse(outcome.res.body), tokenPath) : undefined;
      if (typeof v !== 'string' || !profile || profile.type === 'none') throw new Error();
      updateProfile(profile.id, { value: v });
      setNote(`Saved to ${profile.name}`);
    } catch {
      setNote('Needs a JSON response with a string at that path and a non-none profile.');
    }
    setTimeout(() => setNote(''), 2500);
  };

  const fields = endpoint.params.filter((p) => p.in !== 'header');
  const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'HEAD';

  return (
    <div onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && send()} className="panel">
      <div className="req">
        <div className="url">
          <span className={`m ${endpoint.method}`}>{endpoint.method}</span>
          <code>{req?.url ?? 'Invalid URL'}</code>
          <button className="pri" onClick={send}>Send</button>
        </div>
        {endpoint.summary && <div className="dim">{endpoint.summary}</div>}
        <div className="opts">
          <span className="lbl">Auth for this request</span>
          <select value={override} onChange={(e) => setOverride(e.target.value)}>
            <option value="">inherit ({profiles.find((p) => p.id === activeProfile)?.name})</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {endpoint.secured && <span className="dim">spec marks this endpoint as secured</span>}
        </div>
        {fields.map((p) => (
          <div className="row" key={`${p.in}:${p.name}`}>
            <span className="lbl">{p.name}{p.required ? ' *' : ''} <span className="dim">({p.in})</span></span>
            <input value={vals[`${p.in}:${p.name}`] ?? ''} onChange={(e) => setVals({ ...vals, [`${p.in}:${p.name}`]: e.target.value })} />
          </div>
        ))}
        <div>
          <div className="lbl">Headers (Name: value per line)</div>
          <textarea style={{ minHeight: 44 }} value={headers} onChange={(e) => setHeaders(e.target.value)} />
        </div>
        {hasBody && (
          <div>
            <div className="lbl">Body (JSON)</div>
            <textarea style={{ minHeight: 120 }} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        )}
        <div className="opts">
          <button onClick={() => navigator.clipboard.writeText(req ? toCurl(req) : '')}>Copy cURL</button>
          <span className="lbl">Save token from response path</span>
          <input value={tokenPath} placeholder="data.accessToken" style={{ width: 170 }} onChange={(e) => setTokenPath(e.target.value)} />
          <button onClick={saveToken}>Save to profile</button>
          <span className="dim">{note}</span>
        </div>
      </div>
      <Terminal outcome={outcome} />
    </div>
  );
}
