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

// The integration tests run inside VSCode, so they are bundled like the host.
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
    const contexts = await esbuild.context(host);
    await Promise.all(contexts.map((c) => c.watch()));
    console.log('watching…');
} else {
    await Promise.all([esbuild.build(host), esbuild.build(tests)]);
}
