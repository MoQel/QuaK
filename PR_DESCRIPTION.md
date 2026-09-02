## Summary

This PR adds a VS Code extension that edits `.qasm` files with QuaK's circuit editor,
and extracts the parts of the web IDE the extension needs into shared workspace
packages, so both products run the same editor.

Closes #167.

## Changes

### Shared packages (`packages/`)

- `@quak/circuit-core`: the backend-free domain layer shared by both products. Circuit
  and library DTOs, gate types and arity, the wire index, angle recognition and
  formatting, the OpenQASM support matrix, and the quantikz and Dirac notation mappers.
- `@quak/circuit-editor`: the circuit editor with its gate library, extracted from
  `frontend/src/views/circuit-view`. It has no backend and no Redux: the host injects
  the circuit and its setter through `CircuitStoreProvider` and the gate library as a
  prop. Drag state moved from a Redux slice into `CircuitDragProvider`.
- `@quak/qasm-transform`: an OpenQASM 3 parser generated from the backend's ANTLR
  grammars, `toCircuit` (QASM to circuit, with a classification of why a document is or
  is not editable) and `toQasm` (circuit to QASM, byte-exact on its own output).
- `@quak/ui`: the shadcn primitives both products use.
- `.dependency-cruiser.cjs` enforces that packages never import from `frontend/`.

### VS Code extension (`vscode-extension/`)

- A custom text editor for `.qasm` files that renders the shared circuit editor in a
  webview and writes edits back to the document through `WorkspaceEdit`, so undo works.
- Edit arbitration on the host: an edit is applied only if it matches the current
  document version and the document is safely regenerable. Documents with comments or
  unsupported constructs are read-only, with an explicit opt-in for the comment case.
- Diagnostics, hover and completion for OpenQASM, from the same parser.
- Contributes the `openqasm` language, an icon, commands to open the circuit editor and
  the log. Packaged with `vsce` from a bundle; `check-vsix-contents.mjs` guards the
  package contents.
- Unit tests for the vscode-free modules, plus `@vscode/test-electron` integration tests
  against both `stable` and the engines floor.
- Architecture documented in `docs/vscode/vscode-extension-architecture.md`.

### Web IDE (`frontend/`)

- `views/circuit-workspace` is the integration layer: it wires the store, the REST
  library fetch, persistence and the parse button into the shared editor. The old
  `circuit-view`, `library-view`, notation code and `dragOperationSlice` are removed.
- Existing tests were moved next to the code they now cover; tests for the quantikz
  mapper and for backend-free rendering were added.

### Tooling

- One ESLint config, one Prettier config and one lint-staged setup for the whole
  monorepo; `frontend/eslint.config.js` and `frontend/.prettierrc` are gone.
- A root `vitest.config.ts` lists the three test projects for IDE and bare runs.
- CI runs lint, the package boundary check, the generated-parser check, typecheck, all
  three JS test suites, the extension build and the vsix check, and the extension
  integration tests under `xvfb`.
- The backend Dockerfile and `node.gradle` install from the workspace root so the
  `@quak/*` links resolve during the production build.

## Verification

CI runs everything above. Locally:

```bash
npm run lint && npm run lint:boundaries && npm run typecheck
npm run test:frontend && npm run test:packages && npm run test:extension
```
