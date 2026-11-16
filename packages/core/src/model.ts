/** Normalized model. The UI only ever sees these types, never raw spec formats. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ParamDef {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  example: string;
}

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  tag: string;
  summary: string;
  secured: boolean;
  params: ParamDef[];
  /** Example JSON body generated from the schema, if the endpoint takes one. */
  body?: string;
}

export interface ApiSpec {
  title: string;
  baseUrl?: string;
  endpoints: Endpoint[];
}

export type AuthType = 'none' | 'bearer' | 'apikey' | 'basic' | 'cookie';

export interface AuthProfile {
  id: string;
  name: string;
  type: AuthType;
  /** bearer: token, apikey: key, basic: "user:password" */
  value?: string;
  keyName?: string;
  keyIn?: 'header' | 'query';
  sendCookies?: boolean;
}

export interface Environment {
  id: string;
  name: string;
  baseUrl: string;
  vars: Record<string, string>;
}

export interface RequestSpec {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  credentials: 'omit' | 'include';
}

export interface ResponseResult {
  ok: boolean;
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
  ms: number;
  size: number;
}
