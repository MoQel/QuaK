// Entry point loaded by VSCode. Registers the QuaK custom editor for .qasm files.
import * as vscode from 'vscode';
import { CircuitEditorProvider } from './circuitEditorProvider.ts';
import { registerCommands } from './commands.ts';
import { registerDiagnostics } from './diagnostics.ts';
import { ClassificationCache } from './documentModel.ts';

export function activate(context: vscode.ExtensionContext): void {
    // A log channel rather than a notification: these are our own defects, and one
    // broken document would otherwise raise a dialog on every keystroke.
    const output = vscode.window.createOutputChannel('QuaK', { log: true });
    const report = (error: unknown, context: string): void => output.error(`${context} — ${describe(error)}`);

    // Shared, so one change event costs one parse no matter how many features react to it.
    const documents = new ClassificationCache(report);

    context.subscriptions.push(
        output,
        vscode.workspace.onDidCloseTextDocument((document) => documents.forget(document)),
        ...registerCommands(output),
        ...CircuitEditorProvider.register(context, documents, report),
        ...registerDiagnostics(documents),
    );
}

/** The stack is the useful part; anything thrown that is not an Error still has to read as something. */
const describe = (error: unknown): string =>
    error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error);
