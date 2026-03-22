# Stellar Devtools

An in-browser developer tool for Angular applications — closer to the Tanstack Query devtools than the Redux DevTools browser extension. The overlay runs inside the application, not as a browser extension.

## Workspace Structure

```
libs/
  sanitize/       @hypertheory/sanitize          — framework-agnostic sanitization library
  stellar-ng/     @hypertheory/stellar-ng-devtools — Angular devtools library

apps/
  demo-ng/        Angular demo application
  docs/           Astro Starlight documentation site
```

## NX Cheat Sheet

### Common commands

```bash
# List all projects
nx show projects

# Dev server — Angular demo
nx serve demo-ng

# Dev server — docs site
nx dev docs

# Build a specific project
nx build @hypertheory/sanitize
nx build @hypertheory/stellar-ng-devtools
nx build demo-ng
nx build docs

# Run unit tests (Jasmine/Jest)
nx test @hypertheory/sanitize
nx test @hypertheory/stellar-ng-devtools
nx test demo-ng

# Run Playwright e2e tests (requires demo-ng dev server already running)
nx e2e demo-ng
```

### The useful stuff

```bash
# Only build/test projects affected by your changes since the last commit
nx affected --target=build
nx affected --target=test

# Run the same target across every project
nx run-many --target=build
nx run-many --target=test

# See the dependency graph in your browser
nx graph
```

### Playwright e2e

The Playwright config lives at `apps/demo-ng/playwright.config.ts`.
Tests are in `apps/demo-ng/e2e/`.

```bash
# Full run via Nx (starts dev server automatically if not already running)
nx e2e demo-ng

# Run directly via Playwright — faster if the dev server is already up
npx playwright test --config=apps/demo-ng/playwright.config.ts

# Run a single spec file
npx playwright test --config=apps/demo-ng/playwright.config.ts e2e/sanitization.spec.ts

# Run tests matching a name pattern
npx playwright test --config=apps/demo-ng/playwright.config.ts --grep "trigger"

# Interactive UI mode — run tests visually, step through, inspect snapshots
npx playwright test --config=apps/demo-ng/playwright.config.ts --ui

# Debug a specific test (pauses at each step, opens browser)
npx playwright test --config=apps/demo-ng/playwright.config.ts --debug e2e/trigger.spec.ts

# Show the HTML report from the last run
npx playwright show-report dist/.playwright/apps/demo-ng/playwright-report
```

The four spec files and what they cover:

| File | What it tests |
|---|---|
| `stellar-api.spec.ts` | `window.__stellarDevtools` API contract — shape, snapshot/history/diff |
| `sanitization.spec.ts` | Every sanitization operator; raw secrets must never appear in output |
| `trigger.spec.ts` | NgRx event type in trigger field, combined event+click format |
| `ai-format.spec.ts` | AI readability — inferredShape, timestamps, no secrets in AI output |

### How caching works

NX caches task outputs locally (in `.nx/cache`). If you run `nx build @hypertheory/sanitize`
twice without changing any source files, the second run is instant — it replays from cache.
The build pipeline also respects dependencies: building `demo-ng` will automatically build
`@hypertheory/stellar-ng-devtools` first if it hasn't been built yet.

To force a fresh run, bypassing cache:

```bash
nx build @hypertheory/sanitize --skip-nx-cache
```

### Angular CLI still works

NX wraps the Angular CLI — all your existing `ng` commands work unchanged:

```bash
ng serve demo-ng
ng build @hypertheory/sanitize
ng test demo-ng
ng generate component my-component --project=demo-ng
```

## Docs site

```bash
nx dev docs      # dev server at http://localhost:4321
nx build docs    # production build → apps/docs/dist/
nx preview docs  # preview the production build
```
