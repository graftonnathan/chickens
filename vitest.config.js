import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Use jsdom for DOM/Canvas APIs
        environment: 'jsdom',

        // Test file patterns
        include: ['tests/**/*.test.js'],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['*.js'],
            exclude: ['vitest.config.js', 'eslint.config.js', 'tests/**'],
            thresholds: {
                statements: 50,
                branches: 40,
                functions: 50,
                lines: 50
            }
        },

        // Global test timeout
        testTimeout: 10000,

        // Setup files run before each test file
        setupFiles: ['tests/setup.js']
    }
});
