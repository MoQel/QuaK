# QuaK VSCode Extension — Architecture & Decisions

> **Status:** Draft / planning baseline
> **Based on:** project state `development` + PR #163 (QASM ↔ circuit transformation)
> **Purpose:** This document records *what* is being built, *why* the key decisions were
> made, and *in which order* the work should proceed. It is written to be understandable
> for developers who have never built a VSCode extension before.

---

## 1. Goal

Selected parts of the QuaK web IDE are to be packaged and shipped as a VSCode extension.
The target user experience:

1. A user opens a `.qasm` file in VSCode.
2. The file is recognized as OpenQASM. The regular text editor provides LSP support
   (diagnostics, completion, hover) via the `qasmlsp` server that QuaK already uses in
   its backend today.
3. In addition, the user can open the QuaK **Circuit Editor** (including the
   **Library**), which displays the same file graphically.
4. Edits in the text update the circuit; edits in the circuit update the text — both
   views stay consistent. The transformation comes from PR #163.
5. Later (explicitly not part of the first version): the **Results view** with local
   simulation via `qulacs-wasm`.

Important framing: the extension is **not a second QuaK**. There are no projects, no user
accounts, and no database in VSCode. Existing frontend components are repackaged —
nothing more.

---

## 2. Background: how a VSCode extension works

Four concepts are sufficient to follow the rest of this document:

**Extension host.** An extension is a Node.js program that VSCode runs in a separate
process. This process has full access to the VSCode API and the file system and — unlike
browser code — may spawn local processes. This is where the extension logic lives: editor
registration, document synchronization, LSP startup.

**Webview.** VSCode UI is normally composed of native editor building blocks. Custom,
complex UI (such as the Circuit Editor) runs in a *webview*: an embedded, sandboxed
browser frame that renders arbitrary HTML/JS/CSS — including React components. Webview
and extension host communicate exclusively via messages (`postMessage`), never via shared
memory. This enforces a small, explicit protocol (see section 6).

**CustomTextEditor.** VSCode provides an API to register a custom editor for a file type
(`registerCustomEditorProvider` with a `CustomTextEditorProvider`). The key property: the
underlying `TextDocument` remains an ordinary text document managed by VSCode. The custom
editor is only a *view* of it. Undo/redo, dirty tracking, saving, git diffs, and hot exit
come **for free** — none of it needs to be reimplemented. Users can open the same file in
the text editor and the circuit editor side by side (split view, "Open With…").

**Language Server Protocol (LSP).** VSCode is the native home of the LSP. Using the
`vscode-languageclient` npm package, the extension starts a language server as a local
child process connected via stdio. The entire WebSocket bridge required in the web
frontend (`JsonRpcTransport`, `LSPClient`, the backend handlers) exists only because a
browser cannot spawn processes. In VSCode it is not needed at all.

---

## 3. Core decisions

Each decision is recorded with its rationale and consequences so that it can be revisited
later with full context.

### D1 — The `.qasm` file is the single source of truth

In the web IDE, the **circuit** is the primary artifact: it lives in the database, every
edit operation is a REST call, and the code is a derived view. The extension inverts
this: the **file** is the truth, and the circuit is a *projection* of its content. There
is no second persistent state.

*Rationale:* In VSCode, users open their own files from their own repositories. "Save"
means Ctrl+S. A parallel server-side state would immediately raise the question of which
version wins — and undo/redo, git, and hot exit only work correctly when the text
document is authoritative.

*Consequences:* The circuit state inside the webview is ephemeral and is recomputed from
the file content whenever needed. Circuit edits are written back into the document
immediately as text changes (via `WorkspaceEdit`) and are never cached elsewhere.

### D2 — Lossless over visual

The circuit editor supports a subset of OpenQASM 3 (no control flow, no `def`
subroutines, etc.). A file may therefore contain constructs that the circuit model cannot
represent. The binding rule for this case:

> **Data loss is never acceptable. When fidelity and visual editing conflict, fidelity
> wins.** If a file contains constructs outside the circuit model, the circuit view
> switches to **read-only** and clearly indicates why. Text editing and LSP support
> remain fully available. Under no circumstances may a circuit edit silently drop
> content that the model cannot represent.

*Rationale:* An extension that rewrites or truncates user files destroys trust
permanently and can corrupt work under version control. A read-only visualization of a
partially supported file is still useful; a lossy round trip is not.

*Consequences:* The parser must distinguish "syntactically invalid" from "valid but
outside the supported subset", and the webview needs an explicit read-only state. The
supported subset should be documented in the extension README.

### D3 — No server dependency in the target state

The extension works fully offline. No QuaK backend, no database, no login. Everything it
needs ships with it or runs locally.

*Rationale:* An editor extension that requires a server for every gate edit is unusable
offline, adds network latency to every interaction, forces users to run infrastructure or
create an account, and couples every extension release to a server API version. Nothing
is gained in return — there is simply nothing that belongs on a server in this scenario.

*Scope of the rule:* "No server" means **no network or infrastructure dependency**. Local
child processes are explicitly fine — `qasmlsp` runs exactly this way, which is the
standard LSP setup in VSCode.

*Deliberate, temporary exception:* During the proof of concept (phase 4), the extension
may call the stateless endpoints `POST /api/circuit/parse` and
`POST /api/circuit/qasmCode` of a local development backend. This validates the sync
mechanism before investing in the TypeScript port of the transformation. It is
scaffolding, not the target state.

### D4 — Target environment: desktop VSCode only (for now)

The extension targets **desktop VSCode** on Windows, macOS, and Linux.
**vscode.dev (VSCode for the Web) is explicitly out of scope.** GitHub Codespaces /
Remote Development support is **deliberately left open** as a possible later addition,
but is neither built nor tested initially.

*Background — extension kinds:* VSCode distinguishes where an extension runs. In remote
setups (SSH, WSL, Dev Containers, Codespaces) there are two extension hosts: a local
**UI** host on the user's machine and a **workspace** host on the remote side. The
`extensionKind` field in `package.json` declares where an extension prefers to run. In
VSCode for the Web (vscode.dev), extensions run in a **browser-based** extension host
with no Node.js APIs and no ability to spawn processes.

*Rationale for excluding vscode.dev:* The LSP integration spawns the `qasmlsp` Go binary
as a child process — impossible in a browser extension host. Supporting vscode.dev would
require a separate web build of the extension and an alternative diagnostics story
(e.g. compiling the language tooling to WASM). That effort has no place in the first
version.

*Rationale for keeping Codespaces open:* In Codespaces the extension would run on the
remote (Linux) workspace host, where spawning a linux-x64 `qasmlsp` binary works.
Feasible, but it adds a test matrix (remote webview behavior, binary provisioning) that
should not burden the initial releases.

*Consequences:* Declare `"extensionKind": ["workspace"]` (the extension needs file access
and process spawning, which belong to the workspace side; on plain desktop installs this
is also simply the local host). Do **not** provide a `browser` entry point in
`package.json` — its absence is what keeps the extension cleanly out of vscode.dev.
Remote scenarios are documented as unsupported until explicitly tested.

### D5 — Monorepo, not a separate repository

The extension lives in the QuaK repository next to `frontend/` and `backend/`. Shared
code moves into `packages/` (details in section 8).

*Rationale:* The main long-term risk is the extension falling behind the main project. A
separate repository would encourage exactly that: components get copied instead of
shared, and drift is noticed late. In a monorepo, a PR that changes the circuit editor
changes both products at once. CI builds the extension on every push — a breaking change
turns the PR red, not the marketplace listing three months later.

*Consequences:* Currency is automatic at the code level **as long as shared parts are
actually shared** (imports from `packages/`, never copy-paste). Additionally, a release
pipeline is needed once (a CI job that packages the VSIX on release and publishes it).

### D6 — CustomTextEditor as the integration mechanism

The circuit editor is registered as a `CustomTextEditorProvider` for `.qasm` files — in
addition to the regular text editor, not as a replacement (the text editor remains the
default).

*Rationale:* This API is built for exactly this scenario: a visual view of a text
document that coexists with the text editor, with persistence concerns handled by VSCode.
The alternative (a free-floating webview panel with manual file handling) would have to
solve undo, dirty state, and conflict handling itself — avoidable effort and avoidable
bugs.

### D7 — Native LSP, without the WebSocket bridge

The extension starts the `qasmlsp` binary (from `orangekame3/qasmtools`, already QuaK's
LSP server today) directly via `vscode-languageclient` over stdio.

*Consequences:* (a) The frontend LSP stack and the backend bridge are not used in VSCode.
(b) The Go binary must be distributed per platform — either platform-specific VSIX
packages or a download on first activation. (c) To check beforehand: does an official
qasmtools extension already exist on the marketplace? If so, an extension dependency may
be cheaper than bundling. The qasmtools license must be reviewed either way.

### D8 — Transformation runs locally, via an ANTLR TypeScript port

The QASM↔circuit transformation from PR #163 (ANTLR grammar + `QasmCircuitVisitor` +
`QasmCodeGenerator`, all Java) is ported to TypeScript for the extension and provided as
the package `packages/qasm-transform`.

*Why not the alternatives:* Remote calls violate D3. A Java sidecar (CLI / GraalVM native
image) is possible but pulls a JVM toolchain into the extension pipeline and adds
per-platform distribution effort — disproportionate for parser/generator logic of this
size.

*The decisive lever:* ANTLR has an official TypeScript target. **The same `.g4` grammar
files** in `backend/src/main/antlr/` generate both the Java and the TypeScript parser.
The grammar remains a single source in the repository.

*The only real duplication in the project:* After the port, the visitor and the code
generator exist in Java (web IDE/backend) and TypeScript (extension). Anyone changing
transformation semantics (e.g. adding a gate) must touch both sides. Two safeguards:

1. **Shared fixture test suite:** a directory of real `.qasm` files plus the expected
   circuit structures (as JSON). Both implementations run against the same fixtures in
   CI — divergence turns the build red.
2. **Team convention:** PRs that change the transformation change both implementations
   and add fixtures.

*Long-term option (deliberately left open):* The TS implementation could later also
replace the backend parse/generate endpoints in the web IDE (parsing in the browser,
without latency). The duplication would then disappear again. This decision is deferred
until the TS port has proven itself.

### D9 — Library as bundled data, Results later

The library currently loads its gate definitions via `GET /api/operations`. For the
extension, the definitions ship as JSON (ideally exported from the backend at build time
so the source stays single). The Results view is feasible — the simulation already runs
client-side via `qulacs-wasm` in a web worker, and webviews can execute WASM and
workers — but it is deliberately deferred to a later phase to keep the core (sync +
editor) focused.

---

## 4. Architecture overview

```
┌─────────────────────────── VSCode (desktop) ──────────────────┐
│                                                               │
│  Text editor (native)        Circuit editor (CustomTextEditor)│
│  edits grover.qasm           webview with React bundle        │
│        │                        │        ▲                    │
│        │                        │ postMessage                 │
│        ▼                        ▼        │                    │
│  ┌───────────────────────────────────────────────┐            │
│  │            Extension host (Node.js)           │            │
│  │                                               │            │
│  │  CustomTextEditorProvider                     │            │
│  │   • listens to onDidChangeTextDocument        │            │
│  │   • applies WorkspaceEdits to the document    │            │
│  │   • loop prevention (version stamps)          │            │
│  │                                               │            │
│  │  LanguageClient ──stdio──► qasmlsp (binary)   │            │
│  └───────────────────────────────────────────────┘            │
│                        │                                      │
│                        ▼                                      │
│              TextDocument = grover.qasm                       │
│              (single source of truth)                         │
└───────────────────────────────────────────────────────────────┘

Inside the webview:  CircuitView + LibraryView (from packages/circuit-editor)
                     parse()/generate()        (from packages/qasm-transform)
```

The transformation runs **inside the webview** (it is plain TypeScript without Node
dependencies). The extension host stays a thin mediator between document and webview,
which keeps responsibilities clear: host = document lifecycle, webview = rendering and
domain logic.

---

## 5. Supported OpenQASM subset and the read-only rule (D2 in practice)

Parsing a document has three possible outcomes, and the UI must distinguish all three:

| Parse outcome | Circuit view behavior |
|---|---|
| Valid, fully within the circuit model | Editable circuit, live sync in both directions |
| Valid OpenQASM, but contains unsupported constructs (control flow, `def`, includes beyond the standard library, …) | **Read-only** circuit rendering of the supported parts where feasible, or a clear "cannot be displayed" state; a visible notice names the unsupported construct. Circuit-to-text editing is disabled entirely for this document state. |
| Syntactically invalid (typical while typing) | Keep the last valid rendering with a subtle "view is out of date" indicator; detailed errors are the LSP's job |

The second row is the direct application of D2: the moment a lossless round trip cannot
be guaranteed, visual *editing* is withdrawn — visual *inspection* may remain. This rule
also bounds the risk of the known TODOs in the PR #163 code generator (classical
registers, rotation angles): until the fixture suite (D8) proves a construct round-trips
losslessly, files containing it are treated as read-only rather than risking silent
corruption.

---

## 6. Sync design

This is the core of the extension and the area with the most pitfalls.

### Message protocol host ↔ webview

Kept deliberately small:

| Direction | Message | Meaning |
|---|---|---|
| Host → webview | `documentChanged { text, version }` | Document content changed (initially and on every text change) |
| Webview → host | `applyEdit { newText, baseVersion }` | A circuit edit should be applied to the document as a text change |
| Webview → host | `ready` | Webview is initialized; request initial state |
| Host → webview | `themeChanged { kind }` | VSCode theme switched (optional polish) |

### Loop prevention

The obvious trap: webview edit → document changes → `documentChanged` sent to the
webview → webview updates → … an endless loop or a destroyed editing state. Solution:
every change carries the document version (`TextDocument.version`, maintained by VSCode).
The host remembers the version produced by an `applyEdit` it applied itself and
suppresses the echo. The webview discards incoming `documentChanged` messages whose
version it caused.

### Direction: text → circuit

While typing, `onDidChangeTextDocument` fires on every keystroke. Updates are
**debounced** (initial value ~300 ms), then parsed. Outcomes and UI behavior follow the
table in section 5.

### Direction: circuit → text

A circuit edit (gate dropped, qubit added, …) produces the new QASM text via
`generate(circuit)` and sends it as `applyEdit`. The host applies it as a
`WorkspaceEdit`, which places the change in VSCode's undo history: **Ctrl+Z in the text
editor undoes a circuit edit.** This is exactly the desired behavior.

Improvement from phase 7 onward: instead of replacing the whole text, compute a diff
between old and new text and apply minimal edits. This preserves cursor positions in
text editors open in parallel and keeps undo steps small.

### Known limitation: file normalization

The `QasmCodeGenerator` from #163 regenerates the file completely, including its own
comments (`// Register …`, `// Layer n`). User comments and formatting are lost on a
circuit edit. For v1 this is a **consciously accepted limitation** — with a single,
clear warning on the first circuit edit in a file that contains user comments. The clean
solution (statement-based patching that only touches changed lines) is noted as a later
improvement and blocks nothing. Note that this limitation concerns *formatting*, not
*content* — D2 (no data loss of circuit-relevant content) still holds; the read-only rule
covers content the model cannot represent at all.

A property of #163 worth preserving: the code generator already emits operations in
canonical order so that `generate → parse → generate` is stable. This idempotence is the
foundation of the sync and is protected by the fixture suite (D8).

### Additional webview practicalities

* **One webview per document URI**, managed by the provider; no global state.
* **Lifecycle:** VSCode destroys invisible webviews. v1 uses
  `retainContextWhenHidden: true` (simple, somewhat memory-hungry); serialization is a
  later optimization. Since the state is reconstructible from the file anyway (D1), this
  is uncritical.
* **CSP & assets:** load resources only via `webview.asWebviewUri`; content security
  policy with a nonce; allow `wasm-unsafe-eval` for the later simulation.
* **Theming (polish):** VSCode injects `--vscode-*` CSS variables; the Tailwind theme can
  map onto them so the editor blends into dark/light themes.

---

## 7. Code inventory: reuse, refactor, drop, build

**Directly reusable** (moves into `packages/`): the DTO types (`api/dto/circuit.ts`,
`library.ts`), the complete circuit rendering (`QubitWires`, `QuantumOperationGrid`,
`DropzoneGrid`, drag-and-drop logic), the library rendering (`LibraryBoxView`,
`LibraryListView`), the ANTLR grammars (`.g4`), the simulation (`qulacsMapper` + worker),
and eventually the results charts.

**Reusable after targeted refactoring** — three clearly scoped changes that land as
regular PRs against `development` and improve the main project independently of VSCode
(testability, decoupling):

1. `circuitService.ts` → a **`CircuitPort` interface** with two implementations: a REST
   adapter (web IDE, today's behavior) and a local adapter (extension: mutates the
   in-memory model; persistence is the file).
2. `CircuitView` detaches from `ProjectContext`; the circuit source is injected via
   prop/context.
3. `LibraryView` receives the operation list as data instead of fetching
   `api.get('/api/operations')` itself.

**Not needed in VSCode:** `dockview` and the tab/panel management (VSCode owns layout),
the router, `ProjectContext` and the `editorstate` persistence from #163 (no project
concept), the entire frontend LSP stack including the backend WebSocket bridge (replaced
by `vscode-languageclient`), auth.

**To be written:** the extension host (provider, webview setup, protocol — roughly
300–500 lines), the LSP wiring (~50 lines plus binary distribution), the TS port of
visitor and code generator, and build configuration (a dedicated Vite entry for the
webview bundle, `esbuild` or similar for the host, VSIX packaging).

---

## 8. Repository structure

```
QuaK/
├── backend/                     # unchanged
├── frontend/                    # web IDE; will import from packages/
├── packages/
│   ├── circuit-core/            # DTOs, domain model, CircuitPort interface
│   ├── circuit-editor/          # CircuitView, LibraryView — backend-free
│   └── qasm-transform/          # ANTLR TS parser (generated from backend/src/main/antlr/*.g4),
│                                #   visitor, code generator, fixture tests
└── vscode-extension/
    ├── package.json             # extension manifest (contributes, activationEvents,
    │                            #   extensionKind: ["workspace"], no browser entry point)
    ├── src/
    │   ├── extension.ts         # activation, registration
    │   ├── circuitEditorProvider.ts
    │   ├── lspClient.ts
    │   └── webview/             # thin React bootstrap, imports from packages/
    └── syntaxes/qasm.tmLanguage.json   # TextMate grammar for syntax highlighting
```

Note on syntax highlighting: base colorization in VSCode uses TextMate grammars, not the
existing Monaco Monarch definition. The Monarch file serves as a reference; open TextMate
grammars for QASM exist as starting points. Semantic features (errors, hover, completion)
come from the LSP.

---

## 9. Phased plan

Each phase is independently completable and delivers value on its own. The riskiest
assumption (does the document sync work cleanly?) is validated first; the most expensive
investment (the TS port) comes last.

**Phase 0 — Adopt this document.** Team review, resolve the open questions (section 10),
derive issues.

**Phase 1 — Decoupling PRs in the main project.** The three refactorings from section 7,
coordinated with the #163 review (same files). *Done when:* the web IDE behaves
unchanged and `CircuitView`/`LibraryView` render in a test without a running backend.

**Phase 2 — Extension skeleton + sync spike (1–2 days).** Scaffold via `yo code`,
`CustomTextEditorProvider` registered, webview initially just mirrors the raw text.
*Done when:* a text edit appears in the webview, a webview "edit" lands in the document
via `WorkspaceEdit`, undo/redo and split view behave correctly, no echo loop.
**This is the project's go/no-go gate.**

**Phase 3 — LSP (quick win, independent).** `vscode-languageclient` + `qasmlsp` over
stdio; binary distribution resolved (D7). *Done when:* diagnostics/completion/hover work
in `.qasm` files on all three platforms.

**Phase 4 — Read-only circuit view (PoC transformation).** Webview bundle with the
decoupled `CircuitView`; QASM→circuit initially via `/parse` against a local development
backend (the temporary exception from D3). Debounce plus the three-state behavior from
section 5. *Done when:* typing in the text editor reliably updates the circuit
rendering, and unsupported constructs correctly trigger the read-only state.

**Phase 5 — `packages/qasm-transform` (TS port) + fixture suite.** ANTLR TS target from
the `.g4` files, port visitor/code generator, round-trip tests
(`parse → generate → parse` must be idempotent) over real QASM files; both
implementations (Java + TS) run against the same fixtures in CI. The suite also exposes
the open TODOs from #163 (classical registers, rotation angles). *Done when:* the
phase-4 state runs without a backend and CI checks both implementations.

**Phase 6 — Bidirectionality + library.** First as explicit commands ("QuaK: Update
circuit from code" / "QuaK: Write circuit to code" — analogous to the parse button in
#163), then live sync. Library drag-and-drop in the webview; the normalization warning
(section 6); read-only enforcement per D2. *Done when:* both directions are stable in
day-to-day use and the undo history remains sensible.

**Phase 7 — Results & release polish.** Results view with `qulacs-wasm` in the webview,
VSCode theming, minimal-diff text edits, VSIX pipeline in CI, marketplace listing
(publisher account, icon, README including the documented OpenQASM subset, telemetry
decision).

---

## 10. Open questions & risks

* **Auth on the new endpoints:** `POST /api/circuit/parse` and `/qasmCode` take no
  `Authentication` parameter, unlike the other circuit endpoints. Clarify whether this is
  intended (relevant independently of VSCode).
* **Round-trip gaps from #163:** TODOs for classical registers and rotation angles in
  the code generator. Close before phase 6 or handle via the D2 read-only rule; the
  fixture suite from phase 5 makes the actual coverage measurable.
* **`qasmlsp` distribution:** bundle per platform vs. download on activation; does a
  qasmtools marketplace extension already exist? Review the license.
* **Remote development / Codespaces:** deliberately untested initially (D4). Before a
  later "supported" claim: verify webview behavior over remote connections and binary
  provisioning on the workspace host (linux-x64).
* **Visitor/codegen duplication (D8):** accepted risk, bounded by fixtures and
  convention. After the TS port has proven itself, decide whether it becomes
  authoritative for the web IDE as well.
* **Monorepo tooling:** npm workspaces vs. pnpm; check impact on existing
  CI/husky/lint-staged (small but real migration effort).

---

## 11. Summary in three sentences

The circuit editor and library are packaged as a webview inside a VSCode
CustomTextEditor in which the `.qasm` file is the only source of truth — nothing is
stored anywhere else, there is no server, and when lossless round-tripping cannot be
guaranteed the circuit view becomes read-only rather than ever risking data loss. Shared
code lives in `packages/` in the monorepo, so the extension automatically moves with the
main project; the only deliberate duplication is the transformation's visitor and code
generator (the ANTLR grammar remains a single source), protected by a shared fixture
test suite. The extension targets desktop VSCode only — vscode.dev is excluded because
its browser extension host cannot spawn the LSP process, while Codespaces support
remains a possible later addition.