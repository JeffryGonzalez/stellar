---
title: Making the Docs Legible for LLMs
description: Implementation decisions behind the Stellar documentation site's AI legibility — llms.txt, description frontmatter, and what we deferred.
---

AI coding assistants are first-class users of this project. The same principle that applies to the runtime data surface applies to the documentation.

"Make the docs legible for LLMs" is actually two distinct problems. **Training data ingestion** (crawlability, static rendering, semantic markup) and **AI coding assistant usability right now** (can a developer today get correct guidance from an AI about this library?). We prioritized the second.

## What we implemented

**`llms.txt` and `llms-full.txt`** via the `starlight-llms-txt` plugin. `llms-full.txt` concatenates the entire docs site into a single artifact — dramatically more useful to an AI assistant working in a single context window than fragmented pages requiring multiple fetches.

**`description` frontmatter on every page** — a single clear sentence about what the page contains. Established as a convention from the first page, never retrofitted. The `llms-full.txt` index is built from these.

**Canonical, typed code examples** — minimal example first (shape), realistic example second (real use case), explicit anti-pattern where useful. LLMs pattern-match on examples more than prose.

**Consistent terminology throughout** — `SanitizationConfig`, `SanitizationRule`, `StateSnapshot` are defined once and never aliased. Inconsistent naming for the same concept produces inconsistent AI guidance.

## The dog-fooding note

This documentation is an instance of what the project advocates. The devtools make runtime state legible to AI; the documentation makes the library API legible to AI. Same principle, different layer. Decisions that look like overhead ("why `description` frontmatter on a placeholder page?") exist to keep the convention unbroken — a missing description is missing when it matters.

## What we deferred

**Documentation graph** — structured concept relationships and API call graphs. Useful for complex systems; not worth building until the reference section is substantive. `llms-full.txt` is sufficient for now.

**Timestamps on pages** — timestamps signal staleness and erode trust in still-accurate content. We version the libraries; we don't timestamp individual pages.

## What we're watching

The `llms.txt` convention is still emerging. If a more established standard displaces it, migration is straightforward — content doesn't change, only the generation mechanism.
