import { authStrategies, parseKeyValueLines, stringifyKeyValues } from '@apic/core';
import type { AuthType } from '@apic/core';
import { useStore, useActiveEnv } from '../store';

export function SettingsPanel() {
  const { profiles, addProfile, updateProfile, removeProfile, addEnv, updateEnv } = useStore();
  const env = useActiveEnv();
  const strategies = authStrategies().filter((s) => s.type !== 'none');

  return (
    <div className="settings">
      <div className="opts">
        <b>Environment</b>
        <input value={env.name} style={{ width: 120 }} onChange={(e) => updateEnv(env.id, { name: e.target.value })} />
        <button onClick={addEnv}>+ Add environment</button>
      </div>
      <div>
        <div className="lbl">Variables (key=value per line). Use as {'{{key}}'} in URLs, params, headers, body and tokens.</div>
        <textarea key={env.id} style={{ minHeight: 56 }} defaultValue={stringifyKeyValues(env.vars, '=').replace(/: /g, '=')} onBlur={(e) => updateEnv(env.id, { vars: parseKeyValueLines(e.target.value, '=') })} />
      </div>
      <b>Auth profiles</b>
      {profiles.filter((p) => p.type !== 'none').map((p) => (
        <div className="opts" key={p.id}>
          <input value={p.name} style={{ width: 120 }} onChange={(e) => updateProfile(p.id, { name: e.target.value })} />
          <select value={p.type} onChange={(e) => updateProfile(p.id, { type: e.target.value as AuthType })}>
            {strategies.map((s) => <option key={s.type} value={s.type}>{s.label}</option>)}
          </select>
          {p.type === 'apikey' && (
            <>
              <input placeholder="header / param name" value={p.keyName ?? ''} style={{ width: 140 }} onChange={(e) => updateProfile(p.id, { keyName: e.target.value })} />
              <select value={p.keyIn ?? 'header'} onChange={(e) => updateProfile(p.id, { keyIn: e.target.value as 'header' | 'query' })}>
                <option value="header">header</option>
                <option value="query">query</option>
              </select>
            </>
          )}
          {p.type !== 'cookie' && (
            <input type="password" className="grow" placeholder={p.type === 'basic' ? 'user:password' : 'value'} value={p.value ?? ''} onChange={(e) => updateProfile(p.id, { value: e.target.value })} />
          )}
          <label><input type="checkbox" checked={!!p.sendCookies} onChange={(e) => updateProfile(p.id, { sendCookies: e.target.checked })} /> send cookies</label>
          <button onClick={() => removeProfile(p.id)}>Remove</button>
        </div>
      ))}
      <div className="opts">
        <button onClick={addProfile}>+ Add profile</button>
        <span className="dim">Stored in this browser only. The active profile applies to every request unless overridden.</span>
      </div>
    </div>
  );
}
