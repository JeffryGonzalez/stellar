---
title: The peek affordance — revealing sanitized field values to human developers
description: How we arrived at an ephemeral, display-only "reveal" mechanism for sanitized state, and why the architecture made it simpler than expected.
---

*This is a Technical Discussion Record (TDR) — a record of design thinking, not a changelog. It exists so future developers and future instances of Claude can understand not just what was built, but what problem it solved and what was ruled out.*

---

## What we were actually trying to solve

The presenting problem was: a developer debugging an HTTP issue wants to verify that an API key is being copied correctly from the store into a request header. Stellar shows sanitized state — the API key appears as `[REDACTED]`. The developer is stuck.

The initial framing was "we need a way to visualize pre-sanitized state." That framing is too broad and points toward a parallel unsanitized pipeline — an architectural change with real cost and real risk.

The reframe that unlocked the design: **what the developer actually needs is to inspect a specific field value, in the moment, without exporting it anywhere.** That's a narrower problem with a much cleaner solution.

---

## Prior art: the Aspire dashboard pattern

Microsoft's Aspire dashboard handles secrets and connection strings with a pattern that fits exactly: values are redacted by default, with a per-field "reveal" button. The revealed value is displayed in the UI only — it is never persisted, never exported, never leaves the screen.

Two things this pattern gets right:

1. **The reveal is ephemeral.** There is no state change in the system — just a momentary display. This means the sanitization pipeline is completely untouched.
2. **The friction is deliberate but light.** A click to reveal communicates "this is sensitive" without being punishing. A confirmation dialog ("are you sure?") was considered and rejected — the Aspire pattern uses it because the dashboard may be shared or screen-recorded in team contexts. Our overlay is strictly dev-mode, in-browser, single-developer. A visible "UNSANITIZED" label on the revealed value is sufficient friction.

---

## Why the architecture cooperates

Sanitization in Stellar happens inside the `effect()` in `withStellarDevtools`. At that point, `raw = getState(store)` is in scope before sanitization is applied. Only the sanitized result is passed to `registry.recordState()`.

The signal store itself remains live in Angular's DI with the raw state in its signals. The raw state was never gone — it was just never retained after the effect ran.

This means a "peek" doesn't require storing unsanitized state anywhere. A `rawReader: () => Record<string, unknown>` callback — simply `() => getState(store)` — can be registered alongside the store entry at registration time. The overlay calls it on demand. The raw state is read in that instant, displayed, and that's it.

No parallel pipeline. No architectural change to where sanitization sits. No retained unsanitized data.

---

## The constraint that matters most

The `rawReader` function must be inaccessible from `window.__stellarDevtools`. This is the load-bearing constraint, and it must be enforced explicitly.

The `window.__stellarDevtools` surface is a public contract. AI tools develop habits around it. If `rawReader` — or any raw state — appeared there, it would silently become part of what AI consumers could access, which directly contradicts the sanitization-upstream-of-everything principle. The point of sanitization is that no unsanitized state reaches any export or AI surface. The reveal is human-only, display-only, and must stay that way by construction.

This is a case where "testing for a negative" matters: the guard is not just "rawReader isn't documented in the API" but "rawReader cannot be reached from the window surface at all." The implementation should make that structurally true, not just conventionally true.

---

## What we deliberately deferred

**A confirmation dialog.** Ruled out for now — unnecessary friction in a dev-only tool. Revisit if the overlay ever appears in shared or screen-recorded contexts (e.g., a team dashboard mode, if that ever becomes a real feature).

**Field-level granularity in the reveal.** The initial implementation reveals the whole store's raw state on demand. A per-field reveal (click the eye icon next to `apiKey` specifically) would be more precise and leak less, but requires more UI work and a field-path mechanism in `rawReader`. Worth doing eventually; not the first cut.

**Any indication in recordings or snapshots that a peek occurred.** Intentionally omitted. The peek is a developer inspection action, not an application event. Recording it would conflate debugging activity with application behavior.

---

*This TDR was written from the session of 2026-03-30.*
