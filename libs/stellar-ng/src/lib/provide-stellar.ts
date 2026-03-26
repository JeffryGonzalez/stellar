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

export function provideStellar(...features: AnyStellarFeature[]): EnvironmentProviders {
  const featureProviders = features.flatMap(f => f.providers);

  return makeEnvironmentProviders([
    ...featureProviders,
    provideEnvironmentInitializer(() => {
      const registry = inject(StellarRegistryService);
      const writer = inject(SnapshotWriterService);
      const recorder = inject(RecordingService);

      const appStart = Date.now();

      (window as any).__stellarDevtools = {
        describe: () => ({
          version: '1.0',
          stores: registry.getAllStores().map(s => ({
            name: s.name,
            description: s.description ?? null,
            snapshotCount: s.history.length,
            registeredAt: s.registeredAt - appStart,
            sourceHint: s.sourceHint ?? null,
          })),
          api: ['snapshot', 'history', 'diff', 'http', 'record', 'describe'],
          recordingActive: recorder.isRecording(),
          caveat: 'Lazy-loaded routes may register additional stores. Navigate to all relevant routes before calling describe() for full coverage.',
        }),
        snapshot: (name?: string) =>
          name ? registry.getStore(name) : registry.getAllStores(),
        history: (name: string, n = 10) => {
          const store = registry.getStore(name);
          return store ? store.history.slice(-n) : null;
        },
        diff: (name: string) => {
          const store = registry.getStore(name);
          if (!store || store.history.length < 2) return null;
          const h = store.history;
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
