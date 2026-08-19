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
const SOURCE = 'QuaK';
const SAMPLE = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n\nqubit[2] q;\n\nh q[0];\ncx q[0], q[1];\n';

let tempDir: string | undefined;

function writeQasm(name: string, content: string = SAMPLE): vscode.Uri {
    tempDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'quak-test-'));
    const file = path.join(tempDir, name);
    fs.writeFileSync(file, content);
    return vscode.Uri.file(file);
}

/** Resolves once the document actually holds `text`. */
function changeTo(document: vscode.TextDocument, text: string): Promise<void> {
    if (document.getText() === text) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const sub = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document === document && event.document.getText() === text) {
                sub.dispose();
                resolve();
            }
        });
    });
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

    test('claims .qasm as OpenQASM, so highlighting needs no second extension', async () => {
        const uri = writeQasm('language.qasm');

        const document = await vscode.workspace.openTextDocument(uri);

        assert.equal(document.languageId, 'openqasm');
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

        // executeCommand resolves once the command is dispatched, not once the
        // document has caught up, so wait for the change itself. Asserting right
        // after the await made this test fail every few runs.
        const restored = changeTo(document, before);
        await vscode.commands.executeCommand('undo');
        await restored;

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

// The circuit editor is deliberately never opened here: the findings belong to the
// file, and this is the part unit tests cannot reach — that they are published at
// all, land on the right line, and go away again.
const HEADER = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n';
const UNSUPPORTED = `${HEADER}qubit[2] q;\nbarrier q;\n`;
const MISSING_SEMICOLON = `${HEADER}qubit[2] q\nh q[0];\n`;

const ourDiagnostics = (uri: vscode.Uri): vscode.Diagnostic[] =>
    // Other extensions publish for .qasm too; only ours carry this source.
    vscode.languages.getDiagnostics(uri).filter((diagnostic) => diagnostic.source === SOURCE);

/** Resolves once our diagnostics for `uri` look the way the test expects. */
function waitForDiagnostics(
    uri: vscode.Uri,
    predicate: (diagnostics: vscode.Diagnostic[]) => boolean,
): Promise<vscode.Diagnostic[]> {
    if (predicate(ourDiagnostics(uri))) {
        return Promise.resolve(ourDiagnostics(uri));
    }

    return new Promise((resolve) => {
        const sub = vscode.languages.onDidChangeDiagnostics((event) => {
            const affected = event.uris.some((changed) => changed.toString() === uri.toString());
            if (!affected || !predicate(ourDiagnostics(uri))) return;

            sub.dispose();
            resolve(ourDiagnostics(uri));
        });
    });
}

suite('QuaK diagnostics', () => {
    suiteSetup(async () => {
        // Publishing starts at activation, so do not rely on another suite for it.
        await vscode.extensions.getExtension(EXTENSION_ID)?.activate();
    });

    teardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('reports an unsupported construct on the line it sits on', async () => {
        const uri = writeQasm('unsupported.qasm', UNSUPPORTED);
        await vscode.workspace.openTextDocument(uri);

        const [diagnostic] = await waitForDiagnostics(uri, (found) => found.length > 0);

        assert.equal(diagnostic.code, 'barrierStatement');
        assert.equal(diagnostic.range.start.line, 3);
        // Valid OpenQASM, just outside what the editor can write back.
        assert.equal(diagnostic.severity, vscode.DiagnosticSeverity.Information);
    });

    test('marks a missing token at the gap, with something to see', async () => {
        const uri = writeQasm('syntax.qasm', MISSING_SEMICOLON);
        await vscode.workspace.openTextDocument(uri);

        const [diagnostic] = await waitForDiagnostics(uri, (found) => found.length > 0);

        assert.equal(diagnostic.severity, vscode.DiagnosticSeverity.Error);
        // Line 3 of the file, not the `h` below it that ANTLR blames.
        assert.equal(diagnostic.range.start.line, 2);
        // A range that starts where the token is missing would be empty, and invisible.
        assert.ok(!diagnostic.range.isEmpty, 'expected a range wide enough to show');
    });

    test('takes the finding back once the document is fixed', async () => {
        const uri = writeQasm('fixed.qasm', UNSUPPORTED);
        await vscode.workspace.openTextDocument(uri);
        await waitForDiagnostics(uri, (found) => found.length > 0);

        const edit = new vscode.WorkspaceEdit();
        edit.delete(uri, new vscode.Range(new vscode.Position(3, 0), new vscode.Position(4, 0)));
        await vscode.workspace.applyEdit(edit);

        assert.deepEqual(await waitForDiagnostics(uri, (found) => found.length === 0), []);
    });

    // Not covered: that closing a file takes its findings with it. VSCode disposes a
    // TextDocument some time after its last editor closes, not with it, so a test for
    // that waits on a timer nobody controls — it timed out at 20s when tried.
});
