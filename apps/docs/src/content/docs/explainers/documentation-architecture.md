---
title: How the Stellar Documentation Is Organized — and Why
description: The three-bucket content architecture that separates project decision records, project philosophy, and general thinking that belongs elsewhere.
---

*This is a Technical Discussion Record (TDR) — not about a feature, but about how the documentation itself is structured and why. Captured so future contributors understand the intent behind what's here and what isn't.*

---

## What we were trying to solve

The explainers directory had grown to 22 documents. Some were dense, precise records of specific technical decisions. Some were high-level philosophy for orienting new contributors. Some were general thinking about AI and software development that had nothing specifically to do with Stellar. All three were mixed together under the same heading.

The result: a new contributor who sat down to read the explainers would get 22 documents of wildly varying register and relevance. The genuinely useful project-specific material was buried. The general philosophy was interesting but didn't belong to *this project* — it belonged to the broader conversation Jeff is having in public about AI and software development.

The secondary problem: some of the best thinking in those documents was hidden in the middle of other things. A key decision would be buried in a paragraph of philosophical context. The value was there; it wasn't findable.

---

## The three buckets

The content naturally sorted into three categories:

**Project-specific decision records** — what was decided, what was considered and rejected, why, what's deferred. Dense, precise, permanent. These belong in the project docs because a contributor needs them to understand how the project got to where it is and why certain things are non-negotiable.

**Project philosophy for contributors** — the high-level framing that helps a new contributor understand the organizing principle (AI Accessibility, plugin architecture, sanitization-first). Stays in the docs, but should be the minimum needed to orient — not a full exploration of the ideas.

**General thinking about AI and software** — observations about collaboration, clean code conventions, how to work with LLMs, what changes when friction costs drop. Genuinely valuable, but not specific to Stellar. This belongs on Jeff's blog, where it can reach the audience it's actually written for.

The fix was to sort the 22 explainers into these buckets, extract the general thinking into blog posts (preserving the prose largely intact), and trim what remained to serve contributors rather than document the journey.

---

## The constraint that made the decision obvious

**Documents that serve two purposes serve neither well.**

An explainer that's half project decision record and half philosophical exploration is too long for a contributor who needs the decision, and too sparse for a reader who wants the thinking. The separation isn't just organizational tidiness — it's about each artifact doing one job for one audience.

The blog is the right home for the exploration. The docs are the right home for the decisions. A contributor who wants to understand the philosophy can follow the links; a contributor who needs to know what was decided and why doesn't have to excavate it from philosophy.

---

## What was removed and why

Five explainers were removed entirely and published as blog posts:

- `friction-cost-and-collaboration.md` — Brooks' essential/accidental complexity framing, servant model limits; pure philosophy, no Stellar-specific content
- `pair-programming-with-ai.md` — general AI collaboration patterns; uses Stellar as an example but isn't about Stellar
- `clean-code-for-ai.md` — cognitive prosthetics vs. load-bearing conventions; general, the Stellar paragraph was a throwaway
- `library-ai-context.md` — library authors shipping AI context as first-class artifact; entirely general
- `keeping-principles-alive.md` (original) — the substance of this is in CLAUDE.md where it does actual work; the explainer was the prose explanation of something that already had a more authoritative home

One explainer (`llm-legible-documentation.md`) was trimmed significantly — the general principles sections became a blog post; the Stellar-specific implementation decisions (Starlight plugin choice, `llms.txt` convention, `description` frontmatter) stayed.

A replacement `keeping-principles-alive.md` was written describing the practical three-artifact continuity system (CLAUDE.md, memory, CURRENT.md) as something contributors can understand and adopt. Notably, it was written entirely by Claude — which is itself part of what it describes.

---

## The "AI Accessibility" term — a related decision

During this session, external pushback on the term "AI Accessibility" prompted a reexamination. A co-worker had suggested the term implied AI was "disabled."

The decision: keep the term, sharpen the framing.

The reframe made explicit in the `ai-accessibility.md` explainer: accessibility was never about deficit. It was always about removing unnecessary exclusivity from the environments we design. Screen readers exist not because blind people are broken but because "information must be conveyed visually" was an assumption baked into the environment that didn't need to be there. "AI Accessibility" applies the same move to the assumption that the consumer of runtime data is a human staring at a browser panel.

Retreating from a correct term because of a misread of it would be the wrong move. The fix was to say the quiet part loud at the top of the explainer rather than leaving the reframe implicit.

---

## What we deliberately deferred

**A `docs/` directory cleanup pass** — the root `docs/` folder had its own accumulation of historical artifacts (prototype sanitizer files, early session notes, superseded design documents). Most were removed this session; a few remain as active project references. No further immediate action needed, but the same "three buckets" logic applies if it accumulates again.

**A "contributor onboarding path"** — the 17 remaining explainers still don't have a clear "read these first" ordering for a new contributor. The `inside-the-codebase.md` explainer is pinned to the top of the sidebar, which is a start. A short contributor guide that says "read these three, skim these, ignore these unless you're touching X" would be worth adding once the contributor audience is real.

---

*This TDR was written from the session of 2026-04-02.*
