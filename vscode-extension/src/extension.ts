import * as vscode from 'vscode';
import { CircuitEditorProvider } from './circuitEditorProvider.ts';

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(...CircuitEditorProvider.register(context));
}

export function deactivate(): void {
    // Nothing to clean up: everything is registered via context.subscriptions.
}
