import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the /lifecycle showcase page.
 *
 * The page exists to teach the metadata + instance model — three counters at
 * different scopes (root, route, component-providers) with a live readout of
 * each store's lifecycle from window.__stellarDevtools.describe(). These
 * tests verify the page renders, the counters work, and the toggle for the
 * component-scoped counter reflects in the readout.
 *
 * The deeper API behaviour is covered by lifecycle.spec.ts; this file only
 * guards against the showcase page itself regressing.
 */

test.describe('/lifecycle showcase — smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lifecycle');
    await page.waitForSelector('[data-test="LifecycleRootCounter-count"]');
    await page.waitForFunction(() => !!(window as any).__stellarDevtools);
  });

  test('renders all three counters at zero', async ({ page }) => {
    await expect(page.locator('[data-test="LifecycleRootCounter-count"]')).toHaveText('0');
    await expect(page.locator('[data-test="LifecycleRouteCounter-count"]')).toHaveText('0');
    await expect(page.locator('[data-test="LifecycleScopedCounter-count"]')).toHaveText('0');
  });

  test('each counter increments independently', async ({ page }) => {
    await page.click('[data-test="LifecycleRootCounter-inc"]');
    await page.click('[data-test="LifecycleRouteCounter-inc"]');
    await page.click('[data-test="LifecycleRouteCounter-inc"]');
    await page.click('[data-test="LifecycleScopedCounter-inc"]');
    await page.click('[data-test="LifecycleScopedCounter-inc"]');
    await page.click('[data-test="LifecycleScopedCounter-inc"]');

    await expect(page.locator('[data-test="LifecycleRootCounter-count"]')).toHaveText('1');
    await expect(page.locator('[data-test="LifecycleRouteCounter-count"]')).toHaveText('2');
    await expect(page.locator('[data-test="LifecycleScopedCounter-count"]')).toHaveText('3');
  });

  test('unmounting Counter C marks its instance destroyed; remounting adds a new instance', async ({ page }) => {
    // Readout polls every 250ms; wait for the initial state to settle.
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-test="LifecycleScopedCounter-active"]');
      return el?.textContent === '1';
    });

    await page.click('[data-test="toggle-scoped"]');
    // Confirm the component actually unmounted (the count element is gone).
    await page.waitForSelector('[data-test="LifecycleScopedCounter-count"]', { state: 'detached' });

    // Counter C card is replaced by the unmounted placeholder; readout must
    // come from describe(), not from the on-page counter (which is gone).
    const stateAfterUnmount = await page.evaluate(() => {
      const e = (window as any).__stellarDevtools.describe().stores.find(
        (s: any) => s.name === 'LifecycleScopedCounter',
      );
      return {
        instances: e.instances.length,
        active: e.instances.filter((i: any) => i.destroyedAt === null).length,
        destroyed: e.instances.filter((i: any) => i.destroyedAt !== null).length,
      };
    });
    expect(stateAfterUnmount.instances).toBe(1);
    expect(stateAfterUnmount.active).toBe(0);
    expect(stateAfterUnmount.destroyed).toBe(1);

    await page.click('[data-test="toggle-scoped"]');
    await page.waitForSelector('[data-test="LifecycleScopedCounter-count"]');
    // Wait for the readout to reflect the second instance
    await expect(page.locator('[data-test="LifecycleScopedCounter-instances"]')).toHaveText('2');
    await expect(page.locator('[data-test="LifecycleScopedCounter-active"]')).toHaveText('1');
    await expect(page.locator('[data-test="LifecycleScopedCounter-destroyed"]')).toHaveText('1');
  });

  test('Counter A keeps its value after navigating away and back via router', async ({ page }) => {
    await page.click('[data-test="LifecycleRootCounter-inc"]');
    await page.click('[data-test="LifecycleRootCounter-inc"]');
    await page.click('[data-test="LifecycleRouteCounter-inc"]');

    await page.click('[data-test="leave"]');
    // Land on the home/landing page; click the Lifecycle card link to come
    // back without a full page reload (page.goto would reset everything).
    await page.waitForSelector('a[href="/lifecycle"]');
    await page.click('a[href="/lifecycle"]');
    await page.waitForSelector('[data-test="LifecycleRootCounter-count"]');

    // Root counter survived (single root instance)
    await expect(page.locator('[data-test="LifecycleRootCounter-count"]')).toHaveText('2');
    // Route counter reset (new instance)
    await expect(page.locator('[data-test="LifecycleRouteCounter-count"]')).toHaveText('0');

    // Route counter now has 2 instances in describe()
    const routeInstances = await page.evaluate(() => {
      const e = (window as any).__stellarDevtools.describe().stores.find(
        (s: any) => s.name === 'LifecycleRouteCounter',
      );
      return e.instances.length;
    });
    expect(routeInstances).toBe(2);
  });
});
