# /capture — Write a TDR from this session

Look back through this conversation and write a Technical Discussion Record (TDR)
capturing the important design thinking. Save it as a new markdown file in
`apps/docs/src/content/docs/explainers/`.

---

## What a good TDR captures

A TDR is not meeting notes. It is not a summary of what was built.
It is a record of *how we thought* — preserved so that a future developer
(or a future instance of Claude) can understand not just what exists,
but why it exists in that form and what was deliberately ruled out.

The most valuable things to extract:

1. **The problem we were actually solving** — often different from what was
   stated at the start of the session
2. **What we considered but rejected** — and *why*. This is the part most
   likely to get lost and most likely to prevent us from re-litigating the
   same ground later.
3. **The constraint that made the decision obvious** — usually there's one
   key insight that unlocked the direction. Name it explicitly.
4. **What we're consciously deferring** — and the condition under which we'd
   revisit it.

Do not include:
- Implementation details that are visible in the code
- A changelog or list of files changed
- Anything that is self-evident from reading the result

## Format

```
---
title: [Short descriptive title]
description: [One sentence: what decision or design question this records.]
---

*This is a Technical Discussion Record (TDR) — ...*

## What we were trying to solve
[The real problem, including any reframing that happened during the session]

## [Sections as needed — name them for the content, not for a template]

## What we deliberately deferred
[Things we chose not to do now, and why, and what would change that]

---
*This TDR was written from the session of [date].*
```

## Filename convention

Use kebab-case, descriptive, no date prefix (the frontmatter records the session date):
`apps/docs/src/content/docs/explainers/your-topic-here.md`

## After writing

Tell Jeff what file was created and give him a one-paragraph summary of what
the TDR captures, so he can decide if anything important was missed before
committing.
