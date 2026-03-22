---
title: HTTP Monitoring, Causal Graphs, and the AI-Context-First Heuristic
description: How we designed withHttpTrafficMonitoring(), the decisions around causal linking, and the design principle that emerged from building it.
---

*This is a Technical Discussion Record (TDR) — a record of how we thought, not what we built. It exists so future contributors (and future instances of Claude) can understand not just what exists, but why it exists in that form and what was deliberately ruled out.*

---

## What we were actually solving

The stated goal was `withHttpTrafficMonitoring()`. The real problem was harder: generic devtools can show you that a fetch happened and that state changed. What they can't tell you is that *this* state change was caused by *that* fetch — because they observe the runtime without knowing anything about the code.

Stellar is not a generic tool. We have the source. The causal graph exists in the code before runtime. The session became about making that graph legible — first in the AI context surface, then in the UI.

## Why `window.fetch`, not `HttpClient` interceptors

The Angular `HttpClient` interceptor API would work for Angular-initiated requests. `window.fetch` catches everything: Angular's `HttpClient` (which uses `fetch` in Angular 17+), any library, any direct `fetch()` call in store methods. Intercepting at the lowest level means the monitoring works without touching application code and without knowing how the application makes requests.

The tradeoff: we're patching a global. We restore `window.fetch` on `DestroyRef.onDestroy()` to be clean, but this is a meaningful architectural choice — noted so nobody removes the restore thinking it's defensive code.

## The timing decision: capture context before the first `await`

When a `fetch` is initiated, the registry holds the current NgRx event type and recent click label. By the time the response arrives (200ms, 500ms, whatever), the user may have interacted with something else — those buffers will have moved on.

So context is captured at the moment of the call, before any `await`. This is the same reasoning that made us capture click labels on `mousedown` rather than `click`. Causal context exists at the point of initiation, not at the point of resolution.

The 300ms recency window for linking HTTP responses to state snapshots was chosen to accommodate Angular's signal scheduler: effects don't run synchronously after state changes, they batch. The window needs to be long enough that `recordState` still sees the `lastHttpEventId` after Angular's effect flush, but short enough that it doesn't spuriously link unrelated requests.

## The "AI context surface first" heuristic

This emerged as an explicit design principle during the session and is worth naming:

**Design the AI-readable output before the UI. If you can't articulate what an AI would do with a piece of information, it probably isn't load-bearing.**

Applied here: before writing a line of overlay code, we defined what the `formatStoreForAI` history entry and `formatHttpEventsForAI` output should look like when the causal link exists:

```
**#3** 14:23:07 UTC ← GET /todos?_limit=8 (200, 241ms)
  loading: true → false
  todos: [] → [8 items]
```

and the reverse:

```
**GET** `/todos?_limit=8` → 200 (241ms) — *click: "Load todos"*
  → TodosStore #3
```

Once that output was agreed on, the data model (`httpEventId` on `StateSnapshot`, recency buffer in registry, computed back-references in the formatter) was obvious. The overlay badge was a consequence of the data model, not the driver.

This heuristic will recur. Use it whenever there's ambiguity about what to put in the model.

## MSW vs. jsonplaceholder for the demo

MSW was considered and rejected for the demo. MSW intercepts at the service worker level, which short-circuits actual network timing. Since the HTTP panel shows duration as meaningful information (240ms vs. 1200ms is different), we want real network calls. `jsonplaceholder.typicode.com` gives real timing with zero infrastructure.

MSW will be the right choice for Playwright tests of HTTP monitoring — `page.route()` gives controlled responses without external dependencies and allows us to simulate failures, delays, and specific response bodies. That's a different concern from the demo.

## What we deliberately deferred

**WebSockets and SSE** — explicitly parked until `fetch` is proven and the causal linking pattern is stable. The interceptor approach doesn't apply; a different mechanism is needed.

**Response body in the AI context** — we capture JSON response bodies but don't include them in `formatStoreForAI`. The state diff already shows what changed; repeating the raw response body would add noise. If the state change doesn't explain itself, the problem is in the state model, not the HTTP record. Revisit if there's a concrete case where the response body adds clarity the diff doesn't.

**Causal graph view in the overlay** — the data is there. The UI so far is a badge on history items and back-references in the HTTP panel. A proper graph visualization (node: click → node: event → node: HTTP request → node: state delta) requires a demo store with enough causal depth to make the visualization non-trivial. Build it when there's a real example to design against — the outbox pattern or a query cache implementation would both qualify.

**Playwright tests for HTTP monitoring** — not written yet. `page.route()` is the right tool; `context.grantPermissions` patterns from the existing test suite apply. Should cover: `window.__stellarDevtools.http()` shape, trigger on HTTP events, `httpEventId` on state snapshots, back-references in AI format.

---

*This TDR was written from the session of 2026-03-22.*
