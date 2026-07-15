import { defineConfig } from 'vitest/config';

// Only the vscode-free units. src/test/ needs a real VSCode and is run by
// @vscode/test-cli instead; importing "vscode" here would fail outright.
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        exclude: ['src/test/**'],
        environment: 'node',
    },
});
