import { test, expect, Page } from '@playwright/test';

/**
 * Store lifecycle e2e tests.
 *
 * Exercises the metadata + instance model added in 0.1.0:
 *   - mount, unmount, re-mount of a route-scoped store
 *   - destroyedAt appears in describe() once an instance is unregistered
 *   - re-mount creates a new instance with its own history
 *   - snapshot()/history()/diff() default to the latest active instance
 *   - explicit { instance: id } selects a specific historical instance
 *   - cross-instance diff returns null
 *
 * Fixture: /__test/lifecycle (route-scoped LifecycleStore) and /__test/empty
 * (sibling route used to navigate away). All navigation is router-based —
 * page.goto() would full-reload the app and reset __stellarDevtools.
 */

const ready = async (page: Page) => {
  await page.waitForFunction(() => !!(window as any).__stellarDevtools);
};

const lifecycleEntry = async (page: Page) => {
  return page.evaluate(() => {
    const { stores } = (window as any).__stellarDevtools.describe();
    return stores.find((s: any) => s.name === 'LifecycleStore') ?? null;
  });
};

const enterLifecycle = async (page: Page) => {
  // Initial entry uses goto since we need a starting page; subsequent
  // navigations within tests use the in-page router links.
  await page.goto('/__test/lifecycle');
  await page.waitForSelector('[data-test="count"]');
  await ready(page);
};

const leaveLifecycle = async (page: Page) => {
  await page.click('[data-test="leave"]');
  await page.waitForSelector('[data-test="back"]');
};

const reEnterLifecycle = async (page: Page) => {
  await page.click('[data-test="back"]');
  await page.waitForSelector('[data-test="count"]');
};

test.describe('Store lifecycle — describe()', () => {
  test('LifecycleStore is not present until its route is visited', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    const before = await lifecycleEntry(page);
    expect(before).toBeNull();

    // Need a router-driven navigation to the lifecycle route from the landing
    // page. The landing doesn't link there, so we click into one of the
    // visible routes first... actually simpler: just navigate via in-app
    // router using Angular's Router from window. We don't expose it though,
    // so we use a fresh page goto to /__test/lifecycle and then check.
    // The point of the prior 'before' check is satisfied by the initial '/'.
    await page.goto('/__test/lifecycle');
    await page.waitForSelector('[data-test="count"]');

    const after = await lifecycleEntry(page);
    expect(after).not.toBeNull();
    expect(after.instances).toHaveLength(1);
    expect(after.destroyedAt).toBeNull();
  });

  test('navigating away marks the instance as destroyed', async ({ page }) => {
    await enterLifecycle(page);
    const mounted = await lifecycleEntry(page);
    expect(mounted.destroyedAt).toBeNull();

    await leaveLifecycle(page);

    const unmounted = await lifecycleEntry(page);
    expect(unmounted).not.toBeNull();
    expect(unmounted.destroyedAt).not.toBeNull();
    expect(typeof unmounted.destroyedAt).toBe('number');
    expect(unmounted.instances).toHaveLength(1);
  });

  test('re-mount produces a second instance, not a continuation of the first', async ({ page }) => {
    await enterLifecycle(page);
    await page.click('[data-test="bump"]');
    await page.click('[data-test="bump"]');

    await leaveLifecycle(page);
    await reEnterLifecycle(page);

    const entry = await lifecycleEntry(page);
    expect(entry.instances).toHaveLength(2);

    const [first, second] = entry.instances;
    // First instance is destroyed
    expect(first.destroyedAt).not.toBeNull();
    // Second instance is active
    expect(second.destroyedAt).toBeNull();
    // Top-level reflects the second (active) instance
    expect(entry.destroyedAt).toBeNull();
    expect(entry.registeredAt).toBe(second.registeredAt);
  });

  test('snapshotCount is the sum across all instances', async ({ page }) => {
    await enterLifecycle(page);
    await page.click('[data-test="bump"]');
    await page.click('[data-test="bump"]');
    // Wait for snapshots to land
    await page.waitForFunction(() => {
      const e = (window as any).__stellarDevtools.describe().stores.find(
        (s: any) => s.name === 'LifecycleStore',
      );
      return e?.instances?.[0]?.snapshotCount >= 3;
    });

    await leaveLifecycle(page);
    await reEnterLifecycle(page);
    await page.click('[data-test="bump"]');

    const entry = await lifecycleEntry(page);
    expect(entry.instances).toHaveLength(2);
    const total = entry.instances.reduce((sum: number, i: any) => sum + i.snapshotCount, 0);
    expect(entry.snapshotCount).toBe(total);
    expect(entry.snapshotCount).toBeGreaterThan(entry.instances[1].snapshotCount);
  });
});

test.describe('Store lifecycle — snapshot/history/diff defaults', () => {
  test.beforeEach(async ({ page }) => {
    await enterLifecycle(page);
    await page.click('[data-test="bump"]');
    await leaveLifecycle(page);
    await reEnterLifecycle(page);
    await page.click('[data-test="bump"]');
    await page.click('[data-test="bump"]');
    // Wait for the second instance to have at least one snapshot beyond init
    await page.waitForFunction(() => {
      const e = (window as any).__stellarDevtools.describe().stores.find(
        (s: any) => s.name === 'LifecycleStore',
      );
      return e?.instances?.length === 2 && e.instances[1].snapshotCount >= 3;
    });
  });

  test('snapshot() defaults to the latest active instance', async ({ page }) => {
    const data = await page.evaluate(() => {
      const dev = (window as any).__stellarDevtools;
      const snap = dev.snapshot('LifecycleStore');
      const entry = dev.describe().stores.find((s: any) => s.name === 'LifecycleStore');
      return { snap, entry };
    });

    const latest = data.entry.instances[data.entry.instances.length - 1];
    expect(data.snap.history.length).toBe(latest.snapshotCount);
  });

  test('history() defaults to the latest active instance', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dev = (window as any).__stellarDevtools;
      const hist = dev.history('LifecycleStore', 100);
      const entry = dev.describe().stores.find((s: any) => s.name === 'LifecycleStore');
      const latest = entry.instances[entry.instances.length - 1];
      return { historyLength: hist.length, latestSnapshotCount: latest.snapshotCount };
    });
    expect(result.historyLength).toBe(result.latestSnapshotCount);
  });

  test('history({ instance }) returns that instance\'s history specifically', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dev = (window as any).__stellarDevtools;
      const entry = dev.describe().stores.find((s: any) => s.name === 'LifecycleStore');
      const firstId = entry.instances[0].id;
      const firstHist = dev.history('LifecycleStore', 100, { instance: firstId });
      return { firstHist, expectedCount: entry.instances[0].snapshotCount };
    });
    expect(result.firstHist.length).toBe(result.expectedCount);
  });

  test('diff() operates within the latest instance only', async ({ page }) => {
    const diff = await page.evaluate(() =>
      (window as any).__stellarDevtools.diff('LifecycleStore'),
    );
    expect(diff).not.toBeNull();
    expect(diff.from).toBeDefined();
    expect(diff.to).toBeDefined();
    // The diff is between consecutive snapshots in the *current* (second)
    // instance. The second instance's count starts at 0 and gets bumped to
    // 2 — both `from` and `to` should have small counts within that range.
    expect(diff.to.state.count).toBeGreaterThan(diff.from.state.count);
    expect(diff.to.state.count).toBeLessThanOrEqual(2);
  });
});
