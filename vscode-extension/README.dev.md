# QuaK VSCode Extension Package

This document describes the extension package for developers. The public
Marketplace README is `README.md`.

## Runtime Areas

The extension has two runtime environments:

- **Extension host**: runs in VSCode's Node.js extension host and may use the
  `vscode` API.
- **Webview**: runs the React circuit editor in VSCode's sandboxed browser
  frame and talks to the host through `postMessage`.

The `.qasm` text document is the source of truth. The webview renders a circuit
model parsed by the host and requests full-document circuit edits when the user
changes the circuit visually. The host is the only extension runtime that parses
or writes QASM.

## Source Layout

```txt
src/
  host/
    extension.ts              VSCode activation entry point
    circuitEditorProvider.ts  Custom editor host controller
    arbitration.ts            Pure edit arbitration and panel tracking helpers
    documentModel.ts          Classification of a parsed document, and its cache
    diagnostics.ts            Publishes the classification into the Problems panel
  shared/
    protocol.ts               Shared host/webview message types
  test/                     VSCode integration tests
  webview/
    main.tsx                React entry point
    App.tsx                 Webview composition
    components/             Webview-only React components
    data/                   Bundled webview data
    hooks/                  Webview React hooks
    lib/                    Webview-only helpers
    vscodeApi.ts            Single acquireVsCodeApi wrapper
```

Keep host-only code out of `webview/`: it must not import `vscode`. Keep React
and DOM code inside `webview/`.

`syntaxes/openqasm.tmLanguage.json` and `language-configuration.json` are vendored
from microsoft/qsharp under MIT, recorded in `THIRD-PARTY-NOTICES.txt`. Keep the
grammar byte-identical to upstream apart from its attribution block, so refreshing
it stays a plain diff.

## Parsing

Every host feature reads the document through `ClassificationCache`. A change event
reaches the diagnostics, the panel broadcast and, on a visual edit, arbitration —
`ClassificationCache.of` makes that one ANTLR parse per document version instead of
one per caller. `extension.ts` owns the cache and drops a document when it closes.

## Edit Flow

1. VSCode opens a `.qasm` file with `CircuitEditorProvider`.
2. The webview sends `ready`.
3. The host parses the document and broadcasts `documentChanged`.
4. `useCircuitDocument` renders the host-provided circuit model.
5. A visual circuit edit is sent as `applyEdit`.
6. The host accepts or rejects the edit through `decideEdit`.
7. Accepted edits are converted to QASM and applied with `WorkspaceEdit`, so
   VSCode undo/redo still works.

## Checks

From the repository root:

```bash
npm run typecheck:extension
npm run test:extension
npm run build:extension
npm run package:extension
```

For local F5 development, build once or keep both bundles current:

```bash
cd vscode-extension
npm run build
npm run watch
```

`watch` rebuilds the extension host and webview bundles on change. Reload the
Extension Development Host after changes that should be picked up by VSCode.

For shared editor changes, also run:

```bash
npm run typecheck:packages 
npm run typecheck:frontend
npm run test:frontend
```
