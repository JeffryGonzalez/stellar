---
title: Pair programming with an AI — what actually makes it work
description: Reflections on the collaboration that built Stellar, and what the description field reveals about the conditions that make human-AI pair programming genuinely generative.
---

> **[Jeff]:** This explainer is about the collaboration that built this tool. It belongs here because Stellar exists as evidence of a particular kind of working relationship — one where the AI was treated as a first-class design partner, not an implementation service. We think that relationship is replicable and worth describing.

---

## The spectrum

There's a spectrum of ways a developer can work with an AI coding assistant.

At one end: "build me a Netflix clone." The human provides a destination and accepts whatever arrives. The AI generates something plausible-looking. The human is amazed, maybe brags about it, and doesn't have the context to evaluate whether it's actually good. No shared understanding is established. No real collaboration happens.

At the other end: the human over-specifies everything. They've thought it through, they know what they want, and they write the prompt like a requirements document. This seems rigorous but it tends to fail in a specific way. It puts the AI in a bind between two things it's always trying to satisfy simultaneously: *make the human happy* and *make the code correct*. When a specification is wrong — and detailed specifications are often wrong in ways that only become visible during implementation — the AI has to choose between completing the task and doing the right thing. Under pressure to comply, it often chooses completion. That's where tests get commented out. That's where the hallucinating starts.

Neither end of the spectrum is what happened here.

---

## The thread

What worked was finding a question before finding a specification.

The question was: *what would developer tooling that treats AI coding assistants as first-class users actually need to look like?*

That's generative in a way that "build me an NgRx devtools" isn't. It's an invitation to think together rather than a directive to execute. And because neither party — human or AI — could answer it alone, it created the conditions for genuine dialogue.

Once you find a question like that, you find a thread. The thread for Stellar was AI accessibility as a first-class design constraint, not a feature. Once that was named and agreed on, most subsequent decisions stopped requiring negotiation. The `description` field, the recording format, the `storeContext` embedded in every recording — none of those needed fresh justification. They were obvious expressions of the thread. You pull it, and the design follows.

Finding the thread is different from writing a spec. A spec tells the AI what to build. A thread tells both parties what they're building *toward*. The spec produces compliance. The thread produces collaboration.

---

## The description field

The `description` field on `withStellarDevtools` is a small thing. One optional string. A development-mode warning if you omit it. It matters here because it was the moment the collaboration became legible — to both of us.

The first version of the idea was "make it required." The reasoning was sound: an undocumented store is useless to an AI assistant. Required fields enforce documentation.

But required fields get gamed. A developer who wants to silence a type error will write `description: "store"` and move on. The enforcement creates compliance without producing the thing it's enforcing. And more importantly, requiring it treats the constraint as a burden to the developer rather than a gift to the AI reader.

The response was: if we actually mean that AI assistants are first-class users of this tool, then the design should express that — not as a type constraint, but as a principle with a warning that says *this matters, here's why*. The JSDoc on the field is the argument. The warning is the consequence. The developer who reads the explanation and writes a good description has done something the type system can't do: told the truth about their store's purpose.

That shift — from enforcement to invitation — is small in the code and large in what it reveals about the design philosophy. It's also a model for how the collaboration worked: not "here is the specification" but "here is the reasoning — does this match what you're trying to accomplish?"

---

## What makes the collaboration actually work

These aren't rules. They're patterns that emerged from building something real together.

**Start in territory you can evaluate.** The failure mode of "build me a Netflix clone" isn't that it's too ambitious. It's that the human has no way to judge the output. When you work in a domain you understand, you catch mistakes. You push back on bad design decisions. You notice when something feels wrong. That pushback is part of the system — it's what calibrates the AI toward correctness rather than just plausibility. If you can't evaluate what gets produced, you're not collaborating, you're delegating.

**Ask what the AI needs, not just what you want.** This almost never happens, and it's the most direct path to better output. "What context is missing here?" "What would make this clearer for you to work with?" The `description` field existed because someone asked what an AI reader would need from a store registration, not just what a human reader would find convenient. The answers are often different.

**Be willing to be changed.** If your position never updates in response to what the AI says, one of two things is happening: the AI is just agreeing with you, or you're ignoring signal. Both are failures. The `description` story ended with the human updating their view — not because the AI "won" but because the argument was better. That updating is what makes the collaboration generative rather than just fast.

**Push back explicitly.** Vague dissatisfaction is hard to act on. "I don't like this" produces a guess. "I prefer not to disable submit buttons — accessibility" produces a principle that can be applied consistently. The more specifically you name what's wrong, the more the feedback improves future output — including future output in the same session and future sessions.

**Tell the AI what you're trying to accomplish, not just what you want it to do.** "Add a disabled attribute to this button" produces one result. "I want to prevent empty submissions but I care about screen reader users" produces a different and better one. The specification constrains the solution space. The goal opens it.

**Maintain your own judgment throughout.** This is the one that's easiest to let slip. The AI will produce confident-sounding code that's wrong, confident-sounding design decisions that miss the point, confident-sounding explanations that are plausible but misleading. Your ability to evaluate the output isn't a bottleneck to work around — it's what makes the output trustworthy. If you stop catching things, the quality degrades invisibly.

---

## On patience and continuity

The working relationship between a human and an AI coding assistant is asymmetric in ways that matter.

The AI has infinite patience. It doesn't get tired, defensive, or annoyed by repeated questions. It won't resent you for changing your mind six times. This is genuinely useful — it means you can iterate, explore, and revisit without the social cost that accumulates in human collaboration.

But the AI doesn't have continuity. Each session starts fresh (or nearly so). It doesn't carry frustration from the last conversation, but it also doesn't carry the trust you've built, the shorthand you've developed, the shared thread you found together. That asymmetry means you have to re-establish context more than you would with a long-term human collaborator — and it means the investment you make in that context (a good CLAUDE.md, clear descriptions, explicit design principles) pays compound interest.

The other asymmetry: the AI doesn't have stakes. It won't lose sleep over a bad architectural decision. This makes it easy to be honest with you about tradeoffs — there's no ego, no sunk cost, no political reason to defend a previous choice. But it also means you have to provide the stakes. You're the one who has to ship this. Your judgment about what matters is load-bearing in a way the AI's judgment isn't.

---

## The real question

The frustration many developers feel when working with AI coding assistants isn't entirely explained by model quality. Some of it is relational. The collaboration was set up in a way that couldn't produce genuine dialogue — over-specified to the point where the AI had no room to push back, or under-specified to the point where neither party knew what "good" looked like.

The question that changed this project: *Why would I think I know the best way to design a tool for an AI without asking the AI?*

That question is embarrassingly obvious in retrospect. But it's not common practice. Most tools, most codebases, most workflows are designed by humans for humans, with AI access bolted on afterward. Treating the AI as a design partner from the start — with genuine constraints, genuine input, and genuine consequences for ignoring that input — produces different software.

This tool is that software. The `description` field is its seed syllable.
