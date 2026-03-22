---
title: Keeping Principles Alive Across Sessions
description: Why TDRs document reasoning but don't enforce behavior, and how we bridge that gap.
---

*This is a Technical Discussion Record (TDR) — not about a feature, but about the meta-level design of how this project maintains its commitments across many sessions and instances.*

---

## What we were trying to solve

Every decision documented in a TDR carries reasoning that took time to arrive at. The fear is re-litigating the same ground in a future session — not from bad faith, but because the reasoning isn't visible at the moment of the next decision. A developer (or an AI instance) looks at the current code, proposes something that seems reasonable, and doesn't know they're contradicting a commitment that was made for good reasons three months ago.

The secondary problem is subtler: future instances of Claude will read TDRs as informational. Context, not instruction. An AI that reads "we rejected X because Y" in a docs explainer will note it, probably agree with it, and then defer to whatever is being asked in the present conversation. The reasoning is present but the *permission to push back* is absent.

These are different problems. The first is a human memory problem. The second is an AI deference problem. They share the same solution, but it's worth naming them separately.

---

## What we considered and rejected

**Making key fields required in TypeScript** — the `description` field on `RegisterOptions` was the immediate case. Making it a required type enforces compliance but not intent. A developer writes `description: 'store'` to satisfy the compiler and moves on. The commitment is satisfied in letter and violated in spirit. Worse: it signals to an AI that the developer has thought about this, when they haven't. Checkbox compliance is worse than honest absence.

**Trusting the TDRs to do enforcement** — TDRs live in the docs site. A future Claude session might read them if explicitly directed to, but they aren't in the instruction path. They're reasoning, not rules. An AI that reads a TDR and then receives a contradicting request from the developer is likely to defer to the present instruction, not the historical document.

**Informal discipline** — relying on Jeff to remember the principles and apply them consistently. This is the current default for most projects. It works until it doesn't, and the failure mode is invisible until the damage is done.

---

## The constraint that made the decision obvious

**CLAUDE.md is the enforcement surface. TDRs are the reasoning surface. They serve different purposes and must be maintained separately.**

CLAUDE.md is loaded into every session as binding instruction. An AI that reads "push back on this as a blocking concern, not a suggestion" in CLAUDE.md will do so. The explicit grant of permission matters — without it, the default is deference. With it, the AI has a mandate.

TDRs carry the *why* — the rejected alternatives, the key insight, the condition under which we'd revisit. This is what makes pushback useful rather than obstructive. "Here's the concern, here's why it matters [pointer to TDR], here's what I'd suggest instead" is a productive intervention. "No" is not.

The pattern:
- **TDR** — captures reasoning, rejected alternatives, deferred questions. Written once, read for context.
- **CLAUDE.md** — extracts the bottom-line rule with enough context to apply it and a pointer to the TDR. Actively maintained. The source of behavioral instructions.

When a design session crystallizes a genuine commitment, the work isn't done until:
1. The TDR captures the reasoning
2. CLAUDE.md extracts the rule in enforceable form

The rule in CLAUDE.md should be specific enough to recognize violations, brief enough to keep CLAUDE.md scannable, and always paired with a TDR pointer so the reasoning is accessible when needed.

---

## The dev-mode warning as the right implementation

The `description` field case illustrates the principle in code. The right implementation of "description matters" is not a required TypeScript field — it's a dev-mode `console.warn` with a message that explains *why*.

```
[Stellar] 'TodosStore' has no description. Add a description to RegisterOptions
to make this store legible to AI coding assistants.
```

A warning can't be satisfied by a meaningless string without the developer actively ignoring their own conscience. It communicates the reasoning at the moment it's relevant — not in a docs page, not in a type error, but as live feedback during development. And it's suppressible in production without defeating the purpose, because production isn't where the communication needs to happen.

This generalizes: when a principle requires human judgment to apply correctly, the right enforcement is feedback that explains the reasoning, not a gate that can be bypassed by compliance theater.

---

## The review skill as periodic commitment health check

Design commitments drift. Not from bad intent — from the accumulation of small decisions, each locally reasonable, that collectively move away from the original position. The review skill (`/review`) was extended to include a dedicated section: *design commitment drift*.

The review checks whether each commitment in CLAUDE.md's "Design Commitments — Enforce These" section is still reflected in the code. It's not a linting check — it's a reasoning check. Some drift is intentional and should update the commitment. Some drift is accidental and should be reversed. The distinction requires judgment, which is why it's in a review skill rather than a CI gate.

The intended cadence is roughly weekly for active development periods. The value is less in catching violations — most are caught at the time — and more in keeping the commitment list itself honest. Commitments that no longer reflect reality should be updated or removed. A stale commitment list is worse than no list.

---

## The observation about artifacts serving the human

Something worth naming explicitly: the artifacts — TDRs, CLAUDE.md, CURRENT.md, the use-case log — were initially framed as solving the AI session continuity problem. The "Groundhog Day" problem: each session starts cold, and the developer has to re-establish context.

They do solve that. But they serve a second purpose that's at least as important: they force the developer to articulate decisions clearly enough to be operationalized. The discipline of writing a TDR — naming the rejected alternatives, naming the key insight, naming what's deferred — is valuable independent of whether an AI ever reads it. It surfaces assumptions, catches premature closure, and creates a record that the developer can return to when their own memory has faded.

The artifacts are not just memory for AI. They're thinking made durable.

---

## What we deliberately deferred

**Automated drift detection** — a CI check that compares CLAUDE.md commitments against actual code. Technically possible for some commitments (e.g., check that `describe()` still carries the caveat), not for others (e.g., whether `description` warnings are suppressible by default). The manual review step is the right answer for now.

**Formal versioning of commitments** — treating commitments like an API with semver. Worth considering if the project grows to multiple contributors. Not warranted for solo development.

**A public-facing "design principles" document** — extracting the commitments from CLAUDE.md into something readable by contributors who aren't using Claude Code. The audience doesn't exist yet. Worth doing if it does.

---

*This TDR was written from the session of 2026-03-22.*
