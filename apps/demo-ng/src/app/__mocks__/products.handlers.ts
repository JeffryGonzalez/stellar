import { http, HttpResponse, delay } from 'msw';

export interface ProductResponse {
  id: string;
  name: string;
  price: number;
}

// Seed data — stable across reloads for a predictable demo
const seed: ProductResponse[] = [
  { id: '1', name: 'Keyboard', price: 129 },
  { id: '2', name: 'Monitor', price: 499 },
  { id: '3', name: 'Mouse', price: 59 },
];

// In-memory store — resets on service worker restart (page reload)
let products = [...seed];

// Delay long enough to make in-flight overlap visible on the timeline
const API_DELAY = 800;

export const productHandlers = [
  http.get('/api/products', async () => {
    await delay(API_DELAY);
    return HttpResponse.json([...products]);
  }),

  http.post('/api/products', async ({ request }) => {
    await delay(API_DELAY);
    const body = await request.json() as { name: string; price: number };
    const product: ProductResponse = {
      id: crypto.randomUUID(),
      name: body.name,
      price: body.price,
    };
    products = [...products, product];
    return HttpResponse.json(product, { status: 201 });
  }),

  http.put('/api/products/:id', async ({ params, request }) => {
    await delay(API_DELAY);
    const body = await request.json() as { name: string; price: number };
    products = products.map(p =>
      p.id === params['id'] ? { ...p, ...body } : p,
    );
    const updated = products.find(p => p.id === params['id']);
    return updated
      ? HttpResponse.json(updated)
      : HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  http.delete('/api/products/:id', async ({ params }) => {
    await delay(API_DELAY);
    const exists = products.some(p => p.id === params['id']);
    if (!exists) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    products = products.filter(p => p.id !== params['id']);
    return new HttpResponse(null, { status: 204 });
  }),
];
