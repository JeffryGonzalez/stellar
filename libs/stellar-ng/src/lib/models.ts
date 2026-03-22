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
  sourceHint?: string;
  typeDefinition?: string;
}

export interface StateSnapshot {
  timestamp: number;
  state: Record<string, unknown>;
  route: string | null;
  inferredShape: ShapeMap;
  trigger?: string;
}

export interface StoreEntry {
  name: string;
  sourceHint?: string;
  typeDefinition?: string;
  history: StateSnapshot[];
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
