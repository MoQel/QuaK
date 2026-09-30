import { defineConfig } from 'vitest/config';

// Lets a run started at the repo root (an IDE, or a bare `vitest`) find each suite's own config.
export default defineConfig({
    test: {
        projects: ['frontend', 'packages/*/vitest.config.ts', 'vscode-extension'],
    },
});
