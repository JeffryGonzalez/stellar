import { inject, provideEnvironmentInitializer } from '@angular/core';
import { HttpMonitorService } from './http-monitor.service';
import { StellarFeature, StellarFeatureKind } from './stellar-feature';

export function withHttpTrafficMonitoring(): StellarFeature<StellarFeatureKind.HttpTrafficMonitoring> {
  return {
    kind: StellarFeatureKind.HttpTrafficMonitoring,
    providers: [
      HttpMonitorService,
      provideEnvironmentInitializer(() => inject(HttpMonitorService)),
    ],
  };
}
