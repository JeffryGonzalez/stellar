import {
  RegisterOptions,
  ShapeMap,
  ShapeValue,
  StateSnapshot,
  StoreEntry,
  StoreInstance,
  StoreMetadata,
} from './models';

// Angular substitutes `ngDevMode` at build time: a literal `false` in production
// (enabling dead-code elimination of dev-only branches) and a truthy global in
// dev. When neither has happened yet — e.g. early in app bootstrap or in test
// environments — `typeof` returns 'undefined' and we fail open to dev mode.
declare const ngDevMode: boolean | undefined;

function inferShape(value: unknown): ShapeValue {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, inferShape(v)]),
    ) as ShapeMap;
  }
  return typeof value as 'string' | 'number' | 'boolean';
}

function metadataFromOptions(name: string, options: RegisterOptions): StoreMetadata {
  return {
    name,
    description: options.description,
    sourceHint: options.sourceHint,
    typeDefinition: options.typeDefinition,
  };
}

function metadataConflicts(a: StoreMetadata, b: StoreMetadata): string[] {
  const conflicts: string[] = [];
  if (a.description !== b.description) conflicts.push('description');
  if (a.sourceHint !== b.sourceHint) conflicts.push('sourceHint');
  if (a.typeDefinition !== b.typeDefinition) conflicts.push('typeDefinition');
  return conflicts;
}

export class StellarRegistry {
  private metadata = new Map<string, StoreMetadata>();
  private instances = new Map<string, StoreInstance>();
  private instancesByName = new Map<string, string[]>();
  private counter = 0;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  /**
   * Register a new instance of a store. Returns the instance id so the caller
   * can pass it back to `unregister`, `recordState`, etc. — name-keyed
   * unregister would be ambiguous when concurrent same-name instances exist.
   */
  register(name: string, options: RegisterOptions = {}): string {
    if (!options.description && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      console.warn(
        `[Stellar] '${name}' has no description. Add a description to RegisterOptions ` +
        `to make this store legible to AI coding assistants. ` +
        `See: window.__stellarDevtools.describe()`,
      );
    }

    const incoming = metadataFromOptions(name, options);
    const existing = this.metadata.get(name);
    if (!existing) {
      this.metadata.set(name, incoming);
    } else if (typeof ngDevMode === 'undefined' || ngDevMode) {
      const conflicts = metadataConflicts(existing, incoming);
      if (conflicts.length > 0) {
        console.warn(
          `[Stellar] '${name}' re-registered with different ${conflicts.join(', ')}. ` +
          `The first registration's metadata is kept — the *purpose* of a store is ` +
          `identity-level, not per-instance. If two registrations need different ` +
          `descriptions, they're probably different stores.`,
        );
      }
    }

    const id = `i${++this.counter}`;
    const instance: StoreInstance = {
      id,
      name,
      registeredAt: Date.now(),
      history: [],
    };
    this.instances.set(id, instance);

    const ids = this.instancesByName.get(name) ?? [];
    ids.push(id);
    this.instancesByName.set(name, ids);

    this.notify();
    return id;
  }

  unregister(id: string): void {
    const instance = this.instances.get(id);
    if (!instance || instance.destroyedAt !== undefined) return;
    instance.destroyedAt = Date.now();
    // Drop the rawReader — the underlying signal store is gone, calling it
    // would either throw or return stale data.
    instance.rawReader = undefined;
    this.notify();
  }

  recordState(
    id: string,
    state: Record<string, unknown>,
    context: { route?: string | null; trigger?: string; httpEventId?: string } = {},
  ): void {
    const instance = this.instances.get(id);
    if (!instance || instance.destroyedAt !== undefined) return;

    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      state,
      route: context.route ?? null,
      inferredShape: inferShape(state) as ShapeMap,
      trigger: context.trigger,
      httpEventId: context.httpEventId,
    };

    instance.history = [...instance.history, snapshot];
    this.notify();
  }

  registerRawReader(id: string, reader: () => Record<string, unknown>): void {
    const instance = this.instances.get(id);
    if (!instance || instance.destroyedAt !== undefined) return;
    instance.rawReader = reader;
    this.notify();
  }

  /**
   * Reads live raw state from the most recent active instance for a name.
   * Used by the overlay's peek affordance — name-keyed because that's how
   * the user picks a store in the UI.
   */
  getRawState(name: string): Record<string, unknown> | null {
    const instance = this.latestActiveInstance(name);
    return instance?.rawReader?.() ?? null;
  }

  // ── Projections (name-keyed, what consumers see) ─────────────────────────

  /**
   * Returns the projection for a store name: the most recent instance's
   * data surfaced at the top level (back-compat) plus all instances under
   * `instances[]`. Falls back to the most recent destroyed instance if no
   * active one exists, so AI consumers asking about a known name get a
   * useful answer instead of `undefined`.
   */
  getStore(name: string): StoreEntry | undefined {
    const meta = this.metadata.get(name);
    const ids = this.instancesByName.get(name);
    if (!meta || !ids || ids.length === 0) return undefined;

    const instances = ids.map(id => this.instances.get(id)!);
    const latestActive = instances.slice().reverse().find(i => i.destroyedAt === undefined);
    const latest = latestActive ?? instances[instances.length - 1];

    return {
      name: meta.name,
      description: meta.description,
      sourceHint: meta.sourceHint,
      typeDefinition: meta.typeDefinition,
      registeredAt: latest.registeredAt,
      destroyedAt: latestActive ? undefined : latest.destroyedAt,
      history: latest.history,
      rawReader: latest.rawReader,
      instances,
    };
  }

  getAllStores(): StoreEntry[] {
    const entries: StoreEntry[] = [];
    for (const name of this.metadata.keys()) {
      const entry = this.getStore(name);
      if (entry) entries.push(entry);
    }
    return entries;
  }

  // ── Instance-level access (used by recording, multi-instance API) ────────

  getInstance(id: string): StoreInstance | undefined {
    return this.instances.get(id);
  }

  getInstancesByName(name: string): StoreInstance[] {
    const ids = this.instancesByName.get(name) ?? [];
    return ids.map(id => this.instances.get(id)!).filter(Boolean);
  }

  getAllMetadata(): StoreMetadata[] {
    return Array.from(this.metadata.values());
  }

  private latestActiveInstance(name: string): StoreInstance | undefined {
    const instances = this.getInstancesByName(name);
    return instances.slice().reverse().find(i => i.destroyedAt === undefined);
  }
}
