import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withExperimentalAutoCleanupInjectors } from '@angular/router';
import { provideStellar, withNgrxSignalStoreTools, withHttpTrafficMonitoring } from '@hypertheory-labs/stellar-ng-devtools';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withExperimentalAutoCleanupInjectors disposes route injectors when their
    // routes are deactivated, which is what makes route-scoped store destroy
    // hooks fire. Required for the /lifecycle showcase to demonstrate
    // mount/unmount lifecycle truthfully — and a permanent regression test
    // against the inject-in-onDestroy class of bugs (NG0203).
    provideRouter(routes, withExperimentalAutoCleanupInjectors()),
    provideStellar(
      withNgrxSignalStoreTools(),
      withHttpTrafficMonitoring(),
    ),
  ],
};
