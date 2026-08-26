import { defineConfig } from 'vitest/config';

// Each suite keeps its own config, next to the code it tests. This only tells a run
// started at the repo root (the IDE's, or a bare `vitest`), where those suites are;
// without it such a run collects every test file and none of their aliases.
export default defineConfig({
    test: {
        projects: ['frontend', 'packages/qasm-transform', 'vscode-extension'],
    },
});
