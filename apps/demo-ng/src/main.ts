import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

async function enableMocking() {
  if (environment.addMsw) {
    const { worker } = await import('./app/__mocks__/browser');
    console.info('MSW active — API calls to /api/* are intercepted.');
    return worker.start({
      quiet: true,
      onUnhandledRequest: 'bypass',
    });
  }
  return;
}

enableMocking()
  .then(() => bootstrapApplication(App, appConfig))
  .catch(err => console.error(err));
