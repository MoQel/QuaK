// Which documents are this extension's business.
import * as vscode from 'vscode';

/** Files on disk and unsaved ones; a git diff or an output channel is neither. */
const SCHEMES = ['file', 'untitled'];

// By extension as well as by language: another extension claiming .qasm takes the
// association and leaves ours unused.
export const QASM_SELECTOR: vscode.DocumentSelector = SCHEMES.flatMap((scheme) => [
    { scheme, language: 'openqasm' },
    { scheme, pattern: '**/*.qasm' },
]);

export function isQasmDocument(document: vscode.TextDocument): boolean {
    if (!SCHEMES.includes(document.uri.scheme)) return false;

    return document.uri.path.endsWith('.qasm') || document.languageId === 'openqasm';
}
