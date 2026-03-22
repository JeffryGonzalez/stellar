# Current Work

A short-lived document. Read this at the start of a session to orient quickly.
Updated at the end of every session via `/capture`.

---

## Just landed
- **Playwright e2e suite** — 39 tests: API contract, sanitization (all operators), trigger field, AI format validity
- **`withHttpTrafficMonitoring()`** — `window.fetch` interceptor, causal context captured at call time
- **Causal linking** — `httpEventId` on `StateSnapshot`; history items show `← GET /path (200)` badge; HTTP panel shows `→ StoreName #N` back-refs
- **"AI context first" heuristic** — design AI-readable output before UI; if you can't articulate what an AI does with it, it's not load-bearing
- **`window.__stellarDevtools.http()`** — returns full `HttpEvent[]`
- **TodosStore demo** — jsonplaceholder fetch to exercise HTTP monitoring end-to-end
- **`docs/clean-code-for-ai.md`** — cognitive prosthetics vs load-bearing conventions
- **`docs/causal-graph-and-source-access.md`** — why Stellar's epistemic position differs from generic devtools
- Playwright config: replaced `nxE2EPreset(__filename)` with explicit config (fixes Nx ESM graph processing error)

## Next
1. **Playwright tests for HTTP monitoring** — `window.__stellarDevtools.http()` shape, `httpEventId` on snapshots, back-refs in AI format; use `page.route()` for controlled responses
2. **Causal graph view in overlay** — proper visualization of click → event → HTTP → state delta; needs a store with enough causal depth (outbox pattern or query cache would qualify)
3. **`withHttpTrafficMonitoring()` options** — URL filter patterns (don't capture `/assets/`, `/favicon.ico`), max events cap currently hardcoded at 100

## Design questions open
- WebSockets and SSE — parked until fetch is solid
- Outbox pattern demo — perfect case study for causal graph view; Jeff has an existing implementation
- Angular-native Tanstack Query — `withQuery()` as a signal store feature; natural Stellar integration point; separate design session needed

## Parked / not this sprint
- `withNgrxReduxStoreTools()` — classic NgRx/Store users have Redux DevTools; low demand signal
- MCP server
- `createSanitizer()` factory (Tier 3 custom aliases)
- Production-mode gating of the overlay
- **Bug: panel clips at high browser zoom** — good first GitHub issue
- Tree view for deeply nested state
