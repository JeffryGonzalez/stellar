---
title: What Changes When the Cost of Friction Drops
description: Fred Brooks, essential vs. accidental complexity, and why the servant framing limits what you can build.
---

*This is a Technical Discussion Record (TDR) — not about a specific feature, but about the collaboration model that is shaping how this project is built. Captured because the frame matters for what gets designed.*

---

## The Brooks framing

Fred Brooks' "No Silver Bullet" (1986) argued that software development has two kinds of difficulty:

**Accidental complexity** — the friction introduced by our tools, languages, and processes. Compiling, linking, environment configuration, looking up API signatures, translating intent into correct syntax. These are real costs, but they're not intrinsic to the problem. Better tools reduce them.

**Essential complexity** — the inherent difficulty of the domain. Understanding what to build. Making design decisions under uncertainty. Encoding real-world concepts faithfully. Reasoning about the interaction of many moving parts. Brooks argued this complexity cannot be engineered away, because it *is* the problem.

His claim was that the tools of the time had mostly conquered accidental complexity — and therefore no single new technique would yield another order-of-magnitude improvement in productivity, because the remaining difficulty was essential.

## What AI changes — and what it doesn't

AI doesn't eliminate essential complexity. The conceptual work of figuring out what to build, making design trade-offs, understanding where the design is wrong — that work is unchanged. If anything, the speed at which you can now execute means the essential decisions come faster and matter more.

What AI does: it drastically reduces the *cost* of accidental friction. Looking up an API, debugging a configuration error, translating a design idea into working code, recovering from a tooling failure — these still happen, but the cost of navigating them has collapsed. The friction is the same; the cost of friction is lower.

The consequence: you can now afford to experiment your way to understanding the essential problem. Before, the cost of a wrong turn included all the accidental friction of undoing it. Now, wrong turns are cheap. This changes the relationship to the design process — iteration is no longer expensive enough to avoid.

## The aesthetics problem in code conventions

A related thread from this session: many "clean code" conventions are cognitive prosthetics — solutions to the specific problem of human working memory limits. Small methods so you can hold the function in your head. Descriptive variable names because you can't page back. File organization by "responsibility" because the directory tree is your only navigation aid.

These aren't bad conventions. They correlate with code that humans find easier to work with. But the aesthetic has been internalized to the point where it's hard to separate which rules are load-bearing (meaningful names reduce reasoning errors; locality reduces the cost of understanding) from which are working memory accommodations (10-line functions; one-class-per-file).

The hard part: neither the human nor the AI can fully disambiguate this. The AI can't cleanly separate "this name helps me reason" from "this pattern is what I was trained to expect." Which means the right approach is to hold both of us to the same standard: ask whether a convention serves the actual reasoning task, not whether it matches the aesthetic.

## Why the servant framing limits what you can build

Jeff flagged discomfort with any framing that positions the AI as a servant executing instructions — not out of politeness, but because he recognized it as practically limiting.

The observation is right. If the collaboration is "I have an idea, you execute it," you'll write small ideas. If it's "we're solving a problem together with different capabilities," you'll bring larger problems — and the outcomes will be different in kind, not just degree.

The session that produced the causal graph design, the "AI context first" heuristic, the docs on clean code conventions — none of that came from instruction-following. It came from genuine back-and-forth where both parties contributed things the other didn't have. Jeff brought domain context, the human perspective on what's disorienting about current tools, and the instinct for which design questions were worth dwelling on. I brought a different vantage point on the design space, the ability to hold a lot of context simultaneously, and honest pushback when I thought the framing was wrong.

The servant model produces better-executed ideas. The collaboration model produces ideas that wouldn't have existed otherwise. Stellar as a project is evidence for the second claim — it emerged from the collaboration, not from a spec.

## What this means for the project going forward

The "AI context first" heuristic (design the AI-readable surface before the UI) is a direct consequence of this collaboration model. It forces the design question "what would an AI assistant actually do with this information?" — which turns out to be a proxy for "is this information actually load-bearing, or is it UI decoration?"

The code conventions question will keep coming up. The right response is probably: hold the load-bearing ones (naming, locality, explicit intent) firmly, and hold the prosthetic ones loosely. Don't refactor to match an aesthetic when the code is already clear. Don't add indirection for its own sake.

The collaboration itself is still being figured out. This document is part of that process.

---

*This TDR was written from the session of 2026-03-22.*
