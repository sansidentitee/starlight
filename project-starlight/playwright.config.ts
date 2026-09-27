import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';

const edgeInstalled = process.platform === 'win32' && [process.env['PROGRAMFILES(X86)'], process.env.PROGRAMFILES, process.env.LOCALAPPDATA].filter(Boolean).some(root => existsSync(path.join(root!, 'Microsoft', 'Edge', 'Application', 'msedge.exe')));
const channel = process.env.PLAYWRIGHT_CHANNEL || (edgeInstalled ? 'msedge' : undefined);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/app.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    channel,
    baseURL: 'http://localhost:3000',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 90_000,
  },
});
