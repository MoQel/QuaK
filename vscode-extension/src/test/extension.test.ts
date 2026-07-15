import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';

// These run inside a real VSCode. They cover the wiring that unit tests cannot
// reach: that the custom editor is registered, opens for .qasm, tolerates several
// panels on one document, and leaves the document an ordinary TextDocument.
// What a webview receives is deliberately not asserted here; messages to a
// webview cannot be observed from the outside, so those rules live in
// arbitration.test.ts instead.

const EXTENSION_ID = 'quak.quak-vscode';
const VIEW_TYPE = 'quak.circuitEditor';
const SAMPLE = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n\nqubit[2] q;\n\nh q[0];\ncx q[0], q[1];\n';

let tempDir: string;

function writeQasm(name: string): vscode.Uri {
    const file = path.join(tempDir, name);
    fs.writeFileSync(file, SAMPLE);
    return vscode.Uri.file(file);
}

function customTabsFor(uri: vscode.Uri): vscode.Tab[] {
    return vscode.window.tabGroups.all
        .flatMap((group) => group.tabs)
        .filter(
            (tab) =>
                tab.input instanceof vscode.TabInputCustom &&
                tab.input.viewType === VIEW_TYPE &&
                tab.input.uri.toString() === uri.toString(),
        );
}

suite('QuaK circuit editor', () => {
    suiteSetup(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quak-test-'));
    });

    teardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('activates', async () => {
        const extension = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(extension, `extension ${EXTENSION_ID} not found`);

        await extension.activate();
        assert.equal(extension.isActive, true);
    });

    test('opens a .qasm file in the circuit editor', async () => {
        const uri = writeQasm('open.qasm');

        await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE);

        assert.equal(customTabsFor(uri).length, 1);
    });

    test('leaves the text editor as the default for .qasm', async () => {
        const uri = writeQasm('default.qasm');

        // Plain open, no view type: must land in the built-in text editor.
        await vscode.commands.executeCommand('vscode.open', uri);

        assert.equal(customTabsFor(uri).length, 0);
        assert.equal(vscode.window.activeTextEditor?.document.uri.toString(), uri.toString());
    });

    test('supports several circuit editors on one document', async () => {
        const uri = writeQasm('multi.qasm');

        await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE, vscode.ViewColumn.One);
        await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE, vscode.ViewColumn.Two);

        assert.equal(customTabsFor(uri).length, 2);
    });

    test('keeps the file an ordinary text document: an edit is undoable', async () => {
        const uri = writeQasm('undo.qasm');
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
        const before = document.getText();

        // The same mechanism the provider uses for a webview edit.
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, new vscode.Position(0, 0), 'x q[0];\n');
        assert.equal(await vscode.workspace.applyEdit(edit), true);
        assert.notEqual(document.getText(), before);

        await vscode.commands.executeCommand('undo');

        assert.equal(document.getText(), before);
    });

    test('bumps the document version on every change, which is what arbitration keys on', async () => {
        const uri = writeQasm('version.qasm');
        const document = await vscode.workspace.openTextDocument(uri);
        const startVersion = document.version;

        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, new vscode.Position(0, 0), 'y q[0];\n');
        await vscode.workspace.applyEdit(edit);

        assert.ok(
            document.version > startVersion,
            `expected version to advance, got ${startVersion} -> ${document.version}`,
        );
    });
});
