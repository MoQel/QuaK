import * as vscode from 'vscode';
import type { ClassificationCache } from '../documentModel.ts';
import { QASM_SELECTOR } from '../qasmDocument.ts';
import { hoverFor } from './hoverModel.ts';
import { wordAt } from './qasmContext.ts';

const ENABLED = 'quak.hover.enabled';

export function registerLanguageFeatures(documents: ClassificationCache): vscode.Disposable[] {
    return [vscode.languages.registerHoverProvider(QASM_SELECTOR, hoverProvider(documents))];
}

function hoverProvider(documents: ClassificationCache): vscode.HoverProvider {
    return {
        provideHover(document, position) {
            // Read per call, not cached: the setting can be changed per workspace.
            if (!vscode.workspace.getConfiguration().get<boolean>(ENABLED, true)) return null;

            const word = wordAt(document.getText(), document.offsetAt(position));
            if (!word) return null;

            // Gates and keywords are still worth explaining without a parsed register.
            const registers = documents.of(document)?.circuit?.registers ?? [];
            const text = hoverFor(word, registers);
            if (!text) return null;

            const range = new vscode.Range(document.positionAt(word.start), document.positionAt(word.end));

            return new vscode.Hover(new vscode.MarkdownString(text), range);
        },
    };
}
