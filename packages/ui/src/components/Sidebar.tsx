import { useMemo, useRef, useEffect } from 'react';
import type { Endpoint } from '@apic/core';
import { useStore } from '../store';

export function Sidebar() {
  const { spec, filter, setFilter, selectedId, select } = useStore();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const groups = useMemo(() => {
    const q = filter.toLowerCase();
    const g = new Map<string, Endpoint[]>();
    for (const e of spec?.endpoints ?? []) {
      if (!`${e.method} ${e.path} ${e.summary}`.toLowerCase().includes(q)) continue;
      g.set(e.tag, [...(g.get(e.tag) ?? []), e]);
    }
    return [...g.entries()];
  }, [spec, filter]);

  return (
    <aside>
      <div className="s"><input ref={input} value={filter} placeholder="Filter endpoints (Ctrl+K)" onChange={(e) => setFilter(e.target.value)} /></div>
      {!spec && <div className="empty">Load an OpenAPI spec to list endpoints.</div>}
      {spec && !groups.length && <div className="empty">No endpoints match.</div>}
      {groups.map(([tag, eps]) => (
        <div key={tag}>
          <div className="tag">{tag}</div>
          {eps.map((e) => (
            <div key={e.id} className={`ep ${selectedId === e.id ? 'on' : ''}`} onClick={() => select(e.id)} title={e.summary}>
              <span className={`m ${e.method}`}>{e.method}</span>
              <span className="p">{e.path}{e.secured ? ' 🔒' : ''}</span>
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}
