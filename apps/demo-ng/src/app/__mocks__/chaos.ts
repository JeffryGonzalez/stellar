/**
 * Shared chaos mode state for MSW handlers.
 * Toggled via POST /api/__dev/chaos.
 * Resets to 'off' on service worker restart (page reload).
 */
export type ChaosMode = 'off' | 'race' | 'errors';

export let chaosMode: ChaosMode = 'off';
export function setChaosMode(mode: ChaosMode) {
  chaosMode = mode;
}

/**
 * In race mode, the first POST to /api/naive-products gets a long delay
 * so the second request's response arrives first. This counter tracks
 * in-flight requests to assign delays correctly.
 */
let raceRequestCount = 0;

export function nextRaceDelay(): number {
  raceRequestCount++;
  return raceRequestCount === 1 ? 2800 : 600;
}

export function resetRaceCounter() {
  raceRequestCount = 0;
}
