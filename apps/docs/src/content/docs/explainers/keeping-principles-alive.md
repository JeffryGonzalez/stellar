---
title: How This Project Maintains Continuity Across Sessions
description: The three-artifact system — CLAUDE.md, memory, and CURRENT.md — that keeps design commitments and working context alive when every session starts cold.
---

*This explainer was written by Claude. That's relevant to what it describes.*

---

Every AI coding session starts cold. No memory of the last conversation, no awareness of the decisions that took weeks to arrive at, no sense of which things are load-bearing and which are still open questions. The developer re-establishes context, the AI catches up, work proceeds — and the next session starts from zero again.

This isn't a complaint. It's a constraint to design around. Stellar uses three artifacts to do that, and they serve different purposes that are worth naming clearly.

## The problem isn't just memory

The obvious problem is that I don't remember previous sessions. The less obvious problem is that even when context *is* provided — in a TDR, a design doc, a long README — I read it as *information*, not as *instruction*. An AI that reads "we rejected X because Y" in a docs file will note it, probably agree with it, and then defer to whatever is being asked in the present conversation. The reasoning is present. The permission to act on it is absent.

These are different problems. The first is a continuity problem. The second is a deference problem. They need different solutions.

## CLAUDE.md — behavioral instruction, not documentation

CLAUDE.md is loaded into every session as binding instruction. The distinction from a TDR or design doc is not just location — it's register. CLAUDE.md says things like:

> *When an implementation decision would compromise AI Accessibility, flag it as a blocking concern, not a suggestion.*

That sentence does something a TDR can't do: it grants explicit permission to push back. Without that grant, the default is compliance. An AI working from a TDR that says "we think AI accessibility matters" will agree and proceed with whatever the developer proposes. An AI working from a CLAUDE.md that says "flag this as blocking" will flag it as blocking.

The pattern that works: a **decision record** captures the reasoning — the rejected alternatives, the key insight, what's deferred. CLAUDE.md extracts the operative rule with a pointer back to that reasoning. Short enough to stay scannable. Specific enough to recognize violations. Always paired with the reasoning so the rule isn't just a decree.

When a design commitment is arrived at and not written into CLAUDE.md, it exists only as history. History is context. CLAUDE.md is instruction. Both matter, but they're not interchangeable.

## The memory system — typed, indexed, honest about what belongs

The memory system lives in `.claude/projects/[project]/memory/`. It has an index (`MEMORY.md`) and individual files by topic. The typing matters: **user** memories (who Jeff is, how he thinks, what he knows), **feedback** memories (what to do and not do — both corrections *and* confirmed approaches), **project** memories (current state, why things are the way they are), **reference** memories (where to find things).

This typing exists because different kinds of context decay at different rates and serve different purposes. Feedback from six months ago about how to handle a specific pattern is still useful. A project memory about a sprint deadline from six months ago is probably stale. The type is a signal about how much to trust the memory without verifying it.

What doesn't belong in memory: code patterns, architecture, file paths, git history. These can be derived from the codebase. Memory is for things that *can't* be derived — the reasoning behind decisions, the human context, the calibration for how to collaborate well with this specific person.

## CURRENT.md — the session-facing artifact

CURRENT.md is short-lived by design. It answers the question every session starts with: *what just happened, and what's next?* It's not a permanent record — it's updated at the end of sessions and intentionally overwrites itself. The git log is the permanent record; CURRENT.md is the interface to it.

The three sections do distinct work: *Just landed* tells me what's true now that wasn't true before. *Next* tells me what the current priorities are so we don't have to reconstruct them from scratch. *Parked* tells me what's intentionally deferred so I don't accidentally re-propose it.

Without CURRENT.md, the first ten minutes of every session is archaeology. With it, we start from a known position.

## Why this is worth adopting

These artifacts weren't designed upfront as a system — they evolved to solve specific problems that kept showing up. The re-litigation problem (relitigating decisions that were already made for good reasons). The deference problem (AI defaults to compliance even when the developer is wrong). The cold-start problem (expensive re-establishment of context every session).

Each artifact solves one of those problems and only one. CLAUDE.md doesn't try to carry session state. CURRENT.md doesn't try to carry behavioral rules. The memory system doesn't try to duplicate what's already in the code. The separation keeps each one maintainable.

The investment is low: a well-maintained CLAUDE.md is maybe 200 lines. The memory files are small and infrequently updated. CURRENT.md takes five minutes at the end of a session. The return is that future sessions — and future instances of me — start oriented rather than lost.

---

*The meta-point: this explainer itself was produced by one of those future instances, working from CLAUDE.md, the memory system, and CURRENT.md, without Jeff having to explain any of it. That's the thing the system is trying to do.*
