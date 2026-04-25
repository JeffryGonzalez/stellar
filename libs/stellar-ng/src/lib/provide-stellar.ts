import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { StellarRegistryService } from './stellar-registry.service';
import { SnapshotWriterService } from './snapshot-writer.service';
import { RecordingService } from './recording.service';
import { AnyStellarFeature } from './stellar-feature';
import { StoreInstance } from './models';

interface InstanceQuery {
  instance?: string;
}

export function provideStellar(...features: AnyStellarFeature[]): EnvironmentProviders {
  const featureProviders = features.flatMap(f => f.providers);

  return makeEnvironmentProviders([
    ...featureProviders,
    provideEnvironmentInitializer(() => {
      const registry = inject(StellarRegistryService);
      const writer = inject(SnapshotWriterService);
      const recorder = inject(RecordingService);

      const appStart = Date.now();

      // Resolve the instance to operate on for a name + optional query. Default
      // is "latest active, falling back to latest destroyed" so an AI consumer
      // asking about a known store name always gets a useful answer instead of
      // null. Explicit { instance: id } selects a specific instance.
      const resolveInstance = (name: string, q?: InstanceQuery): StoreInstance | undefined => {
        if (q?.instance) {
          const inst = registry.getInstance(q.instance);
          return inst && inst.name === name ? inst : undefined;
        }
        const all = registry.getInstancesByName(name);
        if (all.length === 0) return undefined;
        const active = all.slice().reverse().find(i => i.destroyedAt === undefined);
        return active ?? all[all.length - 1];
      };

      (window as any).__stellarDevtools = {
        describe: () => ({
          version: '1.1',
          stores: registry.getAllStores().map(s => {
            const totalSnapshots = s.instances.reduce((sum, i) => sum + i.history.length, 0);
            return {
              name: s.name,
              description: s.description ?? null,
              snapshotCount: totalSnapshots,
              registeredAt: s.registeredAt - appStart,
              destroyedAt: s.destroyedAt !== undefined ? s.destroyedAt - appStart : null,
              sourceHint: s.sourceHint ?? null,
              instances: s.instances.map(i => ({
                id: i.id,
                registeredAt: i.registeredAt - appStart,
                destroyedAt: i.destroyedAt !== undefined ? i.destroyedAt - appStart : null,
                snapshotCount: i.history.length,
              })),
            };
          }),
          api: ['snapshot', 'history', 'diff', 'http', 'record', 'describe'],
          recordingActive: recorder.isRecording(),
          caveat:
            'Lazy-loaded routes may register additional stores. Navigate to all relevant ' +
            'routes before calling describe() for full coverage. A store name may have ' +
            'multiple instances over a session — each route mount or component-providers ' +
            'scope creates a new one. snapshot()/history()/diff() default to the most ' +
            'recent instance; pass { instance: id } to select a specific one.',
        }),
        snapshot: (name?: string, query?: InstanceQuery) => {
          if (!name) return registry.getAllStores();
          if (query?.instance) return resolveInstance(name, query) ?? null;
          return registry.getStore(name) ?? null;
        },
        history: (name: string, n = 10, query?: InstanceQuery) => {
          const inst = resolveInstance(name, query);
          return inst ? inst.history.slice(-n) : null;
        },
        diff: (name: string, query?: InstanceQuery) => {
          // Cross-instance diffs are nonsense — state isn't continuous across
          // re-mounts. diff() always operates within a single instance.
          const inst = resolveInstance(name, query);
          if (!inst || inst.history.length < 2) return null;
          const h = inst.history;
          return { from: h[h.length - 2], to: h[h.length - 1] };
        },
        save: () => writer.save(registry.getAllStores()),
        http: () => registry.getHttpEvents(),
        record: {
          start: (name?: string) => recorder.start(name),
          stop: () => recorder.stop(),
          stopAndDownload: () => {
            const session = recorder.stop();
            if (session) recorder.download(session);
            return session;
          },
        },
      };
    }),
  ]);
}
