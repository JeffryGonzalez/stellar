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
