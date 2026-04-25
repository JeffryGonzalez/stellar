import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StellarRegistry } from './stellar-registry';

describe('StellarRegistry — description warning', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns when a store is registered without a description', () => {
    const registry = new StellarRegistry();
    registry.register('UnnamedStore');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("'UnnamedStore' has no description");
  });

  it('warns when description is an empty string', () => {
    const registry = new StellarRegistry();
    registry.register('EmptyDescStore', { description: '' });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("'EmptyDescStore' has no description");
  });

  it('does not warn when a description is provided', () => {
    const registry = new StellarRegistry();
    registry.register('GoodStore', { description: 'Tracks the thing.' });

    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('StellarRegistry — registration returns instance id', () => {
  it('returns a unique id per registration', () => {
    const registry = new StellarRegistry();
    const id1 = registry.register('Foo', { description: 'a' });
    const id2 = registry.register('Bar', { description: 'b' });
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
  });

  it('produces a fresh id on re-registration of the same name', () => {
    const registry = new StellarRegistry();
    const id1 = registry.register('Foo', { description: 'a' });
    registry.unregister(id1);
    const id2 = registry.register('Foo', { description: 'a' });
    expect(id1).not.toBe(id2);
  });
});

describe('StellarRegistry — instance lifecycle', () => {
  it('marks an instance as destroyed without removing it', () => {
    const registry = new StellarRegistry();
    const id = registry.register('Foo', { description: 'a' });
    registry.recordState(id, { x: 1 });

    expect(registry.getInstancesByName('Foo')).toHaveLength(1);
    expect(registry.getInstance(id)?.destroyedAt).toBeUndefined();

    registry.unregister(id);

    expect(registry.getInstancesByName('Foo')).toHaveLength(1);
    expect(registry.getInstance(id)?.destroyedAt).toBeDefined();
    expect(registry.getInstance(id)?.history).toHaveLength(1);
  });

  it('preserves history after destruction', () => {
    const registry = new StellarRegistry();
    const id = registry.register('Foo', { description: 'a' });
    registry.recordState(id, { x: 1 });
    registry.recordState(id, { x: 2 });
    registry.unregister(id);

    expect(registry.getInstance(id)?.history.map(s => s.state)).toEqual([{ x: 1 }, { x: 2 }]);
  });

  it('rejects recordState on a destroyed instance', () => {
    const registry = new StellarRegistry();
    const id = registry.register('Foo', { description: 'a' });
    registry.unregister(id);
    registry.recordState(id, { x: 1 });
    expect(registry.getInstance(id)?.history).toHaveLength(0);
  });

  it('drops the rawReader on destruction', () => {
    const registry = new StellarRegistry();
    const id = registry.register('Foo', { description: 'a' });
    registry.registerRawReader(id, () => ({ live: true }));
    expect(registry.getRawState('Foo')).toEqual({ live: true });
    registry.unregister(id);
    expect(registry.getRawState('Foo')).toBeNull();
  });

  it('idempotent unregister', () => {
    const registry = new StellarRegistry();
    const id = registry.register('Foo', { description: 'a' });
    registry.unregister(id);
    const firstDestroyedAt = registry.getInstance(id)?.destroyedAt;
    registry.unregister(id);
    expect(registry.getInstance(id)?.destroyedAt).toBe(firstDestroyedAt);
  });
});

describe('StellarRegistry — multi-instance behavior', () => {
  it('accumulates instances across re-registrations of the same name', () => {
    const registry = new StellarRegistry();
    const id1 = registry.register('Foo', { description: 'a' });
    registry.unregister(id1);
    const id2 = registry.register('Foo', { description: 'a' });
    const id3 = registry.register('Bar', { description: 'b' });

    expect(registry.getInstancesByName('Foo').map(i => i.id)).toEqual([id1, id2]);
    expect(registry.getInstancesByName('Bar').map(i => i.id)).toEqual([id3]);
  });

  it('getStore projection reflects the latest active instance', () => {
    const registry = new StellarRegistry();
    const id1 = registry.register('Foo', { description: 'a' });
    registry.recordState(id1, { v: 'old' });
    registry.unregister(id1);
    const id2 = registry.register('Foo', { description: 'a' });
    registry.recordState(id2, { v: 'new' });

    const entry = registry.getStore('Foo');
    expect(entry?.history.map(s => s.state)).toEqual([{ v: 'new' }]);
    expect(entry?.destroyedAt).toBeUndefined();
    expect(entry?.instances).toHaveLength(2);
  });

  it('getStore falls back to latest destroyed when no active instance', () => {
    const registry = new StellarRegistry();
    const id = registry.register('Foo', { description: 'a' });
    registry.recordState(id, { v: 'final' });
    registry.unregister(id);

    const entry = registry.getStore('Foo');
    expect(entry?.history.map(s => s.state)).toEqual([{ v: 'final' }]);
    expect(entry?.destroyedAt).toBeDefined();
    expect(entry?.instances).toHaveLength(1);
  });

  it('returns undefined for unknown names', () => {
    const registry = new StellarRegistry();
    expect(registry.getStore('Nope')).toBeUndefined();
  });

  it('getRawState reads from the latest active instance', () => {
    const registry = new StellarRegistry();
    const id1 = registry.register('Foo', { description: 'a' });
    registry.registerRawReader(id1, () => ({ from: 'first' }));
    registry.unregister(id1);
    const id2 = registry.register('Foo', { description: 'a' });
    registry.registerRawReader(id2, () => ({ from: 'second' }));

    expect(registry.getRawState('Foo')).toEqual({ from: 'second' });
  });
});

describe('StellarRegistry — metadata mismatch warning', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns when a name is re-registered with a different description', () => {
    const registry = new StellarRegistry();
    registry.register('Foo', { description: 'first purpose' });
    registry.register('Foo', { description: 'second purpose' });

    const calls: string[] = warnSpy.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(calls.some((c: string) => c.includes('re-registered with different description'))).toBe(true);
  });

  it('keeps the first registration metadata across re-registrations', () => {
    const registry = new StellarRegistry();
    registry.register('Foo', { description: 'first', sourceHint: 'src/a.ts' });
    registry.register('Foo', { description: 'second', sourceHint: 'src/b.ts' });

    const entry = registry.getStore('Foo');
    expect(entry?.description).toBe('first');
    expect(entry?.sourceHint).toBe('src/a.ts');
  });

  it('does not warn when re-registration metadata matches', () => {
    const registry = new StellarRegistry();
    warnSpy.mockClear();
    registry.register('Foo', { description: 'consistent' });
    registry.register('Foo', { description: 'consistent' });
    const mismatchCalls: string[] = warnSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .filter((c: string) => c.includes('re-registered with different'));
    expect(mismatchCalls).toHaveLength(0);
  });
});

describe('StellarRegistry — getAllStores and getAllMetadata', () => {
  it('returns one entry per registered name', () => {
    const registry = new StellarRegistry();
    const id1 = registry.register('Foo', { description: 'a' });
    registry.unregister(id1);
    registry.register('Foo', { description: 'a' });
    registry.register('Bar', { description: 'b' });

    expect(registry.getAllStores().map(s => s.name).sort()).toEqual(['Bar', 'Foo']);
    expect(registry.getAllMetadata().map(m => m.name).sort()).toEqual(['Bar', 'Foo']);
  });

  it('preserves stores whose only instances have been destroyed', () => {
    const registry = new StellarRegistry();
    const id = registry.register('Ghost', { description: 'unmounted forever' });
    registry.unregister(id);
    expect(registry.getAllStores().map(s => s.name)).toContain('Ghost');
  });
});

describe('StellarRegistry — subscribe', () => {
  it('notifies on register, recordState, and unregister', () => {
    const registry = new StellarRegistry();
    const fn = vi.fn();
    registry.subscribe(fn);

    const id = registry.register('Foo', { description: 'a' });
    expect(fn).toHaveBeenCalledTimes(1);

    registry.recordState(id, { x: 1 });
    expect(fn).toHaveBeenCalledTimes(2);

    registry.unregister(id);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
