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
    commands.ts               Command handlers contributed in package.json
    arbitration.ts            Pure edit arbitration and panel tracking helpers
    documentModel.ts          Classification of a parsed document, and its cache
    diagnostics.ts            Publishes the classification into the Problems panel
    language/
      features.ts             Registers the language providers with VSCode
      qasmContext.ts          What the cursor points at, from the text alone
      hoverModel.ts           What a hover says about it
      completionModel.ts      What can be inserted there
    qasmDocument.ts           Which documents this extension answers for
  shared/
    protocol.ts               Shared host/webview message types
    operations.ts             The bundled gate library, read by host and webview
  test/                     VSCode integration tests
  webview/
    main.tsx                React entry point
    App.tsx                 Webview composition
    components/             Webview-only React components
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
reaches the diagnostics, the panel broadcast and, on a visual edit, arbitration.
`ClassificationCache.of` makes that one ANTLR parse per document version instead of
one per caller. `extension.ts` owns the cache and drops a document when it closes.

## Language features

`language/features.ts` registers the providers. What they say is decided by modules that
never import `vscode`. `qasmContext.ts` scans the surrounding statement and returns the
word under the cursor and what may be inserted at it. `hoverModel.ts` and
`completionModel.ts` turn that into text, from the bundled gate library and the support
matrix. None of them parse; the semantics come from `ClassificationCache`.

`hoverModel.ts` decides in the same order as `resolveSupportedGate`: unknown name, then
gate this editor cannot draw, then supported. That is what keeps a hover from
contradicting the squiggle on the line under it.

## Failures

Every host caller sits in a VSCode event handler, where a thrown error is swallowed and
the editor just stops updating. So nothing is left to throw:

- `ClassificationCache` catches a transform defect, caches it like any other result and
  reports it once per document version. `of` returns null and the document reads as
  `failed`.
- The webview edit handler catches, since nothing awaits `applyEdit` and an unhandled
  rejection would be invisible.
- `ErrorBoundary` catches a render crash, puts a message in place of the editor and
  posts `webviewError` to the host.
- `reportUncaughtErrors` catches what a boundary never sees, such as a failing event
  handler, timer or promise, and posts the same message.

All of them report through the `QuaK` output channel created in `extension.ts`. A log,
not a notification, because one broken document would otherwise raise a dialog per
keystroke. Nothing is written to the document on any of these paths.

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

`package:extension` builds a VSIX into a temporary directory, checks its contents and
discards it. To get one you can install, build it here:

```bash
cd vscode-extension
npm run package
```

That writes `quak-vscode-0.0.1.vsix` next to `package.json`, named after the fields there,
so it overwrites the previous one. Install it with
`code --install-extension quak-vscode-0.0.1.vsix --force` and reload the window.

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
