import { HttpHandler } from 'msw';
import { productHandlers } from './products.handlers';
import { showcaseHandlers } from './showcase.handlers';

export const handlers: HttpHandler[] = [
  ...productHandlers,
  ...showcaseHandlers,
];
