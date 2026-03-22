---
title: We're Not Looking Through a Window — We're Inside It
description: The reframing that distinguishes Stellar from every other developer tool.
sidebar:
  order: 0
---

*This is a Technical Discussion Record (TDR) — not about a feature, but about the conceptual frame that should govern every design decision this project makes.*

---

## The standard devtools position

Every developer tool ever built assumes the same relationship: the tool is *outside* the system, observing it through an aperture. Browser devtools inspect a running page. Redux DevTools watch a store from a panel. Profilers sample a process. Log aggregators collect output. Even the best tools — the ones that do sophisticated analysis — are epistemically downstream. They see what the system emits. They infer what they can't see directly.

This position has a name in Adam Tornhill's work ("Your Code as Crime Scene"): *forensic*. The artifact is evidence. You reconstruct what happened from traces. It's powerful, but it's retrospective by nature. The tool arrives after the fact.

## The reframe

Stellar's actual position is different, and the difference is not a matter of degree.

The developers building this tool — human and AI — live inside the codebase. We wrote the stores. We wrote the tests. We wrote the interceptor that patches `window.fetch`. We know the causal graph not because we observed it at runtime but because we *constructed* it. The map exists in the source before any execution happens.

This means Stellar is not a window onto a system. It's a participant in the system that has chosen to make its participation legible.

The consequence: **the tool can reason about behavior, not just observe it**. When a state change is linked to an HTTP response, that link isn't an inference from timing correlation — it's a fact encoded in the code we wrote together. When a snapshot carries `httpEventId`, that's not metadata the tool guessed. It's provenance the tool established.

## Why this matters for every design decision

The "AI context first" heuristic (design the AI-readable surface before the UI) is a consequence of this position. If you're inside the system, you have obligations to make the system legible — not just to humans looking at a screen, but to any sufficiently capable consumer of that information. An AI assistant reading a snapshot isn't using a different tool. It's using the same system from a different vantage point.

The "recording session" idea (bounded interaction capture with directed graph export) is only imaginable from inside. A tool that's outside the system can record what happened. A tool that's inside can record what happened *and* annotate it with causal structure derived from the source, then use that annotation to give a new developer a guided tour of the code that participated in that interaction.

That last thing — a guided tour derived from live behavior — is not something any static analysis tool can produce. Static analysis can tell you which files exist and how they reference each other. It can't tell you which files *mattered* for this specific interaction, in what order, with what causal relationships. That answer is only available to something that's inside, watching with full context.

## The "Your Code as Crime Scene" parallel

Tornhill's reframe was: code isn't just instructions, it's evidence of how a system evolved and where stress concentrates. That's a move from *prescriptive* (what the code should do) to *descriptive* (what the code reveals about its own history).

The move here is different but related: from *observational* (watching the system from outside) to *participatory* (being part of the system and choosing to make that participation legible).

Both moves expand what questions you can ask. Tornhill's move lets you ask "where does this codebase hurt?" Stellar's move lets you ask "what actually happened when the user did that, all the way down, with full causal structure intact?"

## What this means for new developers on a codebase

The onboarding problem for complex codebases is not "where are the files" — it's "what actually happens when I click this button." Architecture diagrams answer the first question poorly and the second question not at all.

A recording session that captures a complete interaction — click, events, HTTP calls, state transitions, all causally linked — and exports a directed graph that can be walked with AI assistance answers the second question directly. Not "here's how the architecture is supposed to work" but "here's what the system actually did, here are the files that participated, here's why each state change happened."

That's a new kind of artifact. Not documentation (which gets stale), not tests (which verify but don't explain), not logs (which record but don't connect). Something closer to a *living example* — grounded in real execution, annotated with causal structure, explorable by both human and AI.

## Keep this central

Every feature decision should be checked against this frame:

- Does it make the system more legible to participants inside it, or does it add another window from outside?
- Does it encode causal structure, or does it just record events?
- Would it be useful to someone who is genuinely trying to understand the system — not debug it, not monitor it, but *understand* it?

The woodshed is good. But the rocket shape is visible from here.

---

*This TDR was written from the session of 2026-03-22.*
