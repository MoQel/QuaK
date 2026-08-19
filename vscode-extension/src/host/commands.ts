// The commands that make the circuit editor reachable without knowing about "Open With…".
import * as vscode from 'vscode';
import { CircuitEditorProvider } from './circuitEditorProvider.ts';

export function registerCommands(output: vscode.OutputChannel): vscode.Disposable[] {
    return [
        // Besides, not in place: the file stays open as text, which is the whole point of
        // the circuit being a second view of it rather than a replacement.
        vscode.commands.registerCommand('quak.openCircuitEditorToSide', (uri?: vscode.Uri) =>
            openCircuitEditor(uri, vscode.ViewColumn.Beside),
        ),
        vscode.commands.registerCommand('quak.openCircuitEditor', (uri?: vscode.Uri) =>
            openCircuitEditor(uri, vscode.ViewColumn.Active),
        ),
        // The way back: the circuit editor has no text of its own to fall back on.
        vscode.commands.registerCommand('quak.showSource', (uri?: vscode.Uri) => showSource(uri)),
        // The read-only notice and the crash screen both point here.
        vscode.commands.registerCommand('quak.showLog', () => output.show(true)),
    ];
}

async function openCircuitEditor(uri: vscode.Uri | undefined, column: vscode.ViewColumn): Promise<void> {
    // Menus pass the resource; the command palette passes nothing.
    const target = uri ?? activeQasmUri();
    if (!target) {
        void vscode.window.showWarningMessage('Open a .qasm file to show it as a circuit.');
        return;
    }

    await vscode.commands.executeCommand('vscode.openWith', target, CircuitEditorProvider.viewType, column);
}

async function showSource(uri?: vscode.Uri): Promise<void> {
    const target = uri ?? activeQasmUri();
    if (!target) {
        void vscode.window.showWarningMessage('Open a .qasm file to show its source.');
        return;
    }

    // Focus the text editor already showing the file rather than opening a second one.
    const shown = vscode.window.visibleTextEditors.find(
        (editor) => editor.document.uri.toString() === target.toString(),
    );
    const document = await vscode.workspace.openTextDocument(target);

    await vscode.window.showTextDocument(document, { viewColumn: shown?.viewColumn ?? vscode.ViewColumn.Beside });
}

/** The .qasm file in front of the user, whether they are looking at its text or at its circuit. */
function activeQasmUri(): vscode.Uri | undefined {
    const document = vscode.window.activeTextEditor?.document;
    if (document && isQasm(document.uri)) {
        return document.uri;
    }

    const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    return input instanceof vscode.TabInputCustom && isQasm(input.uri) ? input.uri : undefined;
}

// By extension, not by language id: the custom editor is registered for the pattern too,
// so a file it could not be opened for is not a target here either.
const isQasm = (uri: vscode.Uri): boolean => uri.path.endsWith('.qasm');
