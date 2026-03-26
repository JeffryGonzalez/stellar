import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { SensitiveDataComponent } from './sensitive-data.component';
import { ProductsComponent } from './products.component';
import { showcaseRoutes } from './showcase/showcase.routes';

export const routes: Routes = [
  { path: '',          component: HomeComponent },
  { path: 'sanitize',  component: SensitiveDataComponent },
  { path: 'products',  component: ProductsComponent },
  { path: 'showcase',  children: showcaseRoutes },
];
