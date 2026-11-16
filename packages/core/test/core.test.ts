import { describe, expect, it } from 'vitest';
import { buildRequest, parseSpec, interpolate, getByPath } from '../src';

const spec = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Pets' },
  servers: [{ url: 'https://api.test' }],
  security: [{ bearer: [] }],
  paths: {
    '/pets/{id}': { get: { tags: ['pets'], parameters: [{ name: 'id', in: 'path', required: true }] } },
    '/pets': {
      post: {
        tags: ['pets'],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } },
      },
    },
  },
  components: { schemas: { Pet: { type: 'object', properties: { name: { type: 'string' }, age: { type: 'integer' } } } } },
});

describe('core', () => {
  const api = parseSpec(spec);
  it('parses endpoints, base url, security and example bodies', () => {
    expect(api.baseUrl).toBe('https://api.test');
    expect(api.endpoints).toHaveLength(2);
    expect(api.endpoints.every((e) => e.secured)).toBe(true);
    expect(JSON.parse(api.endpoints.find((e) => e.method === 'POST')!.body!)).toEqual({ name: 'string', age: 0 });
  });
  it('builds a request with path params, vars and bearer auth', () => {
    const ep = api.endpoints.find((e) => e.method === 'GET')!;
    const r = buildRequest({
      endpoint: ep, baseUrl: '{{host}}/', path: { id: '7' }, query: { a: '1' }, headers: {},
      vars: { host: 'https://api.test', tok: 'abc' },
      profile: { id: 'p', name: 'p', type: 'bearer', value: '{{tok}}' },
    });
    expect(r.url).toBe('https://api.test/pets/7?a=1');
    expect(r.headers.Authorization).toBe('Bearer abc');
  });
  it('helpers', () => {
    expect(interpolate('{{a}}-{{b}}', { a: '1' })).toBe('1-{{b}}');
    expect(getByPath({ data: { t: 'x' } }, 'data.t')).toBe('x');
  });
  it('parses YAML', () => {
    expect(parseSpec('openapi: 3.0.0\npaths:\n  /x:\n    get: {}\n').endpoints).toHaveLength(1);
  });
});
