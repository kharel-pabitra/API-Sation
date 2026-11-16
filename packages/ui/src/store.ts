import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiSpec, AuthProfile, Environment } from '@apic/core';

const NONE: AuthProfile = { id: 'none', name: 'none', type: 'none' };
const uid = () => crypto.randomUUID();

interface State {
  spec: ApiSpec | null;
  envs: Environment[];
  activeEnv: string;
  profiles: AuthProfile[];
  activeProfile: string;
  theme: 'dark' | 'light';
  selectedId: string | null;
  filter: string;
  setSpec: (s: ApiSpec) => void;
  select: (id: string | null) => void;
  setFilter: (f: string) => void;
  setActiveEnv: (id: string) => void;
  updateEnv: (id: string, patch: Partial<Environment>) => void;
  addEnv: () => void;
  setActiveProfile: (id: string) => void;
  addProfile: () => void;
  updateProfile: (id: string, patch: Partial<AuthProfile>) => void;
  removeProfile: (id: string) => void;
  toggleTheme: () => void;
}

const defaultEnv: Environment = { id: 'dev', name: 'dev', baseUrl: '', vars: {} };

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      spec: null,
      envs: [defaultEnv],
      activeEnv: 'dev',
      profiles: [NONE],
      activeProfile: 'none',
      theme: 'dark',
      selectedId: null,
      filter: '',
      setSpec: (spec) => {
        const { envs, activeEnv } = get();
        set({
          spec,
          selectedId: null,
          envs: envs.map((e) => (e.id === activeEnv && !e.baseUrl && spec.baseUrl ? { ...e, baseUrl: spec.baseUrl } : e)),
        });
      },
      select: (selectedId) => set({ selectedId }),
      setFilter: (filter) => set({ filter }),
      setActiveEnv: (activeEnv) => set({ activeEnv }),
      updateEnv: (id, patch) => set({ envs: get().envs.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),
      addEnv: () => {
        const e: Environment = { id: uid(), name: `env${get().envs.length + 1}`, baseUrl: '', vars: {} };
        set({ envs: [...get().envs, e], activeEnv: e.id });
      },
      setActiveProfile: (activeProfile) => set({ activeProfile }),
      addProfile: () => {
        const p: AuthProfile = { id: uid(), name: `profile${get().profiles.length}`, type: 'bearer', value: '' };
        set({ profiles: [...get().profiles, p], activeProfile: p.id });
      },
      updateProfile: (id, patch) => set({ profiles: get().profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),
      removeProfile: (id) => set({ profiles: get().profiles.filter((p) => p.id !== id), activeProfile: 'none' }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'api-console',
      partialize: (s) => ({
        spec: s.spec, envs: s.envs, activeEnv: s.activeEnv, profiles: s.profiles, activeProfile: s.activeProfile, theme: s.theme,
      }),
    },
  ),
);

export const useActiveEnv = () => useStore((s) => s.envs.find((e) => e.id === s.activeEnv) ?? s.envs[0]);
export const useActiveProfile = () => useStore((s) => s.profiles.find((p) => p.id === s.activeProfile) ?? NONE);
