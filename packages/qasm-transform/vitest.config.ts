import { defineConfig } from 'vitest/config';

// Pure transform tests run in Node and do not depend on React or jsdom.
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
