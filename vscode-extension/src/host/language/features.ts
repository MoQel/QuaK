// Hover for .qasm files. Measured against QDK 1.31.0: it registers no hover for
// openqasm, so ours is the only one on the language.
import * as vscode from 'vscode';
import type { ClassificationCache } from '../documentModel.ts';
import { hoverFor } from './hoverModel.ts';
import { wordAt } from './qasmContext.ts';

const ENABLED = 'quak.languageFeatures.enable';

/** By pattern as well: another extension claiming .qasm takes the language association. */
const SELECTOR: vscode.DocumentSelector = [{ language: 'openqasm' }, { pattern: '**/*.qasm' }];

export function registerLanguageFeatures(documents: ClassificationCache): vscode.Disposable[] {
    return [vscode.languages.registerHoverProvider(SELECTOR, hoverProvider(documents))];
}

function hoverProvider(documents: ClassificationCache): vscode.HoverProvider {
    return {
        provideHover(document, position) {
            // Read per call, not cached: the setting can be changed per workspace.
            if (!vscode.workspace.getConfiguration().get<boolean>(ENABLED, true)) return null;

            const word = wordAt(document.getText(), document.offsetAt(position));
            if (!word) return null;

            // The parse this version already has; a document without registers still
            // has gates and keywords worth explaining.
            const registers = documents.of(document)?.circuit?.registers ?? [];
            const text = hoverFor(word, registers);
            if (!text) return null;

            const range = new vscode.Range(document.positionAt(word.start), document.positionAt(word.end));

            return new vscode.Hover(new vscode.MarkdownString(text), range);
        },
    };
}
