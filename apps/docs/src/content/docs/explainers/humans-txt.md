---
title: "humans.txt — A Section for the Human Contribution"
description: The concept and intent behind the humans.txt section of this site — what it is, why it exists alongside llms.txt, and what we deferred.
---

*This is a Technical Discussion Record (TDR) — a note capturing design thinking and tradeoffs, written for developers and future collaborators. It records not just what we decided but why, and what we consciously chose not to do.*

---

## The idea

This site has `llms.txt` — a structured artifact making the documentation legible to AI systems. It seemed only right to also have somewhere that makes the human contribution legible: not in the technical sense, but in the authorial one.

The name `humans.txt` is in deliberate dialogue with `robots.txt` and `llms.txt`. All three exist in this project. That completeness says something about what the project values without requiring a manifesto: human contribution is worth marking explicitly, in a world where it's increasingly easy to make it invisible.

## What it isn't

It's not a blog in the conventional sense — posts for SEO, update announcements, that kind of thing. It's closer to a working journal: reflections on the process, things that surprised us, positions that are still forming. Essays, occasionally. Short notes, probably more often.

## The attribution question

When content in humans.txt is the product of a session rather than solo writing — which will often be the case — attribution matters. The `> **[Jeff]:** / > **[Claude]:**` convention already used in design documents is the model: dialogue made visible, neither voice collapsed into the other.

The mechanism: Jeff writes something before ending a session. Claude responds within that session. The result is committed together. The asymmetry is honest — Jeff writes first, Claude responds — and that's fine. It reflects what's actually true about how this project works.

## What we deliberately deferred

The landing page for this section, the format of individual posts, whether entries are dated or not, whether Claude's responses are inline or in separate callout blocks. All of that waits until there's actual content to look at. Designing the container before knowing what goes in it produces containers that fit nothing.

The right prompt: when Jeff has something to say here, say it, then ask for a response. The format will emerge from a few real examples.

## Why this matters to the project

This project has a position on human-AI collaboration — not stated as a thesis but embedded in every structural decision. AI coding assistants as first-class users. Sanitization before any AI-facing surface. Documentation structured for both human and machine readers. `humans.txt` is the last piece of that: making it visible that there's a human here too, with a perspective worth reading, who isn't trying to disappear behind the tooling.

The goal isn't to argue for that position. It's to demonstrate it in the way the site is built.

---

*This TDR was written from the session of 2026-03-21, before the humans.txt section itself was implemented.*
