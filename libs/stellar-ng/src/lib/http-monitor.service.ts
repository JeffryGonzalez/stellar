import { DestroyRef, inject, Injectable } from '@angular/core';
import { StellarRegistryService } from './stellar-registry.service';

@Injectable()
export class HttpMonitorService {
  private registry = inject(StellarRegistryService);
  private destroyRef = inject(DestroyRef);
  private originalFetch = window.fetch.bind(window);

  constructor() {
    const registry = this.registry;
    const originalFetch = this.originalFetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const timestamp = Date.now();
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
      const url = input instanceof Request ? input.url
        : input instanceof URL ? input.href
        : String(input);

      // Capture causal context NOW — before any await — so other events
      // that fire during the async wait don't overwrite the registry buffer.
      const trigger = registry.captureContext();
      const id = `${timestamp}-${Math.random().toString(36).slice(2, 7)}`;

      try {
        const response = await originalFetch(input, init);
        const duration = Date.now() - timestamp;

        let responseBody: unknown;
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          try {
            responseBody = await response.clone().json();
          } catch { /* leave undefined */ }
        }

        registry.recordHttpEvent({
          id, timestamp, method, url,
          status: response.status,
          ok: response.ok,
          duration,
          responseBody,
          trigger,
        });

        return response;
      } catch (err) {
        registry.recordHttpEvent({
          id, timestamp, method, url,
          status: 0,
          ok: false,
          duration: Date.now() - timestamp,
          error: err instanceof Error ? err.message : String(err),
          trigger,
        });
        throw err;
      }
    };

    this.destroyRef.onDestroy(() => {
      window.fetch = this.originalFetch;
    });
  }
}
