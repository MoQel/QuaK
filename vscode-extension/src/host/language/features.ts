import * as vscode from 'vscode';
import type { ClassificationCache } from '../documentModel.ts';
import { QASM_SELECTOR } from '../qasmDocument.ts';
import { completionsFor, type CompletionSuggestion } from './completionModel.ts';
import { hoverFor } from './hoverModel.ts';
import { completionAt, wordAt } from './qasmContext.ts';

const HOVER = 'quak.hover.enabled';
const COMPLETION = 'quak.completion.enabled';

// Read per call, not cached: the settings can be changed per workspace.
const enabled = (setting: string): boolean => vscode.workspace.getConfiguration().get<boolean>(setting, true);

export function registerLanguageFeatures(documents: ClassificationCache): vscode.Disposable[] {
    return [
        vscode.languages.registerHoverProvider(QASM_SELECTOR, hoverProvider(documents)),
        // `[` opens an index, where the register decides which numbers exist.
        vscode.languages.registerCompletionItemProvider(QASM_SELECTOR, completionProvider(documents), '['),
    ];
}

function hoverProvider(documents: ClassificationCache): vscode.HoverProvider {
    return {
        provideHover(document, position) {
            if (!enabled(HOVER)) return null;

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

function completionProvider(documents: ClassificationCache): vscode.CompletionItemProvider {
    return {
        provideCompletionItems(document, position) {
            if (!enabled(COMPLETION)) return null;

            const context = completionAt(document.getText(), document.offsetAt(position));
            if (!context) return null;

            const registers = documents.of(document)?.circuit?.registers ?? [];
            const kind = context.kind === 'gate' ? vscode.CompletionItemKind.Function : vscode.CompletionItemKind.Value;

            return completionsFor(context, registers).map((suggestion) => toCompletionItem(suggestion, kind));
        },
    };
}

function toCompletionItem(suggestion: CompletionSuggestion, kind: vscode.CompletionItemKind): vscode.CompletionItem {
    const item = new vscode.CompletionItem(suggestion.label, kind);
    item.insertText = new vscode.SnippetString(suggestion.insert);
    item.detail = suggestion.detail;
    item.sortText = suggestion.sortText;
    if (suggestion.documentation) item.documentation = new vscode.MarkdownString(suggestion.documentation);

    return item;
}
