import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

// One config for the whole monorepo. The areas differ in what they may assume:
// the web IDE is React in a browser, the shared packages have neither React nor
// DOM, the extension host is Node, and only the webview is browser again.

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

    // Web IDE: React in the browser.
    {
        files: ['frontend/**/*.{ts,tsx}'],
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
            'react-hooks/exhaustive-deps': 'off',
        },
    },

    // Shared packages: plain TypeScript, no React and no DOM.
    {
        files: ['packages/**/*.ts'],
        languageOptions: {
            globals: {},
        },
    },

    // Extension host: runs in Node.
    {
        files: ['vscode-extension/src/**/*.ts'],
        languageOptions: {
            globals: globals.node,
        },
    },

    // Extension webview: a sandboxed browser frame.
    {
        files: ['vscode-extension/src/webview/**/*.ts'],
        languageOptions: {
            globals: globals.browser,
        },
    },

    eslintConfigPrettier, // Has to be last argument
);
