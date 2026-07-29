# QuaK VSCode Extension — Status & Next Steps

> Handoff snapshot. Companion to [`vscode-extension-architecture.md`](./vscode-extension-architecture.md)
> (the plan) and [`phase1-shared-extraction.md`](./phase1-shared-extraction.md).

**Goal:** ship the QuaK circuit editor as a VSCode extension on the Marketplace,
where the `.qasm` file is the source of truth and the editor is a view of it.

**Branch:** `hiwi/167-feature-quak-vscode-extension-for-qasm-files`, based on `development`.

## Where things stand

Done and committed:

- **Shared packages** (`packages/`): `circuit-core` (DTOs, gate types, `CircuitPort`,
  support matrix), `ui` (8 shadcn primitives + `cn`), `circuit-editor` (the editor +
  library, backend-free). The frontend consumes them via re-export shims — the web
  IDE behaves unchanged. Boundary enforced in CI (dependency-cruiser).
- **Extension** (`vscode-extension/`): `CustomTextEditorProvider` for `.qasm`, protocol
  v2 with edit arbitration (stale/readOnly/apply), multi-panel broadcast. The webview
  renders the **real** circuit editor + library, themed to VSCode.
- **CI** (`js-checks` job): lint, boundaries, typecheck, frontend + extension unit
  tests, `@vscode/test-electron` integration tests, extension build, vsix packaging
  guard.
- **Packaging**: `npm run package` produces a ~1 MB / 68-file vsix. A guard
  (`check:vsix`) fails if secrets, sources or tests leak in — this caught a config that
  would have shipped `.git` and `.env` (39169 files).

Runs today: open a `.qasm`, "Reopen Editor With → QuaK Circuit Editor", see the editor
with a **fixed demo circuit** and the gate library, themed light/dark.

## What is NOT done

- **The circuit is static.** It is not parsed from the open document, and the
  `CircuitPort` is a no-op — dropping a gate does nothing. This needs the QASM↔circuit
  transformation, which lives in **PR #163 (still open, not in this branch)**.
- **No language features** (diagnostics, completion, hover). That is Phase 3 / the D7
  decision, untouched.
- **No publish pipeline.** Needs a Marketplace publisher account and a `VSCE_PAT`
  secret — both are the team's to set up.

## Known issues (not caused by the extension work, do not fix blind)

- **Drag placeholder bug:** in the extension, a gate dropped over another sometimes
  does not make room; the dragged gate flickers. Reproduces in the extension, **not**
  the web IDE. A memo with an incomplete dependency array was suspected and that fix
  made it *worse*, so it was reverted. Needs a real repro (a browser harness rendering
  `CircuitView` and firing drag events) before touching the shared editor again.
- **5 pre-existing `react-hooks/exhaustive-deps` violations** in the frontend; the rule
  is currently `off`.

## Next steps toward the goal

Independent of #163 (can start now):

1. **Bundle diet — partly done.** KaTeX shipped every font in woff2 **and** woff **and**
   ttf; the Chromium webview only ever loads woff2, so woff+ttf (~876 KB) were pure vsix
   ballast. A `strip-katex-legacy-fonts` Vite plugin in `vite.webview.config.ts` removes
   their `@font-face` sources before Vite resolves the url()s. Result: **vsix ~1 MB →
   454 KB, 68 → 28 files.** Web IDE untouched (separate `frontend/vite.config.ts`).
   *Still open:* the 276 KB katex.js sits in `webview.js`; true lazy-load needs ES-module
   output (the `iife` build cannot code-split) and would only defer parse, not shrink the
   vsix — deferred as a separate risk decision.
2. **`retainContextWhenHidden` — measurement is premature.** The webview fully
   reconstructs from the file (`ready` → `documentChanged`) and currently holds no
   ephemeral UI state, so a real memory measurement (needs interactive VSCode) would only
   profile the *demo* webview. Both the memory profile and the state-preservation cost
   depend on the real circuit — defer the measurement to **post-#163**. `true` stays a
   defensible cheap start.
3. **Marketplace icon.** No QuaK logo asset exists (the app brand is gradient text).
   Design decision for the team; the `icon` field is currently omitted.
4. **Phase 3 / D7 — decided: coexistence via extension pack.** `orangekame3.vscode-qasm`
   (Apache-2.0, bundles its own `qasmlsp`) is listed in `extensionPack`: installed with
   QuaK, but independently managed/uninstallable — QuaK's activation does not depend on
   it. Rationale: no good hard-dependency target exists (vscode-qasm too immature at ~72
   installs; Microsoft QDK mature but too heavy to force). Reversible: upgrade to a hard
   `extensionDependencies` later if a QASM extension proves stable. Bundling own `qasmlsp`
   (platform matrix) rejected for v1. README documents the pack.
5. **Quantikz export — done.** Pure `toQuantikz` + `circuitIndex.ts` moved to
   `@quak/circuit-core` (subpath exports `./quantikz`, `./circuitIndex`; frontend shims
   keep the old paths). The hook + `QuantikzExportButton` moved to `@quak/circuit-editor`.
   The button takes an injectable `renderCode` prop: the web IDE injects its
   syntax-highlighted `LatexCodeBlock` (stays frontend-only), the extension uses a lean
   `<pre>` default — so `react-syntax-highlighter` never enters the webview bundle
   (verified: 0 refs). Wired into the webview toolbar via `CircuitView`'s `toolbarStart`.
   Note: `@quak/circuit-core/quantikz` is a **flat file** (`src/quantikz.ts`), not a
   subdir — the frontend vite alias resolves subpaths by string replacement and would hit
   EISDIR on a directory. Covered by `quantikzMapper.test.ts` (7 cases: gate, controlled-X
   offset, SWAP, symbolic π-fraction angle, measurement, LaTeX escaping, standalone doc) in
   the frontend suite, since `packages/` has no test runner. Caveat: exports the demo
   circuit until #163 lands.
6. **Shared workspace shell — done.** The library's collapse + resize chrome lived only in
   the frontend's `CircuitWorkspaceContent`; the extension had a static `<aside>`. Extracted
   `CircuitWorkspaceShell` into `@quak/circuit-editor` (uses `@quak/ui/resizable`, no frontend
   coupling): it owns the collapse/resize layout and takes `library` + `editor` as slots.
   Collapse is **uncontrolled** (`defaultCollapsed` + `onCollapsedChange`) so each host
   persists it its own way — the web IDE via localStorage, the extension via the webview
   `getState`/`setState` (survives reload, not just hide/show). The single `acquireVsCodeApi`
   handle now lives in `webview/vscodeApi.ts` (shared by `useDocument` and the collapse
   persistence), since it may only be acquired once per webview. Both consumers share one
   layout; the box/list view toggle was already shared (it lives inside `LibraryView`).

Blocked on #163:

5. **Parse the document into a circuit** (Phase 4): QASM→circuit so the editor shows the
   real file, read-only first.
6. **Write edits back** (Phase 6): circuit→QASM, implement a local `CircuitPort` that
   turns a gate drop into a `applyEdit`. The arbitration and undo already work.
7. **`packages/qasm-transform`** (Phase 5): the ANTLR TS port with the losslessness
   contract. The biggest remaining piece.

Coordination: this branch restructured the circuit editor (#168 + extraction) that #163
also touches — expect a substantial merge. Also, the quantikz/notation folder was moved
to `frontend/src/views/circuit-workspace/notation/`; #161 puts it at `frontend/src/notation/`.
