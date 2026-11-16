/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiSpec, Endpoint, HttpMethod, ParamDef } from '../model';
import { deref, exampleFromSchema } from '../example';
import type { SpecAdapter } from './types';

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

export const openApiAdapter: SpecAdapter = {
  name: 'OpenAPI 3.x / Swagger 2.0',
  test: (raw: any) => !!raw && typeof raw === 'object' && !!(raw.openapi || raw.swagger),
  parse(spec: any): ApiSpec {
    let baseUrl: string | undefined;
    if (spec.servers?.[0]?.url) baseUrl = spec.servers[0].url;
    else if (spec.host) baseUrl = `${spec.schemes?.[0] ?? 'https'}://${spec.host}${spec.basePath ?? ''}`;

    const endpoints: Endpoint[] = [];
    for (const [path, rawItem] of Object.entries<any>(spec.paths ?? {})) {
      const item = deref(rawItem, spec);
      for (const m of METHODS) {
        const op = item[m];
        if (!op) continue;
        const all: any[] = [...(item.parameters ?? []), ...(op.parameters ?? [])].map((p) => deref(p, spec));
        const params: ParamDef[] = all
          .filter((p) => p.in === 'path' || p.in === 'query' || p.in === 'header')
          .map((p) => ({
            name: p.name,
            in: p.in,
            required: !!p.required,
            example: String(p.example ?? p.schema?.example ?? p.schema?.default ?? ''),
          }));

        let body: string | undefined;
        const rb = deref(op.requestBody, spec);
        const media = rb.content && (rb.content['application/json'] ?? Object.values<any>(rb.content)[0]);
        if (media?.schema) body = JSON.stringify(exampleFromSchema(media.schema, spec), null, 2);
        const swagger2Body = all.find((p) => p.in === 'body');
        if (swagger2Body) body = JSON.stringify(exampleFromSchema(swagger2Body.schema, spec), null, 2);

        endpoints.push({
          id: `${m} ${path}`,
          method: m.toUpperCase() as HttpMethod,
          path,
          tag: op.tags?.[0] ?? 'default',
          summary: op.summary ?? '',
          secured: ((op.security ?? spec.security ?? []) as unknown[]).length > 0,
          params,
          body,
        });
      }
    }
    return { title: spec.info?.title ?? 'API', baseUrl, endpoints };
  },
};
