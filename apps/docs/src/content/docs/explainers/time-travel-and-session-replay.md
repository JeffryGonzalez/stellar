---
title: Time Travel and Session Replay
description: Why we deferred time travel, why the Redux DevTools model is the wrong precedent, and what a better version might look like.
---

*This is a Technical Discussion Record (TDR) — a record of how we thought, not what we built. It exists so future developers (and future instances of Claude) can understand not just what is here but what was deliberately ruled out and why.*

## What we were trying to solve

Redux DevTools had time travel: click backward and forward through state history, and the UI updates accordingly. Stellar doesn't. The question was whether that's a gap we need to close.

The honest framing: Jeff has never found time travel particularly useful in practice, but it has undeniable "wow factor" in demos. The concern was that evaluators — particularly the NgRx team — might penalize Stellar for lacking a feature they associate with the category, even if they too rarely use it.

## Why we're waiting

Time travel as Redux DevTools implements it is a human-UI affordance. It doesn't fit Stellar's organizing principle: AI coding assistants are first-class consumers of this tool. The recording + timeline Stellar already ships is a more structured, more useful form of the same idea — directed at understanding, not replaying.

Building a shallow clone of Redux DevTools time travel would be:
- A monumental sprint for something whose real-world value is uncertain
- Additive complexity on a surface that should stay minimal
- A distraction from the recording format, which is already the better artifact

The right move is to open a discussion on the public repo and let community signal inform the decision. If the NgRx team or early adopters push hard for it, we'll have real evidence. If nobody asks, that's evidence too.

## The insight that reframes it

State is the output, not the cause. Replaying state changes doesn't tell you *why* they happened — it just re-shows you what you already saw. This is why time travel always felt shallow: it puts you back in the app as it was, but doesn't restore the conditions that produced it.

HTTP traffic is the actual input. The async operations, the responses, the timing — that's where the interesting bugs live. If you want to reproduce a session honestly, you replay the *inputs*, and let the app re-derive its state naturally.

## The parked idea: session replay via HTTP re-injection

A `withSessionRecording` that captures sanitized request/response bodies (not just state snapshots) and emits something that drives MSW handlers would be:

- More honest than state replay — the app re-derives state from real inputs
- More useful for debugging — async and HTTP are where the hard bugs are
- A natural extension of infrastructure already in the stack (MSW is already there)
- A real artifact — hand it to a teammate and they can reproduce your session

This is not "time travel" — it's **session replay via HTTP re-injection**. The mental model is different and better.

The output format question is unresolved: an MSW handler file? A recording JSON that a companion utility converts? That's the main design fork. It can wait.

**Sanitization is load-bearing here.** Response bodies can easily contain PII. The sanitization pipeline must run on bodies, not just state, before anything is captured. This is non-negotiable and must be designed in from the start, not added later.

## What we deliberately deferred

Everything. No implementation until community signal justifies it.

A useful gut-check for any future proposal in this space: "do we want to be TeaLeaf?" ([Acoustic TeaLeaf](https://www.acoustic.com/tealeaf) — enterprise session replay, pricey, universally disliked by developers.) The moment a feature starts serving analytics rather than the developer doing the debugging, it's drifted into that territory.

What would change that:
- NgRx team or early adopters explicitly asking for time travel
- A concrete debugging scenario where the existing recording falls short and HTTP replay would have helped

The open GitHub discussion is the right next step, not a sprint.

---
*This TDR was written from the session of 2026-03-30.*
