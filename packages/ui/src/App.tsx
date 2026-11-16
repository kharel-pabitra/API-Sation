import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RequestPanel } from './components/RequestPanel';
import { SettingsPanel } from './components/SettingsPanel';

export function App() {
  const theme = useStore((s) => s.theme);
  const spec = useStore((s) => s.spec);
  const selectedId = useStore((s) => s.selectedId);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const endpoint = spec?.endpoints.find((e) => e.id === selectedId);

  return (
    <div className="app">
      <Header onSettings={() => setSettings((v) => !v)} />
      {settings && <SettingsPanel />}
      <main>
        <Sidebar />
        <section className="work">
          {endpoint ? (
            <RequestPanel key={endpoint.id} endpoint={endpoint} />
          ) : (
            <div className="empty">
              Select an endpoint from the list.
              <br />
              <br />
              Backends must allow CORS for this page&apos;s origin. A failed call explains the likely cause.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
