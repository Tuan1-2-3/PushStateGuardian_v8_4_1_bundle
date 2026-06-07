const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: 'test/playwright',
  timeout: 60 * 1000,
  use: {
    headless: false,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10 * 1000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
