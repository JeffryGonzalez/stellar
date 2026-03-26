import { Routes } from '@angular/router';
import { ShowcaseHomeComponent } from './showcase-home.component';
import { OutboxScenarioComponent } from './scenarios/outbox-scenario.component';
import { RaceConditionScenarioComponent } from './scenarios/race-condition-scenario.component';
import { ErrorPathScenarioComponent } from './scenarios/error-path-scenario.component';

export const showcaseRoutes: Routes = [
  { path: '', component: ShowcaseHomeComponent },
  { path: 'outbox', component: OutboxScenarioComponent },
  { path: 'race-condition', component: RaceConditionScenarioComponent },
  { path: 'error-path', component: ErrorPathScenarioComponent },
];
