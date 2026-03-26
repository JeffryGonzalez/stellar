# Demo Plan — Showcase App Inventory

A living inventory of what each demo scenario requires. Each entry names the scenario, what it demonstrates, and what the app needs to make it runnable.

The demo app could be built inside this repo first (`apps/showcase-ng/`) and extracted later. The deciding factor is whether it needs a substantially different structure than the current `apps/demo-ng/` (which prioritizes testing the library surface over telling a story).

---

## Scenarios

### 1. Outbox Pattern (Optimistic Updates)

**Demonstrates:** "Concurrent mutations — Copy for AI prompt"
**Core claim:** Stellar makes it possible to verify that optimistic updates stayed consistent across overlapping in-flight requests — something nearly impossible to confirm from logs alone.

**What exists:** `apps/demo-ng/` ProductsStore already does this. The recording from the Sunday session confirmed it works.

**What it needs:**
- `description`: "Product catalog with outbox pattern. Tracks in-flight mutations (additions, updates, deletions) and failed requests (dead letters). Exercises causal linking between HTTP events and state changes." ✓ (already set)
- `sourceHint`: path to products store — **not yet set**
- MSW handler with realistic latency (300–800ms) so requests actually overlap
- A UI that makes it obvious *which* buttons fired which requests (button labels → HTTP labels → overlay trigger labels)
- The "Add product" button should not reset the input after submit, so rapid-click demos are possible ✓

**Recording workflow:**
Start recording → click Add 3 times rapidly → watch outbox grow/drain → stop → Copy for AI → paste concurrent mutations prompt

---

### 2. Race Condition (Naïve Pattern vs. Safe Pattern)

**Demonstrates:** "Concurrent mutations" prompt + why outbox is worth the complexity
**Core claim:** An AI reading a Stellar recording can identify a race condition that tests wouldn't catch.

**What it needs:**
- A *naïve* store alongside the outbox store — one that does `patchState({ items: response.data })` on every response, without tracking which response corresponds to which request
- MSW chaos toggle: a button in the UI (or console command) that delays specific requests so responses arrive out of order
- `description` that's honest: "Naïve product store — overwrites state on every response without checking for stale responses. Intentionally broken to demonstrate race condition."
- `sourceHint` on both stores

**Recording workflow:**
Enable chaos mode → trigger overlapping requests → observe state overwrite → Copy for AI → paste race condition prompt → AI identifies the stale-write edge

**Outstanding work:**
- Build the naïve store (keep it separate from the outbox store)
- Add MSW chaos mode (response delay / out-of-order injection)
- This requires MSW handler changes — probably a `?chaos=true` query param or a devtools toggle that hits a `/msw/chaos` endpoint

---

### 3. Missing Test Coverage

**Demonstrates:** "What tests am I missing?" prompt
**Core claim:** AI cross-referencing a recording against store code can identify uncovered branches faster than manual review.

**What it needs:**
- A store with meaningful branching: success path, error path, edge case (empty result, partial failure, retry)
- A recording that only hits the happy path
- `sourceHint` pointing to the store file (required — AI needs the code to cross-reference)
- Store code written in a way that makes branches legible (clear `if/else` or `switchMap` patterns, not deeply nested)

**Recording workflow:**
Record happy path only → Copy for AI → paste store file → paste "what tests am I missing" prompt → AI identifies error path, empty-result case, etc.

**Outstanding work:**
- A store with explicit error/retry logic (could be the todos store extended, or a new one)
- The store code needs to be representative of real test-gap scenarios

---

### 4. Story Card Verification

**Demonstrates:** "Verify story card coverage" prompt
**Core claim:** Recording an interaction against acceptance criteria gives a verifiable artifact that the feature ships.

**What it needs:**
- A story card (Markdown, in the repo) with specific, verifiable acceptance criteria
- A store + UI that implements those criteria
- `description` on the store
- Recording that exercises all criteria (and possibly one that misses one, to show the gap)

**Recording workflow:**
Paste story card → paste recording → "does this recording demonstrate all criteria?" → AI identifies gaps

**Outstanding work:**
- Write a sample story card (`docs/demo-stories/add-product.md` or similar)
- Decide whether this demo uses an existing store or a new one
- The story card needs criteria specific enough for an AI to check (not "user can add items" but "outbox count increases by 1 immediately on add, before response arrives")

---

### 5. Error Path / Dead Letters

**Demonstrates:** debugging prompts — "is the behavior correct?" + "find the cause"
**Core claim:** Dead letters are visible in Stellar recordings; an AI can trace the failure path from request to state.

**What it needs:**
- A store that tracks `deadLetters: FailedMutation[]` (the outbox store already has this shape — confirm it's populated on error)
- MSW handler that returns 500 on demand (chaos mode — same toggle as race condition scenario)
- `description` that mentions dead letters specifically so the AI knows to look for them
- UI that shows the dead letter count so the recording visually confirms the state change

**Recording workflow:**
Enable chaos → trigger a mutation → observe 500 → state shows deadLetter added, outbox drained → Copy for AI → "does the recording confirm that failed requests are captured correctly?"

**Outstanding work:**
- Confirm current ProductsStore dead letter path actually populates `deadLetters` in state
- Confirm MSW handler returns 500 in a triggerable way (not just random)
- The chaos mode toggle is shared with the race condition scenario — build once, use both

---

### 6. CodeTour Generation

**Demonstrates:** "Generate a CodeTour file" prompt
**Core claim:** A recording + `sourceHint` → AI generates a guided walkthrough of the code path that actually ran.

**What it needs:**
- `sourceHint` filled in on **every** store that participates in the recording — this is load-bearing, not optional
- A recording named after a user scenario (not "recording") — the overlay already supports naming
- Store files that are readable on their own (not too many layers of abstraction)
- VS Code CodeTour extension installed in the demo environment

**Recording workflow:**
Name the recording ("customer-checkout-flow") → record → Copy for AI → paste store source files → paste CodeTour prompt → open `.tours/*.tour` in VS Code

**Outstanding work:**
- `sourceHint` on all demo stores — ✓ already set on all 6 demo stores
- Confirm the CodeTour JSON format the AI should generate (look at the extension's expected schema)
- Possibly add a `.tours/` directory to the demo app with a README explaining how to open tours

---

### 7. New Developer Onboarding

**Demonstrates:** "Explain the pattern" + "Document the pattern for the next developer" prompts
**Core claim:** A recording is a better onboarding artifact than a README because it's grounded in execution.

**What it needs:**
- A recording of a complete, meaningful interaction (outbox pattern is ideal — it's non-obvious)
- `description` that gives the AI enough context to explain the store's purpose without code
- Store code that's representative of the patterns a new developer would actually encounter

**Recording workflow:**
Record the full outbox flow → Copy for AI → paste "explain the pattern" or "document the pattern for the next developer" prompt → share output with the new developer instead of a wiki page

**Outstanding work:**
- This demo reuses existing infrastructure — no new stores needed
- The "explain for new developer" prompt needs refinement for audience framing (Angular + NgRx background assumed, outbox pattern not assumed)

---

## Shared Infrastructure Needed

| Thing | Status | Notes |
|---|---|---|
| MSW chaos mode (500 on demand) | Not built | Shared by race condition + error path demos |
| `sourceHint` on all demo stores | **Done** | All 6 demo stores have sourceHint set |
| Realistic MSW latency (not instant) | Partial | Confirm current delay range |
| Story card sample | Not written | Needed for story card verification demo |
| Naïve store (race condition) | Not built | New store, new component |
| Dead letter UI indicator | Unclear | Confirm current products UI shows deadLetters |

---

## App Structure Notes

The current `apps/demo-ng/` app is structured around testing the library surface (one route per sanitization operator, etc.). A showcase app should be structured around user scenarios.

Options:
1. **Add a new route to demo-ng** — `/showcase` with the full scenario app. Quickest to start.
2. **New app in this repo** — `apps/showcase-ng/`. Clean separation; better for eventual extraction.
3. **Separate repo** — only when the showcase is stable and the library is published.

Recommendation: start with option 1 (new route in demo-ng) to keep tooling costs low, extract to option 2 when the showcase has enough scenarios to warrant its own structure.

---

> **[Jeff]:** This is a living document. Add scenarios as they're discovered, update status as infrastructure is built. The goal is a showcase app where every demo is reproducible by running the app, performing an interaction, and pasting the output into a fresh AI conversation with no additional context.

> **[Jeff]:** I'm also thinking that this might be a great place for "user submitted scenarios" when we open this up. I'm thinking like "Whew, thanks, Claude - you just helped me figure out this hairy production issue! Do you think we can generalize what was going on in a way that it could be represented to others that use this tool?" Or even how far we'd get if we just asked the LLM after a session "Looking at the example scenarios at this url, could you create a narrative that would represent the work that we just did and what the solution ended up being" - and having that list somehow (llms.txt?) available as sort of "LLM Communal Knowledge"?
