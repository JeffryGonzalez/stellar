import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HttpEvent, RegisterOptions, StoreEntry, StoreInstance, StoreMetadata } from './models';
import { StellarRegistry } from './stellar-registry';
import { Events } from '@ngrx/signals/events';

function summarizePayload(payload: unknown): string {
  if (payload === undefined || payload === null || payload === void 0) return '';
  if (typeof payload === 'string') {
    const trimmed = payload.length > 40 ? payload.slice(0, 40) + '…' : payload;
    return ` — "${trimmed}"`;
  }
  if (typeof payload === 'number' || typeof payload === 'boolean') return ` — ${payload}`;
  if (Array.isArray(payload)) return ` — [${payload.length} items]`;
  if (typeof payload === 'object') {
    const keys = Object.keys(payload as object);
    const preview = keys.slice(0, 3).join(', ');
    return ` — {${preview}${keys.length > 3 ? ', …' : ''}}`;
  }
  return '';
}

@Injectable({ providedIn: 'root' })
export class StellarRegistryService {
  private router = inject(Router, { optional: true });
  private ngrxEvents = inject(Events, { optional: true });
  private core = new StellarRegistry();

  private _stores = signal<StoreEntry[]>([]);
  readonly stores = this._stores.asReadonly();

  private _httpEvents = signal<HttpEvent[]>([]);
  readonly httpEvents = this._httpEvents.asReadonly();

  private lastClick: { label: string; time: number } | null = null;
  private lastEvent: { type: string; payload: unknown; time: number } | null = null;
  private lastHttpEventId: { id: string; time: number } | null = null;

  constructor() {
    this.core.subscribe(() => {
      this._stores.set(this.core.getAllStores());
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('stellar-overlay')) return;
      const label =
        target.getAttribute('data-stellar-label') ||
        target.getAttribute('aria-label') ||
        target.textContent?.trim().slice(0, 50) ||
        target.tagName.toLowerCase();
      this.lastClick = { label: label || 'unknown', time: performance.now() };
    }, { capture: true });

    this.ngrxEvents?.on()
      .pipe(takeUntilDestroyed())
      .subscribe(({ type, payload }) => {
        this.lastEvent = { type, payload, time: performance.now() };
      });
  }

  register(name: string, options: RegisterOptions = {}): string {
    return this.core.register(name, options);
  }

  unregister(id: string): void {
    this.core.unregister(id);
  }

  registerRawReader(id: string, reader: () => Record<string, unknown>): void {
    this.core.registerRawReader(id, reader);
  }

  getRawState(name: string): Record<string, unknown> | null {
    return this.core.getRawState(name);
  }

  recordState(id: string, state: Record<string, unknown>): void {
    this.core.recordState(id, state, {
      route: this.router?.url ?? null,
      trigger: this.recentTrigger(),
      httpEventId: this.recentHttpEventId(),
    });
  }

  captureContext(): string | undefined {
    return this.recentTrigger();
  }

  recordHttpEvent(event: HttpEvent): void {
    this._httpEvents.update(events => [...events.slice(-99), event]);
    if (event.ok) {
      this.lastHttpEventId = { id: event.id, time: performance.now() };
    }
  }

  getHttpEvents(): HttpEvent[] {
    return this._httpEvents();
  }

  private recentHttpEventId(): string | undefined {
    const now = performance.now();
    if (!this.lastHttpEventId || now - this.lastHttpEventId.time >= 300) return undefined;
    // If a click happened after the HTTP response, it's a new user action — don't
    // attribute the resulting state change to the previous response.
    if (this.lastClick && this.lastClick.time > this.lastHttpEventId.time) return undefined;
    return this.lastHttpEventId.id;
  }

  private recentTrigger(): string | undefined {
    const now = performance.now();
    const recentEvent = this.lastEvent && now - this.lastEvent.time < 100 ? this.lastEvent : null;
    const recentClick = this.lastClick && now - this.lastClick.time < 150 ? this.lastClick : null;

    if (recentEvent && recentClick) {
      return `${recentEvent.type}${summarizePayload(recentEvent.payload)} — click: "${recentClick.label}"`;
    }
    if (recentEvent) {
      return `${recentEvent.type}${summarizePayload(recentEvent.payload)}`;
    }
    if (recentClick) {
      return `click: "${recentClick.label}"`;
    }
    return undefined;
  }

  getStore(name: string): StoreEntry | undefined {
    return this.core.getStore(name);
  }

  getAllStores(): StoreEntry[] {
    return this.core.getAllStores();
  }

  getInstance(id: string): StoreInstance | undefined {
    return this.core.getInstance(id);
  }

  getInstancesByName(name: string): StoreInstance[] {
    return this.core.getInstancesByName(name);
  }

  getAllMetadata(): StoreMetadata[] {
    return this.core.getAllMetadata();
  }
}
