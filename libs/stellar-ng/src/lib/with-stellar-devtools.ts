import { inject, effect } from '@angular/core';
import { signalStoreFeature, withHooks, getState } from '@ngrx/signals';
import { StellarRegistryService } from './stellar-registry.service';
import { RegisterOptions } from './models';
import { SanitizationConfig, sanitized as applySanitized, autoRedactConfig } from '@hypertheory-labs/sanitize';

interface StellarDevtoolsOptions extends RegisterOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sanitize?: SanitizationConfig<any>;
}

export function withStellarDevtools(name: string, options: StellarDevtoolsOptions = {}) {
  return signalStoreFeature(
    withHooks((store) => {
      // Capture both the registry reference and the instance id at construction
      // time. The injection context is alive here; it is *not* alive in
      // onDestroy when Angular tears down the owning injector (router-scoped
      // stores under withExperimentalAutoCleanupInjectors, component providers,
      // etc.). Reaching for inject() in onDestroy throws NG0203.
      const registry = inject(StellarRegistryService);
      let instanceId: string | null = null;

      return {
        onInit() {
          instanceId = registry.register(name, options);
          registry.registerRawReader(instanceId, () => getState(store) as Record<string, unknown>);

          effect(() => {
            const raw = getState(store) as Record<string, unknown>;
            const merged = { ...autoRedactConfig(raw), ...options.sanitize };
            const state = Object.keys(merged).length > 0
              ? applySanitized(raw, merged as any)
              : raw;
            if (instanceId) registry.recordState(instanceId, state);
          });
        },
        onDestroy() {
          if (instanceId) registry.unregister(instanceId);
        },
      };
    }),
  );
}
