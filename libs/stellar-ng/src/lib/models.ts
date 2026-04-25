export type ShapeValue =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'array'
  | ShapeMap;

export type ShapeMap = { [key: string]: ShapeValue };

export interface RegisterOptions {
  /**
   * One sentence describing what this store manages and why it exists.
   *
   * This is the only piece of context about your store that cannot be derived
   * from code. State shape, history, and source location are all recoverable —
   * the *purpose* is not.
   *
   * AI coding assistants (and future developers) use this to orient quickly
   * when debugging or exploring your application. A good description collapses
   * minutes of investigation into seconds.
   *
   * @example
   * withStellarDevtools('TodosStore', {
   *   description: 'Manages the todo list — fetch, add, toggle. All mutations
   *     go through the todos API and are reflected optimistically.'
   * })
   *
   * If omitted, Stellar will warn in development mode and mark this store as
   * undocumented in the describe() output.
   */
  description?: string;
  sourceHint?: string;
  typeDefinition?: string;
}

export interface StateSnapshot {
  timestamp: number;
  state: Record<string, unknown>;
  route: string | null;
  inferredShape: ShapeMap;
  trigger?: string;
  httpEventId?: string;  // id of the HttpEvent whose response caused this snapshot
}

/**
 * Identity-level information about a store. Stored once per name. Stays stable
 * across re-mounts of the same store — the *purpose* of `BooksStore` shouldn't
 * change just because you navigated away and came back.
 */
export interface StoreMetadata {
  name: string;
  description?: string;
  sourceHint?: string;
  typeDefinition?: string;
}

/**
 * One lifecycle of a registered store. A name can produce many instances over
 * a session — each route mount, each component-providers scope, each manual
 * provideExisting cycle creates a new instance with its own history.
 */
export interface StoreInstance {
  id: string;
  name: string;
  registeredAt: number;
  destroyedAt?: number;
  history: StateSnapshot[];
  /** Overlay-only. Reads live raw state directly from the signal store. Cleared when the instance is destroyed. Never serialized, never exported. */
  rawReader?: () => Record<string, unknown>;
}

/**
 * Projection over a store's metadata + most recent instance. This is what
 * overlay/recording/window.__stellarDevtools consumers see — name-keyed,
 * with the latest instance's history surfaced at the top level for back-compat
 * and the full per-instance breakdown available via `instances[]`.
 */
export interface StoreEntry {
  name: string;
  description?: string;
  sourceHint?: string;
  typeDefinition?: string;
  registeredAt: number;       // most recent instance's registration time
  destroyedAt?: number;       // set iff no instance is currently active
  history: StateSnapshot[];   // most recent instance's history
  /** Overlay-only. Reads live raw state from the most recent active instance. Never serialized, never exported. */
  rawReader?: () => Record<string, unknown>;
  instances: StoreInstance[]; // full lifecycle for the name, oldest first
}

// ── Recording session ─────────────────────────────────────────────────────────

export type RecordingNodeType =
  | 'click'
  | 'ngrx-event'
  | 'http-request'
  | 'http-response'
  | 'state-snapshot';

export interface RecordingNode {
  id: string;
  type: RecordingNodeType;
  t: number;              // ms from recording start
  label?: string;         // click label or ngrx event type
  method?: string;        // http-request
  url?: string;           // http-request
  status?: number;        // http-response
  duration?: number;      // http-response
  error?: string;         // http-response (network failure)
  store?: string;         // state-snapshot
  instanceId?: string;    // state-snapshot — present when the store name has multiple instances in this recording
  snapshotIndex?: number; // state-snapshot — index within the instance's history, not the name's combined history
  delta?: Record<string, [unknown, unknown]>; // state-snapshot: { key: [before, after] }
}

export interface RecordingEdge {
  from: string;
  to: string;
  label: string;
}

export interface RecordingSession {
  name: string;
  recordedAt: string;   // ISO timestamp
  duration: number;     // ms
  /** Format explanation — tells an LLM how to interpret nodes and edges. */
  description: string;
  /** Purpose of each store that appears in this recording, keyed by store name. */
  storeContext: Record<string, string>;
  nodes: RecordingNode[];
  edges: RecordingEdge[];
}

export interface HttpEvent {
  id: string;
  timestamp: number;      // Date.now() at initiation
  method: string;
  url: string;
  status: number;         // 0 = network error
  ok: boolean;
  duration: number;       // ms from initiation to response
  responseBody?: unknown; // parsed JSON if content-type is application/json
  error?: string;         // set on network failure
  trigger?: string;       // captured from registry context at moment of call
}
