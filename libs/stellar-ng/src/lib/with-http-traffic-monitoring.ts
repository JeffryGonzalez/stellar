import { inject, InjectionToken, provideEnvironmentInitializer } from '@angular/core';
import { HttpMonitorService } from './http-monitor.service';
import { StellarFeature, StellarFeatureKind } from './stellar-feature';

export interface HttpTrafficMonitoringOptions {
  /**
   * URL patterns to exclude from capture. Strings are matched as substrings;
   * RegExp patterns are tested against the full URL.
   *
   * Example:
   *   exclude: ['/favicon.ico', /\/assets\//]
   *
   * For a pre-built list of common noise patterns, see StellarHttpDefaults.CommonIgnores
   * (not yet implemented — coming in a future release).
   */
  exclude?: Array<string | RegExp>;
}

export const HTTP_MONITORING_OPTIONS =
  new InjectionToken<HttpTrafficMonitoringOptions>('HTTP_MONITORING_OPTIONS');

export function withHttpTrafficMonitoring(
  options: HttpTrafficMonitoringOptions = {},
): StellarFeature<StellarFeatureKind.HttpTrafficMonitoring> {
  return {
    kind: StellarFeatureKind.HttpTrafficMonitoring,
    providers: [
      { provide: HTTP_MONITORING_OPTIONS, useValue: options },
      HttpMonitorService,
      provideEnvironmentInitializer(() => inject(HttpMonitorService)),
    ],
  };
}
