import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

// Bundles the Node-side extension host. VSCode provides the "vscode" module.
const host = {
    entryPoints: ['src/host/extension.ts'],
    outfile: 'dist/extension.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    external: ['vscode'],
    sourcemap: true,
};

// Bundles integration tests so vscode-test can run them inside VSCode.
const tests = {
    entryPoints: ['src/test/extension.test.ts'],
    outdir: 'dist/test',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    external: ['vscode', 'mocha'],
    sourcemap: true,
};

if (watch) {
    const context = await esbuild.context(host);
    await context.watch();
    console.log('watching…');
} else {
    await Promise.all([esbuild.build(host), esbuild.build(tests)]);
}
