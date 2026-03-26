import { HttpHandler } from 'msw';
import { productHandlers } from './products.handlers';

export const handlers: HttpHandler[] = [
  ...productHandlers,
];
