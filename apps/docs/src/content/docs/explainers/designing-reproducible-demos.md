---
title: Designing reproducible demos for a debugging tool
description: How we approached the problem of demonstrating Stellar's value without requiring users to already have a broken codebase — and why controlled chaos is the right answer.
---

*This is a Technical Discussion Record (TDR) — a record of design thinking, not a changelog. It exists so future developers and future instances of Claude can understand not just what was built, but what problem it solved and what was ruled out.*

---

## What we were actually trying to solve

The surface problem was "we need a showcase app." The real problem is more specific: how do you demonstrate a *debugging tool* without a real bug to debug?

The value of Stellar — particularly the recording format and the "Copy for AI" workflow — is clearest when something has gone wrong or could go wrong. Race conditions, stale closures, missing error handling. But a showcase that just shows the happy path isn't demonstrating the tool's most distinctive capability. It's showing that state changes when you click buttons, which any devtools can show.

The constraint this imposed: **every demo scenario must be reproducible from scratch, on demand, without requiring the user to bring their own broken code.** The user needs to be able to follow steps, trigger the interesting behavior, get a recording, and paste it into an AI session — all within a few minutes of arriving at the page.

This ruled out showing real-world bugs from real codebases. Those are compelling as stories, but they're not reproducible by a reader. They require context the showcase can't provide.

---

## The chaos mode approach

The solution is synthetic failure: controlled, on-demand, reproducible degradation via MSW.

Two chaos modes emerged from the scenario list:

**`race` mode** — makes the first POST to a given endpoint wait 2.8 seconds while subsequent ones wait 0.6 seconds. This guarantees out-of-order responses for the race condition demo, every time, with no luck required. Without this, demonstrating a race condition requires either careful timing or randomness — neither makes for a clean demo.

**`errors` mode** — all mutations to the products API return 500. This drives the error path and dead letters demo without needing to actually break anything.

Both modes are toggled via a control endpoint (`POST /api/__dev/chaos`) that sets an in-memory flag in the MSW service worker. The Angular component tracks chaos state locally with a signal and sends the toggle request. On page reload, the service worker restarts and chaos resets to `off` — which is the right default.

What we deliberately avoided: *random* failures. A chaos mode that fails some percentage of requests makes demos non-reproducible and debugging confusing. The point of a demo is that the user knows exactly what should happen and can see exactly what did. Deterministic failure is much more valuable than realistic failure.

---

## The scenario page template

Each scenario page follows the same structure:

1. A brief description of what the scenario demonstrates
2. Numbered instructions: start recording, do X, stop, paste with this prompt
3. The interactive demo component
4. The suggested prompt, visible before you start — so you know what question you're trying to answer before you record

The suggested prompt is deliberately on the page rather than embedded only in docs. A user arriving cold should be able to run the demo and have the AI prompt ready without reading anything else. The scenario page is the unit of "go from zero to value."

The showcase landing page (`/showcase`) shows all scenarios as cards with the prompt visible — so the prompt becomes part of choosing which scenario to run. That's intentional: the prompts are the thing that makes recordings useful, and making them visible upfront raises their status from "optional extra" to "this is what the recording is for."

---

## The naïve store — intentional wrongness as pedagogy

The race condition scenario required a store that is demonstrably, structurally wrong — not randomly wrong, but wrong in a specific way that the recording can expose.

The bug chosen: stale closure. The store captures `store.products()` at call time, fires a request, then spreads from the captured snapshot when the response arrives. If another response lands in between and extends the products array, that addition is lost when the first response writes back to captured.

The decision to show the bug code directly on the page (not just in source files) was deliberate. The scenario isn't just "here is a race condition" — it's "here is *why* the race condition happens, and here is what Stellar's recording shows that makes it visible." The explanation and the tool are introduced together. The store's `description` field in `withStellarDevtools` also names the bug explicitly, so it appears in the recording's `storeContext` and the AI reading the recording knows what it's looking at.

---

## What we considered and rejected

**A separate showcase app (`apps/showcase-ng/`)** — cleaner separation, but doubles the tooling cost (Angular config, Nx project, Tailwind setup, MSW wiring). The right call is to add `/showcase` routes to the existing demo-ng app and extract later when the scenarios justify it. The deciding factor: the scenarios share infrastructure (MSW, chaos mode, ProductsStore) that would have to be duplicated or cross-referenced in a separate app.

**Random chaos** — see above. Reproducibility is the constraint. Random failures are realistic but not useful for demos where the user needs to know what to expect.

**Storing recordings as the communal knowledge artifact** — this came up in the context of "user-submitted scenarios." The recording from Jeff's specific app isn't reusable by anyone else — it's app-specific, large, and requires the same application state to be meaningful. The *pattern* extracted from the recording (what structural condition caused the bug, what the Stellar graph showed, what the fix was) is what generalizes. User-submitted scenarios should submit the generalized pattern, not the raw recording.

---

## What we deliberately deferred

**The `/capture-scenario` skill** — a Claude Code skill that, after a debugging session, extracts the generalizable pattern and scaffolds a new scenario component following the established template. Two build artifacts: the skill prompt and a scenario stub template. The build cost is low; the deferral is about sequencing — the showcase needs more scenarios first to validate that the template is stable before we build tooling to generate from it.

**Communal knowledge / pattern library** — the longer version of the user-submitted scenarios idea. After a session where Stellar + AI found a bug, the AI could generalize the pattern into something other teams could use. The mechanism (llms.txt? hosted repo? PR submissions?) needs more thought before building. The key question: who curates it, and what makes a pattern general enough to be worth including? Parked until there's evidence of demand from actual users.

**Three "coming soon" scenarios** — missing test coverage, story card verification, and CodeTour generation. All three have clear structure in the demo plan; none requires new infrastructure beyond what's been built. They're deferred because the three shipped scenarios (outbox, race condition, error path) are enough to validate the showcase format before investing in more.

---

*This TDR was written from the session of 2026-03-26.*
