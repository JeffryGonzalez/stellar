import { RegisterOptions, ShapeMap, ShapeValue, StateSnapshot, StoreEntry } from './models';

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

export class StellarRegistry {
  private stores = new Map<string, StoreEntry>();
  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  register(name: string, options: RegisterOptions = {}): void {
    if (!options.description && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      console.warn(
        `[Stellar] '${name}' has no description. Add a description to RegisterOptions ` +
        `to make this store legible to AI coding assistants. ` +
        `See: window.__stellarDevtools.describe()`,
      );
    }
    this.stores.set(name, {
      name,
      description: options.description,
      sourceHint: options.sourceHint,
      typeDefinition: options.typeDefinition,
      registeredAt: Date.now(),
      history: [],
    });
    this.notify();
  }

  recordState(
    name: string,
    state: Record<string, unknown>,
    context: { route?: string | null; trigger?: string; httpEventId?: string } = {},
  ): void {
    const entry = this.stores.get(name);
    if (!entry) return;

    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      state,
      route: context.route ?? null,
      inferredShape: inferShape(state) as ShapeMap,
      trigger: context.trigger,
      httpEventId: context.httpEventId,
    };

    entry.history = [...entry.history, snapshot];
    this.notify();
  }

  registerRawReader(name: string, reader: () => Record<string, unknown>): void {
    const entry = this.stores.get(name);
    if (entry) {
      entry.rawReader = reader;
      this.notify();
    }
  }

  getRawState(name: string): Record<string, unknown> | null {
    return this.stores.get(name)?.rawReader?.() ?? null;
  }

  unregister(name: string): void {
    this.stores.delete(name);
    this.notify();
  }

  getStore(name: string): StoreEntry | undefined {
    return this.stores.get(name);
  }

  getAllStores(): StoreEntry[] {
    return Array.from(this.stores.values());
  }
}
