import type { ApiSpec } from '../model';

/** Implement this to support a new spec source (Postman, HAR, GraphQL, ...). */
export interface SpecAdapter {
  name: string;
  test(raw: unknown): boolean;
  parse(raw: unknown): ApiSpec;
}
