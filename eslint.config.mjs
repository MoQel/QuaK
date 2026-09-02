import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

// One config for the whole monorepo. The areas differ in what they may assume:
// the web IDE, the circuit editor and the UI primitives are React in a browser,
// circuit-core and qasm-transform have neither React nor DOM, the extension host
// is Node, and the extension webview is React in a browser again.

export default tseslint.config(
    // packages/qasm-transform/src/generated is ANTLR output, not hand-written code:
    // linting it would only produce findings nobody may fix, since regenerating
    // from the .g4 overwrites the file.
    {
        ignores: [
            '**/dist/**',
            '**/coverage/**',
            '**/.vscode-test/**',
            'backend/**',
            'packages/qasm-transform/src/generated/**',
            // Agent worktrees are whole checkouts of this repo; linting them
            // reports every finding twice and from paths nobody can act on.
            '.claude/**',
        ],
    },

    // Baseline for every TypeScript file.
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    },

    // React in a browser: the web IDE, the shared circuit editor and UI primitives,
    // and the extension webview (a sandboxed browser frame).
    {
        files: [
            'frontend/**/*.{ts,tsx}',
            'packages/circuit-editor/**/*.{ts,tsx}',
            'packages/ui/**/*.{ts,tsx}',
            'vscode-extension/src/webview/**/*.{ts,tsx}',
        ],
        languageOptions: {
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': 'off',
            // The editor's effects deliberately list fewer dependencies than the rule
            // wants (see the comments at those effects); the rule would only be noise.
            'react-hooks/exhaustive-deps': 'off',
        },
    },

    // Shared non-UI packages: plain TypeScript, no React and no DOM.
    {
        files: ['packages/circuit-core/**/*.ts', 'packages/qasm-transform/**/*.ts'],
        languageOptions: {
            globals: {},
        },
    },

    // Extension host and its shared protocol: run in Node (the shared part must stay
    // environment-neutral, so it gets no browser globals either).
    {
        files: ['vscode-extension/src/**/*.ts'],
        ignores: ['vscode-extension/src/webview/**'],
        languageOptions: {
            globals: globals.node,
        },
    },

    eslintConfigPrettier, // Has to be last argument
);
