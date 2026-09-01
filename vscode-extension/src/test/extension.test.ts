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
const DIAGNOSTICS_ERRORS = 'quak.diagnostics.errors';
const DIAGNOSTICS_SYNC_SUPPORT = 'quak.diagnostics.syncSupport';

async function resetDiagnosticSettings(): Promise<void> {
    for (const setting of [DIAGNOSTICS_ERRORS, DIAGNOSTICS_SYNC_SUPPORT]) {
        await vscode.workspace.getConfiguration().update(setting, undefined, vscode.ConfigurationTarget.Global);
    }
}
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

// Without this every run leaves a quak-test-* directory behind in the OS temp directory.
suiteTeardown(() => {
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

const openTabs = (): number => vscode.window.tabGroups.all.reduce((count, group) => count + group.tabs.length, 0);

/**
 * Same trap as `undo` below: the command resolves once dispatched, not once the tabs
 * are gone. Leaving a webview tab behind costs the next test the focus it assumes.
 */
async function closeAllEditors(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    if (openTabs() === 0) return;

    await new Promise<void>((resolve) => {
        const sub = vscode.window.tabGroups.onDidChangeTabs(() => {
            if (openTabs() > 0) return;

            sub.dispose();
            resolve();
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
    teardown(closeAllEditors);

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

    test('opens the circuit beside the text, which is the whole point of the command', async () => {
        const uri = writeQasm('side.qasm');
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

        await vscode.commands.executeCommand('quak.openCircuitEditorToSide', uri);

        const [tab] = customTabsFor(uri);
        assert.ok(tab, 'expected a circuit editor tab');
        assert.notEqual(tab.group.viewColumn, vscode.ViewColumn.One);
        // The text editor has to survive it; the circuit is a second view, not a swap.
        assert.equal(
            vscode.window.visibleTextEditors.some((editor) => editor.document.uri.toString() === uri.toString()),
            true,
        );
    });

    test('takes the file from the active editor when the palette passes nothing', async () => {
        const uri = writeQasm('palette.qasm');
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);

        await vscode.commands.executeCommand('quak.openCircuitEditorToSide');

        assert.equal(customTabsFor(uri).length, 1);
    });

    test('gets back to the text from the circuit, which the circuit editor has no way to do itself', async () => {
        const uri = writeQasm('source.qasm');
        await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE);

        await vscode.commands.executeCommand('quak.showSource', uri);

        assert.equal(vscode.window.activeTextEditor?.document.uri.toString(), uri.toString());
        // The circuit stays open; this is a way back, not a way out.
        assert.equal(customTabsFor(uri).length, 1);
    });

    test('reuses the text editor already showing the file instead of opening a second one', async () => {
        const uri = writeQasm('source-reuse.qasm');
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE, vscode.ViewColumn.Two);

        await vscode.commands.executeCommand('quak.showSource', uri);

        const textTabs = vscode.window.tabGroups.all
            .flatMap((group) => group.tabs)
            .filter((tab) => tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uri.toString());
        assert.equal(textTabs.length, 1);
        assert.equal(vscode.window.activeTextEditor?.viewColumn, vscode.ViewColumn.One);
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
// file, and this is the part unit tests cannot reach: that they are published at
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
        // A run that never reached its teardown leaves the settings in the test
        // instance's user data, so start from a known state.
        await resetDiagnosticSettings();
    });

    teardown(async () => {
        await closeAllEditors();
        // Here rather than in the test that changes it: a timeout skips a test's own
        // cleanup.
        await resetDiagnosticSettings();
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

    const CATEGORIES = [
        { name: 'sync-support', setting: DIAGNOSTICS_SYNC_SUPPORT, source: UNSUPPORTED },
        { name: 'error', setting: DIAGNOSTICS_ERRORS, source: MISSING_SEMICOLON },
    ];

    for (const { name, setting, source } of CATEGORIES) {
        test(`takes back what it said once ${name} reporting is off`, async () => {
            const uri = writeQasm(`disabled-${name}.qasm`, source);
            await vscode.workspace.openTextDocument(uri);
            await waitForDiagnostics(uri, (found) => found.length > 0);

            await vscode.workspace.getConfiguration().update(setting, false, vscode.ConfigurationTarget.Global);

            const remaining = await waitForDiagnostics(uri, (found) => found.length === 0);

            assert.deepEqual(remaining, []);
        });
    }

    test('still reports an error while sync-support reporting is off', async () => {
        // Switched off before the file is opened, so the findings appearing is the event
        // waited for rather than a state that was already there.
        await vscode.workspace
            .getConfiguration()
            .update(DIAGNOSTICS_SYNC_SUPPORT, false, vscode.ConfigurationTarget.Global);
        const uri = writeQasm('errors-only.qasm', MISSING_SEMICOLON);

        await vscode.workspace.openTextDocument(uri);

        const [diagnostic] = await waitForDiagnostics(uri, (found) => found.length > 0);
        assert.equal(diagnostic.severity, vscode.DiagnosticSeverity.Error);
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
    // that waits on a timer nobody controls. It timed out at 20s when tried.
});

// Only what a unit test cannot reach: that the provider is registered and answers for
// the word under the cursor. What it says is asserted in hoverModel.test.ts.
const HOVER_ENABLED = 'quak.hover.enabled';

const COMPLETION_ENABLED = 'quak.completion.enabled';

const reset = (setting: string): Thenable<void> =>
    vscode.workspace.getConfiguration().update(setting, undefined, vscode.ConfigurationTarget.Global);

/** SAMPLE line 5 is `h q[0];`, so column 0 is the gate and column 2 the register. */
async function hoverAt(uri: vscode.Uri, line: number, character: number): Promise<string[]> {
    const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        uri,
        new vscode.Position(line, character),
    );

    return hovers.flatMap((hover) => hover.contents.map((content) => (content as vscode.MarkdownString).value));
}

suite('QuaK hover', () => {
    suiteSetup(async () => {
        await vscode.extensions.getExtension(EXTENSION_ID)?.activate();
        // Same reason as the diagnostics suite.
        await reset(HOVER_ENABLED);
    });

    teardown(async () => {
        await closeAllEditors();
        await reset(HOVER_ENABLED);
    });

    test('explains the gate under the cursor', async () => {
        const uri = writeQasm('hover-gate.qasm');
        await vscode.workspace.openTextDocument(uri);

        const contents = await hoverAt(uri, 5, 0);

        assert.ok(
            contents.some((value) => value.includes('Hadamard')),
            `expected a gate hover, got ${JSON.stringify(contents)}`,
        );
    });

    test('explains the register under the cursor, which only the parse knows the size of', async () => {
        const uri = writeQasm('hover-register.qasm');
        await vscode.workspace.openTextDocument(uri);

        const contents = await hoverAt(uri, 5, 2);

        assert.ok(
            contents.some((value) => value.includes('qubit register') && value.includes('2 wires')),
            `expected a register hover, got ${JSON.stringify(contents)}`,
        );
    });

    test('says nothing where there is no word', async () => {
        const uri = writeQasm('hover-blank.qasm');
        await vscode.workspace.openTextDocument(uri);

        assert.deepEqual(await hoverAt(uri, 4, 0), []);
    });

    test('says nothing while the setting is off', async () => {
        const uri = writeQasm('hover-disabled.qasm');
        await vscode.workspace.openTextDocument(uri);
        await vscode.workspace.getConfiguration().update(HOVER_ENABLED, false, vscode.ConfigurationTarget.Global);

        assert.deepEqual(await hoverAt(uri, 5, 0), []);
    });
});

/** SAMPLE line 5 is `h q[0];`, so column 0 starts a statement and column 4 sits inside the index. */
async function completionsAt(uri: vscode.Uri, line: number, character: number): Promise<vscode.CompletionItem[]> {
    const list = await vscode.commands.executeCommand<vscode.CompletionList>(
        'vscode.executeCompletionItemProvider',
        uri,
        new vscode.Position(line, character),
    );

    return list?.items ?? [];
}

// VSCode's own word-based suggestions come back from that command too, so the kinds
// this extension uses are what separates ours from the words already in the file.
const OUR_KINDS = [vscode.CompletionItemKind.Function, vscode.CompletionItemKind.Value];

const ours = (items: vscode.CompletionItem[]): vscode.CompletionItem[] =>
    items.filter((item) => item.kind !== undefined && OUR_KINDS.includes(item.kind));

const labelsOf = (items: vscode.CompletionItem[]): string[] =>
    ours(items).map((item) => (typeof item.label === 'string' ? item.label : item.label.label));

suite('QuaK completion', () => {
    suiteSetup(async () => {
        await vscode.extensions.getExtension(EXTENSION_ID)?.activate();
        await reset(COMPLETION_ENABLED);
    });

    teardown(async () => {
        await closeAllEditors();
        await reset(COMPLETION_ENABLED);
    });

    test('suggests a gate call where a statement starts', async () => {
        const uri = writeQasm('completion-gate.qasm');
        await vscode.workspace.openTextDocument(uri);

        const items = await completionsAt(uri, 5, 0);
        const cx = ours(items).find((item) => item.label === 'cx');

        assert.ok(cx, `expected a cx suggestion, got ${JSON.stringify(labelsOf(items))}`);
        assert.equal(cx.detail, 'CNOT');
        // The snippet is what makes the operand order visible; two different wires.
        assert.equal((cx.insertText as vscode.SnippetString).value, 'cx ${1:q[0]}, ${2:q[1]};');
    });

    test('suggests the wires of the register being indexed', async () => {
        const uri = writeQasm('completion-index.qasm');
        await vscode.workspace.openTextDocument(uri);

        const items = ours(await completionsAt(uri, 5, 4));

        assert.deepEqual(labelsOf(items), ['0', '1']);
        assert.equal(items[1].detail, 'q[1]');
    });

    test('leaves operand position to the other providers', async () => {
        const uri = writeQasm('completion-operand.qasm');
        await vscode.workspace.openTextDocument(uri);

        assert.deepEqual(labelsOf(await completionsAt(uri, 5, 2)), []);
    });

    test('says nothing while the setting is off', async () => {
        const uri = writeQasm('completion-disabled.qasm');
        await vscode.workspace.openTextDocument(uri);
        await vscode.workspace.getConfiguration().update(COMPLETION_ENABLED, false, vscode.ConfigurationTarget.Global);

        assert.deepEqual(labelsOf(await completionsAt(uri, 5, 0)), []);
    });
});
