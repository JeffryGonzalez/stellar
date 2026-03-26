---
title: The Libraries
description: An overview of the packages in the Stellar Devtools monorepo — what each one does and how they relate.
---

## `@hypertheory/stellar-ng-devtools`

The Angular devtools library. Provides:

- `withStellarDevtools(name, options?)` — a NgRx Signal Store feature that hooks into store state and feeds it to the registry
- `provideStellar()` — sets up the `window.__stellarDevtools` API and the in-memory registry
- `StellarOverlayComponent` — the visual overlay, mounted via `<stellar-overlay />` in your app template
- `sanitizeConfig<T>(config)` — typed helper for declaring per-store sanitization rules

**Peer dependencies:** `@angular/core`, `@angular/common`, `@ngrx/signals`

**Status:** functional, snapshot format partially complete (see [AI Accessibility](/explainers/llm-legible-documentation/) for context on what's missing and why it matters)

---

## `@hypertheory/sanitize`

A standalone, framework-agnostic sanitization library. Zero dependency on the devtools — usable in event sourcing pipelines, logging, or anywhere else sensitive values need to be transformed before leaving a trust boundary.

### What's implemented

**Named rules** (string literals):

| Rule | Effect |
|---|---|
| `'omitted'` | Removes the field entirely |
| `'redacted'` | Replaces with `[redacted]` |
| `'masked'` | Replaces characters with `*`, keeps length |
| `'hashed'` | Replaces with a SHA-style hash |
| `'lastFour'` | Keeps last 4 characters |
| `'firstFour'` | Keeps first 4 characters |
| `'email'` | Keeps domain, redacts local part |

**Semantic aliases** (map to the rules above): `'creditCard'`, `'debitCard'`, `'ssn'`, `'password'`, `'apiKey'`, `'token'`, `'secret'`, `'phoneNumber'`, `'emailAddress'`

**Parameterized operators**: `keepFirst(n)`, `keepLast(n)`, `truncate(n)`, `replace(fn)`

**Array combinator**: `arrayOf(config)` — applies a config to every element of an array field

**Zero-config layer**: `autoRedactConfig(state)` — scans top-level field names against the built-in blocklist and returns a `SanitizationConfig` automatically. Called by `withStellarDevtools` on every snapshot; explicit config always wins.

### Why sanitization is a prerequisite, not a feature

This is not primarily about regulatory compliance, though it satisfies that too. The specific concern is this: if a developer hands an AI assistant a raw state snapshot containing live user data, and that data contains adversarial text crafted to manipulate the AI's output, the sanitizer is a line of defense against that. Sanitization runs before any snapshot is recorded — redacted values never enter the history at all, not just hidden in the UI.

This is why sanitization shipped before export, before the clipboard feature, and before any AI-facing API surface. The order is not incidental.
