// Entry point loaded by VSCode. Registers the QuaK custom editor for .qasm files.
import * as vscode from 'vscode';
import { CircuitEditorProvider } from './circuitEditorProvider.ts';

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(...CircuitEditorProvider.register(context));
}
