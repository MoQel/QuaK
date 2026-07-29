import { defineConfig } from 'vitest/config';

// The other packages/ have no test runner — their tests live in the frontend
// suite because they need React and jsdom. This one is pure logic and is where
// the D8 fixture suite will live, which has to be runnable on its own (CI runs
// the same fixtures against the Java implementation).
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
