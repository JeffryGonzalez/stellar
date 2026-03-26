import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStellar, withNgrxSignalStoreTools, withHttpTrafficMonitoring } from '@hypertheory/stellar-ng-devtools';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideStellar(
      withNgrxSignalStoreTools(),
      withHttpTrafficMonitoring(),
    ),
  ],
};
