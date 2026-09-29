const { defineConfig } = require('@playwright/test');

const bundler = process.env.REPRO_BUNDLER || 'turbopack';
if (!['turbopack', 'webpack'].includes(bundler)) {
  throw new Error('REPRO_BUNDLER must be turbopack or webpack.');
}
const externalURL = process.env.REPRO_EXTERNAL_URL;
const port = Number(process.env.REPRO_TEST_PORT || 4199);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('REPRO_TEST_PORT must be an integer from 1024 to 65535.');
}
if (externalURL && process.env.REPRO_REBASE_REFRESH_URL === '1') {
  throw new Error('Patched verification must start its own server; external server mode is unknown.');
}
if (bundler === 'turbopack' && process.env.REPRO_REBASE_REFRESH_URL === '1') {
  throw new Error('The optional diagnostic loader supports webpack only.');
}

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL: externalURL || `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: externalURL ? undefined : {
    command: `next dev${bundler === 'webpack' ? ' --webpack' : ''} --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/home`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
