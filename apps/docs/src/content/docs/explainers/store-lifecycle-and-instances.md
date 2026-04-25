---
title: Store Lifecycle and Instances
description: Why Stellar's registry treats store name as identity and store registration as a lifecycle event with instances, what changed in the public API, and what remains deliberately unanswered.
---

*This is a Technical Discussion Record (TDR) — not about a feature, but about a model change to the registry that was triggered by a bug report and turned out to be a load-bearing decision about how Stellar represents the world.*

---

## What we were trying to solve

A user puts an NgRx Signal Store in a component's `providers: [SomeStore]` array. The component mounts, the store is registered with Stellar, the overlay shows it. The component unmounts and Stellar throws:

```
NG0203: The `_StellarRegistryService` token injection failed.
`inject()` function must be called from an injection context...
    at onDestroy (hypertheory-labs-stellar-ng-devtools.mjs:1074:24)
```

The same thing happens when Angular's experimental [`withExperimentalAutoCleanupInjectors`](https://angular.dev/api/router/withExperimentalAutoCleanupInjectors) tears down route injectors. The cause is mechanical: `withStellarDevtools`'s `onDestroy` hook called `inject(StellarRegistryService)` to clean up, but by the time Angular runs that hook, the injector hierarchy that owned the token is already being disposed.

The fix for the crash itself is one line — capture the registry reference in `onInit`, close over it in `onDestroy`. But fixing only the crash would leave a more interesting question unanswered: **what should Stellar do when a store goes out of scope?**

---

## The lifecycle question

Today, Stellar's `unregister(name)` calls `Map.delete()`. The store vanishes from `snapshot()`, from `describe()`, from `history()`. If the store was on a route you navigated away from, it's as if it never existed.

For a devtool whose central design principle is *AI accessibility*, this is wrong in at least three ways:

1. **A recording stops making sense.** If a recording captures interactions with a store that gets unmounted before the recording ends, the timeline still shows snapshot nodes for that store — but the store's metadata (description, source hint) is gone from the registry that the recording's `storeContext` is built from. The AI consumer sees nodes about a store nobody can describe.

2. **`describe()` lies by omission.** `registeredAt` was added precisely so AI consumers could see lazy-loading honestly — "this store didn't exist when you started looking, it appeared at T+4200ms." Symmetrically, "this store existed and is now gone" is information of the same kind. Hiding it makes the registry's snapshot of reality less truthful, not cleaner.

3. **Re-mount is the common case.** Navigate to `/books`, navigate away, navigate back. The second `BooksStore` is a fresh instance with empty state. If the registry collapses both under one name, `history()` shows a discontinuous sequence (state went from `{books: [...12 items]}` to `{books: []}` for no observable reason). Diffs across that boundary are meaningless. The registry should make the boundary visible.

So the catalyst is a bug, but the work is a model change.

---

## Two failed framings

Before the model that landed, two other framings were considered.

**A. Just delete (status quo, with the inject fix).** Reject — fails (1), (2), (3) above. The `registeredAt` argument alone settles it: if "this appeared at T" matters, "this disappeared at T" matters by the same reasoning.

**B. Tombstone — keep the entry, set `destroyedAt`.** Better, but breaks at re-mount. A second `register('BooksStore', ...)` either has to overwrite (losing the first instance's history) or refuse (losing the second instance entirely). Either choice is a lie. B is on the path but isn't enough.

**C. Instances.** A store *name* is identity. A store *registration* is an instance with its own lifecycle and history. A name can have multiple instances over time, each with its own `registeredAt`, optional `destroyedAt`, and snapshot history. This is the model that landed.

---

## The model: metadata vs. instance

The natural temptation is `StoreEntry { name; instances: Instance[] }` — bundle everything under the name. But it doesn't survive a question we have to ask anyway: **whose `description` wins when the same name is registered twice?**

The `description` field is the *purpose* of the store. It's not "the purpose of this particular registration" — it's "the purpose of `BooksStore` as a concept in this codebase." If two registrations of `BooksStore` provide different descriptions, that's a code smell (the *purpose* of a store shouldn't depend on which route you mounted it from), and the registry should warn about it rather than pretend both are valid.

That observation makes the right split obvious. The data is two layers, not one:

```ts
interface StoreMetadata {
  name: string;          // identity
  description?: string;
  sourceHint?: string;
  typeDefinition?: string;
}

interface StoreInstance {
  id: string;            // unique per registration
  name: string;          // → links to metadata
  registeredAt: number;
  destroyedAt?: number;
  history: StateSnapshot[];
  rawReader?: () => Record<string, unknown>;
}
```

Metadata is set on first registration of a name and kept stable. Subsequent registrations check the metadata against what they would have set; mismatches log a dev-mode warning. Instances accumulate — each registration produces a new one, each unregistration sets `destroyedAt` on the right one.

This puts the right things in the right places:

- **Identity** lives at the metadata layer. AI consumers asking "what does `BooksStore` do?" get a single, stable answer regardless of how many times it has mounted.
- **Lifecycle and state** live at the instance layer. AI consumers asking "what happened to `BooksStore` during this recording?" get an honest sequence of instances with their own histories.
- **The contract evolves additively.** Existing fields on `StoreEntry` (`name`, `description`, `sourceHint`, `registeredAt`, `history`) can be projected from the metadata + latest instance. New fields (`destroyedAt`, `instances`) appear alongside without breaking name-keyed lookups.

---

## What changes in the public API

`window.__stellarDevtools` is treated as a public contract — even pre-1.0. Changes to its shape are documented here.

**`describe()`** — each store entry gains an `instances` array. Existing top-level fields (`name`, `description`, `snapshotCount`, `registeredAt`, `sourceHint`) are kept and reflect the most recent instance, so existing AI prompts continue to work. The `instances` array gives the full picture when more than one exists:

```js
{
  name: 'BooksStore',
  description: 'Manages the book catalog — fetch, filter, sort.',
  snapshotCount: 12,           // total across all instances
  registeredAt: 4200,          // most recent instance
  sourceHint: 'src/app/books/books.store.ts',
  instances: [
    { id: 'i1', registeredAt: 4200, destroyedAt: 8100, snapshotCount: 7 },
    { id: 'i2', registeredAt: 12000, snapshotCount: 5 }   // active
  ]
}
```

**`snapshot(name?)`** — defaults to the latest active instance for back-compat. Returns the latest destroyed instance if no active one exists (rather than `undefined`). New optional argument: `snapshot(name, { instance: id })` for explicit instance selection.

**`history(name, n?)`** — defaults to history of the latest instance (active or destroyed). New: `history(name, n, { instance: id })`.

**`diff(name)`** — operates within the latest instance only. Cross-instance diffs are nonsense by definition (state isn't continuous across re-mounts) and return `null`.

**Recording sessions** — `RecordingNode` of type `state-snapshot` gains an optional `instanceId` field, populated only when a name has multiple instances within the recording window. `storeContext` stays name-keyed (descriptions are name-level). The format description embedded in every recording is updated to explain the new field.

---

## What this deliberately does not solve

- **Concurrent instances of the same name.** If you provide `BooksStore` on two component routes that are alive simultaneously, the model accepts it (two active instances) but the public API defaults are name-keyed and will return "the latest." Disambiguating concurrent same-name instances in the overlay UI is parked. Real evidence first.
- **Cross-instance diffing.** The state isn't continuous across re-mount, so a diff would be misleading. `diff()` returns `null` across instance boundaries; we don't try to be clever.
- **Per-instance description override.** If two registrations of the same name provide different descriptions, the second is ignored and a dev-mode warning fires. The registry doesn't try to reconcile them.

These can be revisited if real usage produces evidence the defaults are wrong. None of them block the core change.

---

## Semver

`@hypertheory-labs/stellar-ng-devtools` is bumping from `0.0.1` to `0.1.0` with this change. Three considerations:

1. The shape change to `describe()` is additive — nothing existing breaks. By strict semver this could be a patch.
2. The behavioral change to `unregister` (instances persist as tombstones) is observable through `describe()` even by code that ignores the new fields. That's enough to argue minor, not patch.
3. We are pre-1.0 deliberately. The convention "0.x = no stability promises" is the right one here. The full `window.__stellarDevtools` surface is being exercised in real apps; until that exercise produces enough evidence to commit to a 1.0 contract, every minor bump is a chance to revisit.

The package README and reference docs will state the 0.x stance explicitly: shape and behavior may change between minor versions until 1.0. AI consumers should re-read `describe()` rather than cache assumptions about the surface.

---

## Open questions

- **Memory growth.** Instances accumulate. A long-lived single-page app that mounts and unmounts many short-lived stores will grow a registry indefinitely. There's no pressure on this yet, so we'll watch it. If real usage produces evidence, the natural follow-ups are a per-name cap on retained destroyed instances and/or a `dump()` method for the consumer to release them explicitly. Both are config decisions, not architectural ones — easy to add later.

## Resolved here

- **Recording inclusion.** Recordings include metadata for all names that have an instance in the recording window — including names whose only instances were destroyed before the recording started. This is additive information for AI consumers and doesn't change the recording's existing `storeContext` shape, so it's not a versioning event.

## Near-future backlog

- **Cross-instance trends.** The instance model makes "how many times has `WizardStore` been mounted in this session?" answerable, and a runtime view of that pattern is plausibly load-bearing for AI debugging — repeated re-mounts of the same store often signal a real bug (effect dependency thrash, route guard loop, parent component identity churn). Worth surfacing on the public API once the basic model is stable. Not blocking 0.1.0.
