import { defineConfig } from '@vscode/test-cli';

const shared = {
    files: 'dist/test/**/*.test.js',
    launchArgs: ['--disable-extensions'],
    mocha: {
        ui: 'tdd',
        timeout: 20000,
    },
};

// Both ends of the supported range: the engines floor and the current stable.
export default defineConfig([
    { label: 'stable', version: 'stable', ...shared },
    { label: 'minimum', version: '1.90.0', ...shared },
]);
