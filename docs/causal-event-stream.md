# Causal Event Stream — Design Notes

*From conversation, March 2026.*

---

## The Problem

A state snapshot tells you *where* an application is. It does not tell you *how it got there*.

When debugging with an AI assistant, the developer currently has to manually relay the sequence of events that led to a bug — what they clicked, what requests fired, what state changed and when. This is the primary friction in AI-assisted debugging sessions. The AI is doing archaeology on a static artifact without the causal chain that produced it.

This is the same problem Redux solved by making every state change an explicit named action. The action log *is* the causal chain. NgRx Signal Store trades that explicitness for ergonomics — less boilerplate, but causally opaque. We can recover it.

---

## What We Want

A structured, ordered event log that looks like this:

```
[click]  button "Load User"
[fetch]  GET /api/user/123 → 200 (142ms)
[state]  UserStore: { loading: true } → { loading: false, userId: "123", role: "admin" }
[click]  button "Edit Profile"
[state]  UserStore: { editing: false } → { editing: true }
[fetch]  PUT /api/user/123 → 403 (34ms)
[state]  UserStore: { editing: true } → { editing: false, error: "Forbidden" }
```

That sequence — user intent, network effect, state outcome — is a complete debugging context. An AI receiving it can reason about the failure without any additional narration from the developer.

---

## The Mechanism: Instrumented Monkey-Patching

Zone.js pioneered this model in Angular: patch the platform primitives, track causality across async boundaries. Angular is moving toward zoneless — but the *model* is valid independently of Zone.js. A lightweight, purpose-built observer patches just what it needs and nothing more:

```ts
// Network causality
const originalFetch = window.fetch
window.fetch = function(...args) {
  const taskId = stellarObserver.startTask('fetch', args[0])
  return originalFetch.apply(this, args)
    .then(res => {
      stellarObserver.endTask(taskId, res.status)
      return res
    })
}

// User interaction capture
document.addEventListener('click', e => {
  stellarObserver.recordEvent('click', {
    target: e.target.tagName,
    label: e.target.textContent?.slice(0, 50),
    testId: e.target.getAttribute('data-testid'),
  })
}, { capture: true })
```

The observer is unpatched on teardown. It has no production footprint.

### What gets instrumented

| Layer | API | What we get |
|---|---|---|
| Network | `fetch` / `XHR` | Request URL, method, status, duration |
| User interaction | `document` capture listener | Click, input, navigation intent |
| State changes | Store method wrapping (already in `withStellarDevtools`) | Before/after values, method name as trigger |
| Navigation | History API | Route transitions |
| Performance | `PerformanceObserver` | Long tasks, resource timing |

Together these produce a causal chain that connects user intent → network effect → state outcome.

---

## Integration with Playwright

The cleanest delivery mechanism is Playwright's `page.addInitScript()` — runs before the page's own scripts, so instrumentation is in place before anything executes:

```ts
// In your Playwright test setup
await page.addInitScript({ path: 'stellar-observer.js' })

// Stream events back through Playwright's console bridge
page.on('console', msg => {
  if (msg.text().startsWith('__stellar:')) {
    const event = JSON.parse(msg.text().slice('__stellar:'.length))
    eventLog.push(event)
  }
})

// At the end of a test / on demand
const log = await page.evaluate(() => window.__stellarObserver.flush())
```

Events flow: browser → `console.log` → Playwright listener → local file / AI context. No external network connection. Developer-initiated. Scoped to the test session.

### What this enables

- **Post-test AI debugging**: attach the event log to a failed test and hand it to an AI. The AI has the full causal chain, not just the assertion failure.
- **Conditional capture**: start recording detailed traces only when a condition is met (see Alerts section below).
- **Regression context**: compare event logs between passing and failing runs to find where the causal chain diverges.

---

## Conditional Alerts / Watchpoints

A state-level equivalent of conditional debugger breakpoints:

```ts
window.__stellarDevtools.watch(
  'UserStore',
  state => state.errorCount > 3,
  { label: 'too many errors', mode: 'notify' }
)
```

Three modes:

- **`notify`** — fire a console event / overlay badge when condition becomes true. Safe, low friction.
- **`pause`** — `debugger` statement equivalent at the state level. Stop execution when condition hits.
- **`record`** — begin capturing a detailed trace when condition is met. Low overhead normally, rich context on demand.

The Playwright connection: a watch condition can trigger a screenshot + full state dump automatically. "When this error state appears, capture everything without me having to notice and react."

---

## Where This Sits on the Safe/Scary Spectrum

The key variable is **where the stream goes**, not the instrumentation itself.

| Destination | Assessment |
|---|---|
| `window.__stellarObserver` (in-browser, developer reads it) | Safe |
| `console.log` captured by Playwright locally | Safe |
| Local WebSocket to sidecar (localhost only) | Safe |
| External endpoint | Do not do this |

**Scoped to test sessions**, this is low risk:
- Playwright controls a clean Chromium instance with no real credentials
- No external connections
- Developer initiates every run
- Instrumentation is injected, not persistent

**In the real browser during dev**, risk increases slightly:
- The dev app may carry dev tokens
- `fetch` interception captures all network including auth headers — auth headers should be redacted before logging, same as state sanitization

The same sanitization principle that governs state snapshots applies here: **no unsanitized data enters the log**. Auth headers stripped. Sensitive field names redacted per the `@hypertheory/sanitize` blocklist.

---

## Relationship to Stellar's Existing Architecture

This is a natural extension of what `withStellarDevtools` already does:

- **State diffs** → already recorded per snapshot. The observer adds the *why* (what user action or network event preceded the change).
- **`trigger` field** in the snapshot format → the observer is what populates this field reliably.
- **`window.__stellarDevtools`** → the observer contributes a complementary `window.__stellarObserver` surface, or extends the existing one with a `stream()` / `events()` method.
- **Plugin architecture** → `withPlaywrightObserver()` is the natural packaging: a plugin that registers nothing in production and activates only when Playwright (or another test runner) injects the init script.

---

## The Proposed Package: `withPlaywrightObserver()`

A plugin for `provideStellarDevtools` with:

- Zero production footprint (tree-shaken unless explicitly included in test config)
- Injected via `page.addInitScript()` in Playwright setup
- Produces a structured `StellarEventLog` that complements `StateSnapshot`
- Feeds the `trigger` field in snapshots automatically
- Exposes `window.__stellarObserver.flush()` for on-demand retrieval

The event log format should be designed as a first-class AI-readable artifact alongside the snapshot format — same self-describing conventions, same sanitization guarantees.

---

## Open Questions

- Should `window.__stellarObserver` be a separate surface or integrated into `window.__stellarDevtools` as a `stream()` / `events()` method?
- What is the right granularity for user interaction capture? Full DOM path vs. just tag + label vs. `data-testid` only?
- Should the event log be append-only with a size cap, or ring-buffer (fixed N most recent)?
- Auth header redaction: automatic (strip `Authorization` always) or configurable?
- Should this work outside Playwright — e.g., injected via a browser extension in a dev session?
