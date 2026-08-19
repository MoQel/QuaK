// Entry point loaded by VSCode. Registers the QuaK custom editor for .qasm files.
import * as vscode from 'vscode';
import { CircuitEditorProvider } from './circuitEditorProvider.ts';
import { registerDiagnostics } from './diagnostics.ts';
import { ClassificationCache } from './documentModel.ts';

export function activate(context: vscode.ExtensionContext): void {
    // Shared, so one change event costs one parse no matter how many features react to it.
    const documents = new ClassificationCache();

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((document) => documents.forget(document)),
        ...CircuitEditorProvider.register(context, documents),
        ...registerDiagnostics(documents),
    );
}
