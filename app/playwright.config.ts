import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests/browser',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL,
    browserName: 'chromium',
    channel: 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'edge-desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'edge-mobile-width', use: { viewport: { width: 390, height: 900 } } },
  ],
  webServer: {
    cwd: import.meta.dirname,
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
