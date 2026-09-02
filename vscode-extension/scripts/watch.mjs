import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const nodeRequire = createRequire(import.meta.url);
const vitePackagePath = nodeRequire.resolve('vite/package.json');
const viteBin = join(dirname(vitePackagePath), nodeRequire('vite/package.json').bin.vite);

const processes = [
    spawn(process.execPath, ['esbuild.mjs', '--watch'], { stdio: 'inherit' }),
    spawn(process.execPath, [viteBin, 'build', '--watch', '--config', 'vite.webview.config.ts'], {
        stdio: 'inherit',
    }),
];

const stopAll = (code = 0) => {
    for (const child of processes) {
        if (!child.killed) child.kill();
    }
    process.exit(code);
};

for (const child of processes) {
    child.on('exit', (code) => {
        if (code && code !== 0) stopAll(code);
    });
}

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
