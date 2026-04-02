---
title: Demo Video — Timecoded Description
description: A timecode-aligned description of the Stellar Devtools demo video, written for AI assistants that cannot watch video directly.
---

*This page exists so AI coding assistants can reason about the demo video without watching it. The video is hosted at [https://vimeo.com/1179648231](https://vimeo.com/1179648231).*

---

## What the video demonstrates

The demo runs against the [live demo app](https://stellar-demo.hypertheory-labs.dev) — viewers are invited to open it and follow along. No voiceover. The app uses Angular + NgRx Signal Store. Stellar Devtools is the in-browser overlay visible throughout.

The video is approximately 4 minutes 52 seconds long.

---

## Timecoded description

**0:00–0:03**
Video fades in. Standard Angular app visible — nothing unusual. No devtools overlay visible yet.

**0:03–0:07**
Stellar overlay opened via button in the bottom-right corner of the app. Store picker panel appears listing available stores.

**0:07–0:14**
CounterStore selected from the picker. Initial state displayed in the overlay.

**0:14–0:28**
User increments the counter multiple times and performs various interactions. State updates live in the overlay with each action. The timeline builds up showing the sequence of snapshots.

**0:28–0:39**
User opens the Diff panel. Several diffs from the timeline are shown — the overlay highlights what changed between snapshots.

**0:39–1:01**
User switches to BooksStore. Demonstrates that each store maintains its own independent timeline. User scrolls to make both the Books demo UI and the Stellar timeline overlay visible simultaneously. Resizes the overlay. Continues interacting with the books list — state changes and diffs update live.

**1:01–1:07**
User navigates to the Outbox demo route.

**1:07–1:12**
User clicks the Record button on the Stellar overlay. Recording session begins.

**1:12–1:22**
User clicks Reload to force an HTTP call. The HTTP request and response are captured in the recording.

**1:22–1:31**
User adds a new product named "Chips" at a price of $2.23. A new item appears in the list and the state snapshot is captured.

**1:31–1:37**
User rapidly adds three more products named "Other product" at $0.00. The Outbox pattern is visible: the pending-changes count increments with each addition before the HTTP responses arrive. The display of pending (in-flight) changes is prominent.

**1:37–1:42**
User edits an existing item, changing its price. This forces a new HTTP call — the causal link between the UI action and the HTTP request is captured.

**1:42–1:49**
User deletes an item from the list. Another HTTP call generated and captured.

**1:49–1:55**
User opens the HTTP overlay panel. The waterfall of HTTP requests and responses is visible. The four rapid additions are especially prominent — four requests fire in parallel, four 201 responses arrive, the outbox drains from 4 to 0.

**1:55–2:00**
Text overlay appears: "Top lane shows events." User clicks on individual event nodes in the top lane of the recording timeline. The devtools panel shows the selected event's details.

**2:00–2:05**
Text overlay: "Middle lane shows HTTP requests." User selects events in the top lane and the corresponding HTTP requests in the middle lane are highlighted, showing the causal relationship between user actions and network activity.

**2:05–2:24**
Text overlay: "Bottom shows state changes in the store." User demonstrates the full causal chain: event in top lane → HTTP request in middle lane → state snapshot in bottom lane. The directed graph structure of the recording is made visually explicit.

**2:24–2:31**
Text overlay: "Copy directed graph and explanation for the LLM." User clicks the "Export for AI" button. The recording session — a directed graph of events, HTTP calls, and state snapshots, with a self-describing format explanation — is copied to the clipboard.

**2:31–2:44**
Display switches to a full-screen terminal. GitHub Copilot TUI is loaded, running in the directory containing the demo app's source code. (The terminal header confirms the model in use: GPT-5.4.)

**2:44–2:52**
User pastes the copied graph and explanation directly into the Copilot prompt. No additional context or framing is provided — the recording artifact is handed to the model as-is.

**2:52–3:08**
The AI processes the input. User scrolls idly through the pasted data while waiting. GPT-5.4 begins generating output.

**3:08–3:37**
GPT-5.4 delivers its first response (displayed in the terminal):

> *"This recording shows the outbox/causal model working cleanly on the happy path. Every mutating click immediately increments outbox, every HTTP success drains it, and the resulting products count reconciles exactly as expected. The concurrent burst is especially legible: four rapid Add product clicks drive outbox 0→4, then four 201 responses drain it back to 0 while products grows 4→8. The two deletes do the same thing in parallel.*
>
> *What it does not show is just as important: there are no failed requests, so the dead-letter path is unexercised here. The Save flow also exposes a visibility limit in the current snapshot delta: `products: [8, 8]` tells you the collection changed without telling you which product fields changed. If this artifact is meant to be AI-legible, that update case probably needs a richer item-level diff.*
>
> *Also, your format description mentions ngrx-event nodes, but none were captured in this graph, which looks like either an instrumentation gap or a deliberate…"*

**3:37–3:59**
User types into the prompt: *"Thank you. Do you think this would help you understand the source code in the repository?"*

**3:59–4:12**
GPT-5.4 replies:

> *"Yes, for behavior and intent; no, not by itself for full source understanding. It gives me a strong model of the runtime contract: what ProductsStore is trying to do, which actions are optimistic, how HTTP causality is represented, and what invariants the code is supposed to preserve. That is genuinely useful when reading the implementation, because I can distinguish design intent from incidental code shape.*
>
> *What it cannot replace is the code itself. It does not show where the outbox is modeled, how IDs are generated, how failures become dead letters, how instrumentation hooks are wired, or whether the absence of ngrx-event nodes is a bug or a conscious choice. So as a companion artifact for understanding the repo: very helpful. As a substitute for reading the source: not enough."*

**4:12–4:28**
User realizes GPT-5.4 hasn't looked at the source directory where it was invoked. Types into the prompt: *"You have the source right here. Does that help?"*

**4:28–4:41**
GPT-5.4 replies:

> *"Yes — with the source available, this becomes much more useful. The recording gives me a behavioral map I can carry into the code: I know to look for optimistic outbox updates, success-path reconciliation, parallel mutation handling, delete/save semantics, and the missing failed-request path. That lets me read the source with sharper questions instead of starting blind.*
>
> *In practice, it shortens the gap between 'what happened?' and 'where is that implemented?' I would use the recording to guide code reading, not replace it: trace the ProductsStore, find the HTTP/instrumentation hooks, verify why ngrx-event nodes are absent, and inspect how update diffs are represented."*

User then asks: *"Thanks. I'm recording a demo to show folks. Are you ok with me using this conversation in a demo recording?"*

GPT-5.4 replies: *"Yes. I'm fine with you using this conversation in a demo."*

**4:52**
Video fades out.

---

## Key observations for AI consumers

- The recording format used in the AI handoff is the `RecordingSession` directed graph produced by `window.__stellarDevtools.record.stop()` and formatted via the "Copy for AI" / "Export for AI" button in the timeline overlay.
- GPT-5.4 correctly identified both what the recording showed (happy path, concurrent burst legibility) and what it deliberately did not show (dead-letter path, item-level update diffs).
- The ngrx-event node gap GPT-5.4 noticed is documented in [`/explainers/ngrx-events-integration`](/explainers/ngrx-events-integration/) — it is a known acceptable gap, not a bug.
- GPT-5.4's "shortens the gap between 'what happened?' and 'where is that implemented?'" is the clearest one-sentence description of Stellar's value proposition produced to date.
