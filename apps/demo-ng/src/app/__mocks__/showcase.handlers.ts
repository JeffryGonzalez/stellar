import { http, HttpResponse, delay } from 'msw';
import { chaosMode, setChaosMode, nextRaceDelay, resetRaceCounter, ChaosMode } from './chaos';

// Separate in-memory store for the race condition scenario
const naiveSeed = [
  { id: '1', name: 'Keyboard', price: 129 },
  { id: '2', name: 'Monitor', price: 499 },
];
let naiveProducts = [...naiveSeed];

export const showcaseHandlers = [
  // ── Chaos control ────────────────────────────────────────────────────────
  http.post('/api/__dev/chaos', async ({ request }) => {
    const body = await request.json() as { mode: ChaosMode };
    setChaosMode(body.mode);
    if (body.mode !== 'race') resetRaceCounter();
    return HttpResponse.json({ mode: body.mode });
  }),

  http.post('/api/__dev/reset', async () => {
    naiveProducts = [...naiveSeed];
    resetRaceCounter();
    return HttpResponse.json({ ok: true });
  }),

  // ── Naive products — used by the race condition scenario ─────────────────
  // These handlers intentionally do NOT use the outbox pattern. The race
  // condition emerges from the Angular store capturing state at call time.

  http.get('/api/naive-products', async () => {
    await delay(400);
    return HttpResponse.json([...naiveProducts]);
  }),

  http.post('/api/naive-products', async ({ request }) => {
    // In race mode: first request gets a long delay, subsequent ones are fast.
    // This guarantees out-of-order responses for a reproducible demo.
    const ms = chaosMode === 'race' ? nextRaceDelay() : 1200;
    await delay(ms);
    const body = await request.json() as { name: string; price: number };
    const product = { id: crypto.randomUUID(), name: body.name, price: body.price };
    naiveProducts = [...naiveProducts, product];
    return HttpResponse.json(product, { status: 201 });
  }),

  http.delete('/api/naive-products/:id', async ({ params }) => {
    await delay(800);
    const exists = naiveProducts.some(p => p.id === params['id']);
    if (!exists) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    naiveProducts = naiveProducts.filter(p => p.id !== params['id']);
    return new HttpResponse(null, { status: 204 });
  }),
];
