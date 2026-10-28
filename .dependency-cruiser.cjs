/**
 * Boundaries between packages/, frontend/ and vscode-extension/. Run with `npm run lint:boundaries`.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
    forbidden: [
        {
            name: 'packages-not-to-frontend',
            comment: 'Shared packages must not import from frontend/.',
            severity: 'error',
            from: { path: '^packages/' },
            to: { path: '^frontend/' },
        },
        {
            name: 'packages-not-to-extension',
            comment: 'Shared packages must not import from vscode-extension/.',
            severity: 'error',
            from: { path: '^packages/' },
            to: { path: '^vscode-extension/' },
        },
        {
            name: 'extension-not-to-frontend',
            comment: 'The extension shares code with the web IDE only through packages/.',
            severity: 'error',
            from: { path: '^vscode-extension/' },
            to: { path: '^frontend/' },
        },
        {
            name: 'circuit-core-is-the-base',
            comment: 'circuit-core depends on no other package and on no UI library.',
            severity: 'error',
            from: { path: '^packages/circuit-core/' },
            to: { path: ['^packages/(ui|circuit-editor|qasm-transform)/', 'node_modules/(react|react-dom)/'] },
        },
        {
            name: 'ui-knows-no-circuits',
            comment: 'ui holds generic primitives only.',
            severity: 'error',
            from: { path: '^packages/ui/' },
            to: { path: '^packages/(circuit-core|circuit-editor|qasm-transform)/' },
        },
        {
            name: 'qasm-transform-without-ui',
            comment: 'qasm-transform runs in the extension host, which has no DOM.',
            severity: 'error',
            from: { path: '^packages/qasm-transform/' },
            to: { path: ['^packages/(ui|circuit-editor)/', 'node_modules/(react|react-dom)/'] },
        },
        {
            name: 'no-parser-in-the-browser',
            comment: 'The ANTLR parser stays out of the editor and the webview bundle; types are fine.',
            severity: 'error',
            from: { path: ['^packages/circuit-editor/', '^vscode-extension/src/(webview|shared)/'] },
            to: { path: '^packages/qasm-transform/', dependencyTypesNot: ['type-only'] },
        },
        {
            name: 'not-to-unresolvable',
            comment: 'Unresolvable import. In packages/ this also catches the frontend-only "@/" alias.',
            severity: 'error',
            from: {},
            to: { couldNotResolve: true },
        },
        {
            name: 'not-in-package.json',
            comment:
                'Imports something the package does not declare. It only resolves through hoisting, so it breaks ' +
                "as soon as the install layout changes. Add it to the package's own package.json.",
            severity: 'error',
            from: {},
            to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
        },
        {
            name: 'no-circular',
            comment: 'Circular dependency. Break the cycle, usually by extracting the shared piece.',
            severity: 'error',
            // ANTLR's parser and visitor reference each other. Cycles through hand-written code are still reported.
            from: { pathNot: '^packages/qasm-transform/src/generated/' },
            to: { circular: true },
        },
    ],
    options: {
        doNotFollow: { path: 'node_modules' },
        // Follow type-only imports too, so an illegal `import type { X } from '@/...'` is still caught.
        tsPreCompilationDeps: true,
        enhancedResolveOptions: {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
            // Needed for dependencies that ship an "exports" map with conditions;
            // without these they look unresolvable even though node resolves them.
            exportsFields: ['exports'],
            conditionNames: ['import', 'require', 'node', 'browser', 'default', 'types'],
            mainFields: ['module', 'main', 'types', 'typings'],
        },
    },
};
