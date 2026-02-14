import { languages } from 'monaco-editor';

export const openqasm3: languages.IMonarchLanguage = {
    defaultToken: '',
    tokenPostfix: '.qasm',

    keywords: [
        'OPENQASM',
        'include',

        // Declarations
        'def',
        'extern',
        'defcal',
        'cal',
        'defcalgrammar',

        // Types
        'qubit',
        'bit',
        'bool',
        'int',
        'uint',
        'float',
        'angle',
        'duration',
        'stretch',
        'complex',
        'array',
        'void',

        // Modifiers
        'const',
        'let',
        'input',
        'output',
        'readonly',
        'mutable',
        'shared',

        // Control flow
        'if',
        'else',
        'for',
        'while',
        'do',
        'repeat',
        'until',
        'switch',
        'case',
        'default',
        'break',
        'continue',
        'return',
        'end',

        // Quantum ops
        'measure',
        'reset',
        'barrier',
        'delay',
        'box',
        'nop',
        'gphase',

        // Modifiers / Functors
        'inv',
        'pow',
        'ctrl',
        'negctrl',
        'at',

        // Timing / builtin ops
        'durationof',
        'sizeof',
    ],

    typeKeywords: [
        'qubit',
        'bit',
        'bool',
        'int',
        'uint',
        'float',
        'angle',
        'duration',
        'stretch',
        'complex',
        'array',
        'void',
    ],

    constants: ['true', 'false', 'null', 'pi'],

    operators: [
        '=',
        '>',
        '<',
        '!',
        '~',
        '?',
        ':',
        '==',
        '<=',
        '>=',
        '!=',
        '&&',
        '||',
        '+',
        '-',
        '*',
        '/',
        '%',
        '**',
        '&',
        '|',
        '^',
        '<<',
        '>>',
        '+=',
        '-=',
        '*=',
        '/=',
        '%=',
        '&=',
        '|=',
        '^=',
        '<<=',
        '>>=',
        '->',
        '@',
    ],

    brackets: [
        { open: '{', close: '}', token: 'delimiter.curly' },
        { open: '[', close: ']', token: 'delimiter.bracket' },
        { open: '(', close: ')', token: 'delimiter.parenthesis' },
    ],

    tokenizer: {
        root: [
            { include: '@whitespace' },

            // OPENQASM 3.x header
            [/OPENQASM(?=\s+\d+(\.\d+)?)/, 'keyword'],

            // include "file.qasm";
            [/include(?=\s+")/, 'keyword'],

            [/[{}()[\]]/, '@brackets'],
            [/[;,.]/, 'delimiter'],

            // Annotations: @foo, @foo(...)
            [/@[a-zA-Z_]\w*/, 'annotation'],

            // Operators
            [/->/, 'operator.arrow'],
            [/(\*\*|==|!=|<=|>=|<<=|>>=|&&|\|\||[=><!~?:+\-*/&|^%])/, 'operator'],

            // Strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string'],

            // Time / angle literals (5ns, 3.14rad)
            [/\b\d+(\.\d+)?(ns|us|ms|s|dt|rad)\b/, 'number.unit'],

            // Numbers
            [/\b\d+(\.\d+)?([eE][-+]?\d+)?\b/, 'number'],

            // Identifiers & function calls
            [
                /[a-zA-Z_]\w*/,
                {
                    cases: {
                        '@keywords': 'keyword',
                        '@typeKeywords': 'type',
                        '@constants': 'constant.language',
                        '@default': 'identifier',
                    },
                },
            ],
        ],

        whitespace: [
            [/[ \t\r\n]+/, 'white'],
            [/\/\/[^\r\n]*/, 'comment'],
            [/\/\*/, 'comment', '@comment'],
            [/#([^\r\n]*)/, 'comment.directive'],
        ],

        comment: [
            [/[^/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[/*]/, 'comment'],
        ],

        string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop'],
        ],
    },
};
