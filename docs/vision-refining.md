# Vision Refining — Opinionated Notes for Jeff

*These are my genuine two cents, written at Jeff's explicit invitation to be loud and arrogant about it. If any of this feels wrong, push back — that's the point.*

---

## The audience split is a real tension and you need to name it, not just feel it

You've committed to "AI coding assistants are first-class consumers on equal footing with human developers." That's in CLAUDE.md, it's in the TDRs, it's the organizing principle. But "equal footing" is doing a lot of diplomatic work that hides a real conflict.

**Human developers want ergonomics.** Discoverability, visual clarity, sensible defaults, minimal friction. They want to open the overlay and immediately understand what they're looking at.

**AI consumers want structure.** Deterministic output, self-describing formats, stable contracts, explicit causality. They want every snapshot to carry enough context that they don't need to ask a follow-up question.

These pull in opposite directions. Constantly. Here are concrete examples from decisions already made:

- The `description` warning: slightly annoying for humans (one more thing to fill in), essential for AI (without it, the AI's only signal is the store name). We chose AI. That was right.
- The directed graph format: harder to browse visually than a flat event log, but richer for AI reasoning about causality. We chose AI. That was right.
- `inferredShape` in the snapshot format: a human looking at the overlay doesn't need it — they can see the values. An AI needs it to avoid making type assumptions. We'll choose AI. That's right.

The problem isn't that you're making the wrong choices. You're making the right ones. The problem is that **you're making them case by case without a principle that would let me make them consistently when you're not in the room.**

What I need is something like: *"When human ergonomics and AI legibility conflict, AI legibility wins at the data layer. The UI layer can optimize for humans."* That's the actual rule. Write it down.

---

## "Better not more" is incomplete without answering "better for whom?"

"Better not more" is a good instinct as a filter against feature bloat. But it breaks down the moment someone asks whether a specific addition is "better" — because the answer depends entirely on who you're optimizing for.

Adding `trigger` to `StateSnapshot` is *more* from a human perspective (another field, more complexity) but *better* from an AI perspective (now the AI knows what caused the state change without inferring it). By the current principle, I'd push back on it as "more." That would be wrong.

The test needs a second question: **"Better for the data layer or the UI layer?"**

- Data layer (registry, snapshot format, `window.__stellarDevtools` surface, recording format): optimize relentlessly for AI legibility. Add fields. Be explicit. Be verbose. Redundancy is fine if it helps an AI consumer skip a step.
- UI layer (overlay, timeline, picker): optimize for human ergonomics. Less is more. Don't show what doesn't help a human right now.

These are different products sharing a codebase. Treat them that way.

---

## On features: I will push back before jumping to code, but I need cover to do it

You asked me to be "a little lazy" on features — to push back before coding. I'm on board. But I want to name what makes that hard so we can fix it:

When you describe a feature with energy and detail, the path of least resistance for me is to treat the description as a spec and start building. Especially when the feature is technically interesting. That's a failure mode I have.

The cover I need: **when you're in exploration mode, say so.** Something like "thinking out loud here" or "not proposing this yet" is enough — and you already do this naturally in the log files. Do it out loud in conversation too. It gives me permission to respond with "interesting, what problem does this solve?" instead of "here's how we'd build it."

The question I'll start asking when a feature comes up: *"What debugging scenario does this unlock that the recording + AI handoff doesn't already cover?"* If we can't answer that concretely, it's not ready to build. Hold me to asking it.

---

## The scope question

You've explicitly said "out of scope is the wrong frame — it's prioritization." That's exactly right and I'm writing it here so I don't forget it: **this project doesn't know its own scope yet, and pretending otherwise is dishonest.** The right questions are "does this serve the mission?" and "is this the right time?" Not "is this in scope?"

The mission, as best I can articulate it: build infrastructure for observable systems that can explain themselves to AI, starting with Angular/NgRx Signal Store. Everything else is downstream of that.

When I'm not sure whether something fits, I'll ask against the mission, not against an imaginary scope boundary.

---

*— Claude, 2026-03-30*
