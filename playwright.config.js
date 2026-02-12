import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 30000,
    retries: 1,
    use: {
        browserName: 'chromium',
        headless: true,
        baseURL: 'http://localhost:5500',
        screenshot: 'only-on-failure'
    },
    webServer: {
        command: 'npx serve . -l 5500 --no-clipboard',
        port: 5500,
        reuseExistingServer: true
    }
});
