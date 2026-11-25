import { defineConfig } from 'vitest/config';

// Lets a run started at the repo root (an IDE, or a bare `vitest`) find each suite's own config.
// `npm run test:coverage` writes one lcov report for all suites, read by SonarQube Cloud.
export default defineConfig({
    test: {
        projects: ['frontend', 'packages/*/vitest.config.ts', 'vscode-extension'],
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'lcovonly'],
            reportsDirectory: 'coverage',
            include: ['frontend/src/**', 'packages/*/src/**', 'vscode-extension/src/**'],
            exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}', '**/test/**', 'packages/qasm-transform/src/generated/**'],
        },
    },
});
