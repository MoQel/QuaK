import { spawn } from 'node:child_process';

const processes = [
    spawn(process.execPath, ['esbuild.mjs', '--watch'], { stdio: 'inherit' }),
    spawn('vite', ['build', '--watch', '--config', 'vite.webview.config.ts'], {
        shell: process.platform === 'win32',
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
