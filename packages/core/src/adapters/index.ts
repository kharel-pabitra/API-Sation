import { parse as parseYaml } from 'yaml';
import type { ApiSpec } from '../model';
import type { SpecAdapter } from './types';
import { openApiAdapter } from './openapi';

const adapters: SpecAdapter[] = [openApiAdapter];

/** Register an extra adapter. Later registrations are tried first. */
export function registerAdapter(a: SpecAdapter): void {
  adapters.unshift(a);
}

/** Parse JSON or YAML text with the first adapter that recognizes it. */
export function parseSpec(text: string): ApiSpec {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    try {
      raw = parseYaml(text);
    } catch {
      throw new Error('Spec is neither valid JSON nor YAML.');
    }
  }
  const adapter = adapters.find((a) => a.test(raw));
  if (!adapter) throw new Error('Unrecognized spec format. Supported: ' + adapters.map((a) => a.name).join(', '));
  return adapter.parse(raw);
}

export type { SpecAdapter };
