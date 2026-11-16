/* eslint-disable @typescript-eslint/no-explicit-any */
type J = any;

/** Resolve local $ref pointers (#/components/schemas/X). */
export function deref(node: J, root: J, depth = 0): J {
  let n = node;
  while (n && n.$ref && depth++ < 8) {
    let t = root;
    for (const k of String(n.$ref).slice(2).split('/')) {
      t = t?.[k.replace(/~1/g, '/').replace(/~0/g, '~')];
    }
    n = t;
  }
  return n ?? {};
}

/** Generate an example value from a JSON schema. */
export function exampleFromSchema(schema: J, root: J, depth = 0): unknown {
  const s = deref(schema, root);
  if (depth > 5) return null;
  if (s.example !== undefined) return s.example;
  if (s.default !== undefined) return s.default;
  if (s.enum) return s.enum[0];
  if (s.allOf) return Object.assign({}, ...s.allOf.map((x: J) => exampleFromSchema(x, root, depth + 1)));
  const alt = s.oneOf ?? s.anyOf;
  if (alt) return exampleFromSchema(alt[0], root, depth + 1);
  const t = s.type ?? (s.properties ? 'object' : '');
  if (t === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(s.properties ?? {})) o[k] = exampleFromSchema(v, root, depth + 1);
    return o;
  }
  if (t === 'array') return [exampleFromSchema(s.items ?? {}, root, depth + 1)];
  if (t === 'integer' || t === 'number') return 0;
  if (t === 'boolean') return true;
  if (s.format === 'date-time') return new Date().toISOString();
  return 'string';
}
