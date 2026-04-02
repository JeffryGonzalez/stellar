---
title: NgRx Events Integration — What the Recording Revealed
description: What we learned about Stellar's causal graph when tested against the NgRx Events pattern, including a gap that's acceptable now and a future integration point.
---

*This is a Technical Discussion Record (TDR) — not about a feature, but about what a real recording revealed about how Stellar handles the NgRx Events plugin pattern, and why the gap we found is deliberate rather than a bug.*

---

## What we were trying to solve

The NgRx Signal Store Events plugin (`@ngrx/signals/events`) is stable in v21 and represents a meaningfully different state management pattern: events dispatched through a `Dispatcher` bus, `withReducer` for pure state transitions, `withEventHandlers` for async side effects. Stellar was built against the `withMethods` pattern. The question was whether it held up.

The secondary question: does an events-driven store produce a better recording artifact for AI consumption than a methods-driven one?

---

## What the recording revealed

A `BookSearchEventsStore` using `withReducer` + `withEventHandlers` (debounce/switchMap against the Open Library API) produced a recording with 51 nodes and 26 edges. Three things were immediately clear:

**ngrx-event nodes work correctly as triggers.** Each dispatched event produces a named node — `[Book Search Page] queryChanged — "pragm"` — with a `caused` edge to the resulting state snapshot. The event `type` string from `eventGroup` is exactly the trigger label you'd want. No click buffer needed; the event name is the cause.

**switchMap cancellation is visible in the graph.** The user typed "pragm", the debounce fired a request, then backspaced and retyped "the pragmatic" before the first response arrived. The graph shows two `http-request` nodes, two `http-response` nodes, but only one `produced` edge — from the second response to the state update. The first response (n2) has a `resolved` edge from its request but nothing downstream. An AI reading this recording can see: a request was made, a response arrived, it produced no state change because the query had moved on. This is `switchMap` behavior made legible without Stellar doing anything special. It emerges from the data model.

**There is a gap in the causal chain.** The `ngrx-event` nodes (queryChanged) have `caused` edges to state snapshots, but no edge connects them to the `http-request` nodes. The debounce and `switchMap` that bridge those two live inside `withEventHandlers`, outside Stellar's visibility. An AI inferring causality from the recording has to use timing — the request fires ~400ms after the last queryChanged event — rather than an explicit edge.

---

## Why the gap is acceptable now

The gap is structurally honest. Stellar captures what it can observe: state changes, HTTP events (via `fetch` intercept), and click/ngrx-event triggers. The interior of `withEventHandlers` — debounce, filter, switchMap — is an RxJS pipeline that Stellar has no hook into. Adding visibility there would require intercepting the `Dispatcher` service directly.

More importantly: the gap doesn't make the recording misleading. The timing makes the causal relationship inferrable, the `switchMap` cancellation story is legible, and the final `produced` edge correctly points to the response that actually changed state. A recording without the debounce-to-request edge is incomplete but not wrong.

---

## The future integration point

The right place to close the gap is a `withNgrxEventsIntegration()` Stellar feature that wraps `provideDispatcher()` and feeds dispatched event types into the Stellar trigger context at dispatch time rather than at state-change time. This would:

- Add a causal edge from each dispatched event to any subsequent HTTP request initiated within the debounce window
- Allow the `trigger` field on `StateSnapshot` to carry the event type string automatically, without relying on the click buffer

This is not a v1 concern. The evidence needed to justify building it: a real debugging session where the missing edge caused an AI to draw a wrong causal inference. Until that happens, the timing-based inference is sufficient.

---

## The broader observation

An events-driven store produces a richer recording than a methods-driven one, for a simple reason: the event type string is a self-describing cause. `[Book Search Page] queryChanged — "pragm"` tells an AI what happened, who initiated it, and what the intent was. A method call named `setQuery("pragm")` tells you less. The naming convention in `eventGroup` — `source: 'Book Search Page'` — is doing work that `withMethods` can't do.

This suggests that when Stellar is eventually used to help debug real applications, the ones using the Events pattern will produce more useful recordings by default. Worth noting when the NgRx team is evaluating the tool.

---

## What we deliberately deferred

**Dispatcher integration** — `withNgrxEventsIntegration()` feature that intercepts the `Dispatcher` to capture event types at dispatch time. Deferred until there's evidence the timing-based inference is insufficient in practice.

**Events-pattern Playwright tests** — the existing e2e suite doesn't cover the `/events` route. The recording behavior is validated by inspection for now. Worth adding before any official NgRx team demo.

---

*This TDR was written from the session of 2026-04-02.*
