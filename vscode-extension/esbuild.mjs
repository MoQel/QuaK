import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

// The extension host runs in Node and gets "vscode" injected at runtime.
const host = {
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    external: ['vscode'],
    sourcemap: true,
};

// The webview runs in a sandboxed browser frame.
const webview = {
    entryPoints: ['src/webview/main.ts'],
    outfile: 'dist/webview.js',
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
};

if (watch) {
    const contexts = await Promise.all([esbuild.context(host), esbuild.context(webview)]);
    await Promise.all(contexts.map((c) => c.watch()));
    console.log('watching…');
} else {
    await Promise.all([esbuild.build(host), esbuild.build(webview)]);
}
