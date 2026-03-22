import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../dist/.playwright/apps/demo-ng/test-output',
  reporter: [['html', { outputFolder: '../../dist/.playwright/apps/demo-ng/playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx nx serve demo-ng',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
