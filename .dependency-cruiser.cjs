/**
 * Architecture boundary rules.
 *
 * Shared code under packages/ is reused by both the web IDE and the VSCode
 * extension, so it must never import from frontend/ — the Redux store, the REST
 * layer (@/api), ProjectContext and the app shell all live there. Injecting a
 * dependency (e.g. via CircuitPort) is the way around this, not reaching back.
 *
 * Run: `npm run lint:boundaries`.
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
                'as soon as the install layout changes. Add it to the package\'s own package.json.',
            severity: 'error',
            from: {},
            to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
        },
        {
            name: 'no-circular',
            comment: 'Circular dependency — break the cycle, usually by extracting the shared piece.',
            severity: 'error',
            // ANTLR's output is inherently circular: the parser's context classes accept a
            // visitor, and the visitor interface is typed on those same contexts. Nobody can
            // break that cycle, so only generated files are exempt as a *source* — a cycle
            // that runs through hand-written code is still reported from there.
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
