# Current Work

A short-lived document. Read this at the start of a session to orient quickly.
Updated at the end of every session via `/capture`.

---

## Just landed
- Snapshot format complete: `inferredShape`, `trigger`, `sourceHint`, `typeDefinition` all implemented and live
- `window.__stellarDevtools` API live: `snapshot()`, `history()`, `diff()`
- Three deployment contexts named and designed: Exploratory Dev, Testing, Runtime Diagnostics

## In progress
- "Copy for AI" clipboard button — per-store + all-stores in overlay header

## Next
1. Implement "Copy for AI" — format current snapshot(s) as AI-readable markdown, copy to clipboard (sanitization runs first, non-negotiable)
2. Plugin architecture — extract `withNgrxSignalStoreTools()` from the current monolithic `withStellarDevtools`
3. Filesystem snapshot write — `.stellar/snapshot.json` at project root (Claude Code reads directly)

## Parked / not this sprint
- MCP server (build filesystem write first, let that inform MCP shape)
- `createSanitizer()` factory (Tier 3) for custom domain aliases
- Production-mode gating of the overlay (wait for plugin architecture to settle)
- Causal event stream / `withPlaywrightObserver()` (longer road)
- **Bug: panel clips at high browser zoom** — `panelWidth` is pixel-based so browser zoom causes overflow. Good first GitHub issue candidate when issues are opened up.
- Tree view for deeply nested state (defer until we have a demo store with intentionally big state)
