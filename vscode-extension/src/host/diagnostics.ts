// Publishes what the transform found into the text editor, so a .qasm file explains
// itself without the circuit editor being open.
import * as vscode from 'vscode';
import {
    diagnosticsFor,
    positionOf,
    type ClassificationCache,
    type DiagnosticSeverity,
    type DocumentDiagnostic,
} from './documentModel.ts';

const SOURCE = 'QuaK';

const SEVERITY: Record<DiagnosticSeverity, vscode.DiagnosticSeverity> = {
    error: vscode.DiagnosticSeverity.Error,
    info: vscode.DiagnosticSeverity.Information,
    hint: vscode.DiagnosticSeverity.Hint,
};

/** Keeps a diagnostic collection in step with every open .qasm document, whether a circuit editor is showing it — the findings are about the file. */
export function registerDiagnostics(documents: ClassificationCache): vscode.Disposable[] {
    const collection = vscode.languages.createDiagnosticCollection('quak');

    const refresh = (document: vscode.TextDocument): void => {
        if (!isQasmDocument(document)) return;

        // Nothing to report about a document that could not be analysed; the reason is
        // in the log, and stale squiggles would be worse than none.
        const classified = documents.of(document);
        const findings = classified ? diagnosticsFor(classified.classification) : [];

        collection.set(
            document.uri,
            findings.map((entry) => toVscodeDiagnostic(entry, document)),
        );
    };

    // Documents opened before this extension activated get no open event of their own.
    for (const document of vscode.workspace.textDocuments) refresh(document);

    return [
        collection,
        vscode.workspace.onDidOpenTextDocument(refresh),
        vscode.workspace.onDidChangeTextDocument((event) => refresh(event.document)),
        // Without this the findings outlive the file in the Problems panel.
        vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri)),
    ];
}

/**
 * Change events arrive for git diffs, output channels and settings too. Matches what
 * the custom editor claims; `languageId` alone would not, since another extension
 * claiming .qasm takes the association and leaves ours unused.
 */
function isQasmDocument(document: vscode.TextDocument): boolean {
    if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') return false;

    return document.uri.path.endsWith('.qasm') || document.languageId === 'openqasm';
}

function toVscodeDiagnostic(entry: DocumentDiagnostic, document: vscode.TextDocument): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(rangeOf(entry, document), entry.message, SEVERITY[entry.severity]);
    diagnostic.source = SOURCE;
    // The grammar rule or gate name, so the Problems panel can be filtered by it.
    diagnostic.code = entry.construct;

    return diagnostic;
}

/** Underlines from the finding to the end of its line; the transform reports no lengths. */
function rangeOf(entry: DocumentDiagnostic, document: vscode.TextDocument): vscode.Range {
    const position = positionOf(entry);
    const line = document.lineAt(Math.min(position.line, document.lineCount - 1));

    // Something missing is reported at the end of the line before it, and a range that
    // starts there is empty — an invisible marker. Back up to cover the last character.
    const start = Math.min(position.column, Math.max(0, line.text.length - 1));

    return new vscode.Range(new vscode.Position(line.lineNumber, start), line.range.end);
}
