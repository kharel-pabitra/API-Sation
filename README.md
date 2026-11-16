# api-console

A browser-based API console: load an OpenAPI spec, click an endpoint, send a request, read the raw response in a terminal-style panel. Auth profiles and environments are applied automatically, so you stop re-attaching tokens by hand.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # core unit tests
npm run typecheck
npm run build      # static site in packages/ui/dist
```

## Layout

```
packages/
  core/   UI-free logic (testable, reusable from a CLI or desktop shell)
    model.ts        normalized types: Endpoint, AuthProfile, Environment, RequestSpec...
    adapters/       spec sources -> normalized model (OpenAPI 2/3, JSON or YAML)
    auth/           auth strategies registry (none, bearer, apikey, basic, cookie)
    request.ts      buildRequest() and toCurl(): pure functions
    transport/      Transport interface + fetch implementation + CORS diagnostics
    vars.ts         {{variable}} interpolation, JSON path helper
  ui/     React + Vite + Zustand
    store.ts        spec, environments, auth profiles (persisted to localStorage)
    components/     Header, Sidebar, RequestPanel, Terminal, SettingsPanel
```

## How to extend

| Want                              | Do                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Postman / HAR / GraphQL import    | Write a `SpecAdapter` (`name`, `test`, `parse` -> `ApiSpec`) and call `registerAdapter()` |
| OAuth2, HMAC, etc.                | Write an `AuthStrategy` and call `registerAuth()`; the settings dropdown picks it up      |
| Proxy / desktop (Tauri) transport | Implement `Transport.send()` and use it in `RequestPanel` instead of `fetchTransport`     |

## CORS

This is a pure browser app: the target backend must allow this page's origin (`Access-Control-Allow-Origin`, plus allowed headers/methods and `Allow-Credentials` with a specific origin for cookies). When a call fails, the terminal lists the likely causes. HttpOnly cookies are invisible to JS, and only headers exposed via `Access-Control-Expose-Headers` appear in responses.

## Roadmap

- Auto-refresh on 401, request history, saved requests
- Request chaining / workflow view
- Postman import, OAuth2, CodeMirror editors
- Optional proxy transport and Tauri desktop shell
