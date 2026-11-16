import { useRef, useState } from 'react';
import { parseSpec } from '@apic/core';
import { useStore, useActiveEnv } from '../store';

export function Header({ onSettings }: { onSettings: () => void }) {
  const { envs, activeEnv, setActiveEnv, setSpec, profiles, activeProfile, setActiveProfile, toggleTheme, updateEnv } = useStore();
  const env = useActiveEnv();
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const ingest = (text: string) => {
    try {
      setSpec(parseSpec(text));
      setErr('');
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const loadUrl = async () => {
    if (!url.trim()) return;
    try {
      ingest(await (await fetch(url.trim())).text());
    } catch (e) {
      setErr(`Could not fetch spec: ${(e as Error).message}. The spec URL must allow CORS, or upload the file.`);
    }
  };

  return (
    <header>
      <b>api-console</b>
      <input className="grow" value={url} placeholder="OpenAPI spec URL (JSON or YAML)" onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadUrl()} />
      <button className="pri" onClick={loadUrl}>Load</button>
      <button onClick={() => file.current?.click()}>Upload</button>
      <input ref={file} type="file" hidden accept=".json,.yaml,.yml" onChange={async (e) => e.target.files?.[0] && ingest(await e.target.files[0].text())} />
      <span className="dim">Env</span>
      <select value={activeEnv} onChange={(e) => setActiveEnv(e.target.value)}>
        {envs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <input value={env.baseUrl} placeholder="https://api.example.com" style={{ minWidth: 200 }} onChange={(e) => updateEnv(env.id, { baseUrl: e.target.value })} />
      <span className="dim">Auth</span>
      <select value={activeProfile} onChange={(e) => setActiveProfile(e.target.value)}>
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button onClick={onSettings}>Settings</button>
      <button onClick={toggleTheme} title="Toggle theme">◐</button>
      {err && <div className="bad full">{err}</div>}
    </header>
  );
}
