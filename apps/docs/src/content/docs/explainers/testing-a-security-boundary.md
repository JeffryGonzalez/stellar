---
title: Testing a security boundary — closed-world vs. open-world guarantees
description: Why the blood/brain barrier tests for the peek affordance are intentionally closed-world, and where the real architectural guarantee actually lives.
---

*This is a Technical Discussion Record (TDR) — a record of design thinking, not a changelog. It exists so future developers and future instances of Claude can understand not just what was built, but what problem it solved and what was ruled out.*

---

## What we were trying to solve

Once the peek affordance was implemented, the question became: how do we test that raw state cannot reach any export surface? The feature is specifically designed so that human developers *can* see unsanitized values in the overlay UI, but those values are structurally inaccessible from `window.__stellarDevtools`. We called this the "blood/brain barrier."

Testing a security boundary is different from testing a feature. You're not checking that something works — you're checking that something *cannot* happen.

---

## The open/closed world distinction

**Closed-world tests** assert: "these specific known secrets don't appear in the output." They enumerate the sensitive values and verify their absence. This is what we wrote.

**Open-world tests** assert a structural property: "nothing raw can ever reach an export surface, regardless of what fields exist." They don't assume they know the complete set of sensitive values.

A closed-world test has a gap: if someone adds a new sensitive field to `SensitiveDataStore`, forgets to sanitize it, *and* forgets to add it to `RAW_SECRETS` in the test, the barrier is broken and the test still passes. The test can only catch what it explicitly knows about.

An open-world test would close this gap — but implementing one here is genuinely hard. Some sanitized values are substrings of raw values (`lastFour` is literally inside the full card number), so you can't just serialize raw state and check for absence of all leaf values. You'd need to compare the raw and sanitized states structurally, accounting for every transformation rule. That's almost re-implementing the sanitizer in the test.

---

## Why closed-world is the right call here

The reason closed-world tests are appropriate is that **the real guarantee isn't in the tests — it's in the architecture.**

`withStellarDevtools` applies sanitization inside its `effect()` before calling `registry.recordState()`. Raw state cannot reach `history[]` regardless of what fields exist — not because we checked for it in a test, but because the pipeline doesn't route it there. The `rawReader` callback bypasses the pipeline entirely in the other direction (overlay → live store signal), and is registered on `StoreEntry` in a field that `provide-stellar.ts` never touches.

This means:
- The Playwright tests are **regression tests for known values** — they catch someone accidentally removing a sanitization rule from the demo store, or re-wiring the pipeline incorrectly.
- The **architectural guarantee** is in the code structure, not the test suite.

These are two different layers doing different jobs. Confusing them leads either to false confidence (thinking the tests prove the architecture is sound) or over-engineered tests (trying to make the tests carry a guarantee they can't hold).

---

## The one place this reasoning weakens

If someone adds a third path to state — not through `recordState()` — that bypasses the sanitization pipeline, both the closed-world tests and the architectural argument fail silently. A new export surface that reads directly from `StoreEntry.rawReader` would be exactly this.

This is the scenario where code review and design commitment enforcement (CLAUDE.md) matter more than any test. The constraint "sanitization runs before any state reaches the registry" must be treated as load-bearing, not conventional. If it's ever proposed to relax it, that should be an explicit, recorded decision — not a quiet shortcut.

---

## What a genuinely open-world test would require

For completeness: an open-world test would need to:

1. Obtain the raw state through a separate channel (not via devtools) — e.g., a test-only hook on the Angular store directly.
2. Enumerate all leaf values from the raw state.
3. Filter out values that are expected to partially survive sanitization (like `lastFour`, `truncate`, display names).
4. Check that no remaining raw values appear verbatim anywhere in the devtools output.

This is achievable but expensive to maintain as sanitization rules change. Worth building if Stellar ever applies to stores with dynamically-shaped state where the field inventory isn't known at test-write time. For the demo store — which has a stable, hardcoded schema — closed-world is sufficient and more maintainable.

---

## What we deliberately deferred

**Clipboard testing for "Copy for AI".** The real guarantee is that `formatStoreForAI` reads from sanitized history, which is already covered. Testing the clipboard interaction itself (granting permissions, intercepting writes) is flakey and adds little confidence over what the `history()` tests already provide.

---

*This TDR was written from the session of 2026-03-30.*
