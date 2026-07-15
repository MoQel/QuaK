# QuaK VSCode Extension

Opens `.qasm` files in a QuaK circuit editor alongside the normal text editor.
The file stays the source of truth — the editor is a view of it, and the text
editor remains the default (the circuit editor is offered via "Open With…").

**Status: skeleton.** The webview currently mirrors the document text. The circuit
editor itself, and writing circuit edits back to the file, come in later steps.

## Develop

From the repo root:

```bash
npm run build:extension
```

or from this folder, to rebuild on change:

```bash
npm run watch
```

Then press <kbd>F5</kbd> in VSCode ("Run QuaK Extension") to open an Extension
Development Host. In it, open a `.qasm` file and choose
**Open With… → QuaK Circuit Editor**.

## Layout

| File | Purpose |
|---|---|
| `src/extension.ts` | activation, registration |
| `src/circuitEditorProvider.ts` | the custom editor: panel set per document, webview HTML, broadcast |
| `src/protocol.ts` | message types between host and webview |
| `src/webview/main.ts` | the webview side (currently the raw-text mirror) |
