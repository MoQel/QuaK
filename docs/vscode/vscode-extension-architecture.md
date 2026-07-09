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
   (diagnostics, completion, hover).
3. In addition, the user can open the QuaK **Circuit Editor** (with the **Library**
   integrated per #168), which displays the same file graphically.
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
memory. Two consequences matter for this project: the protocol between host and webview
must be small and explicit (section 6), and **drag & drop across separate webviews does
not work** — webviews are isolated frames. This is a key technical reason why the
library must live *inside* the circuit editor component (#168) rather than in a separate
sidebar panel.

**CustomTextEditor.** VSCode provides an API to register a custom editor for a file type
(`registerCustomEditorProvider` with a `CustomTextEditorProvider`). The key property: the
underlying `TextDocument` remains an ordinary text document managed by VSCode. The custom
editor is only a *view* of it. Undo/redo, dirty tracking, saving, git diffs, and hot exit
come **for free** — none of it needs to be reimplemented. Users can open the same file in
the text editor and the circuit editor side by side (split view, "Open With…"), and
VSCode explicitly allows **multiple instances of the same custom editor** for one
document. The design must support this (section 6).

**Language Server Protocol (LSP).** VSCode is the native home of the LSP. Using the
`vscode-languageclient` npm package, an extension starts a language server as a local
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

### D2 — Lossless over visual: circuit editing requires full regenerability

The circuit editor supports a subset of OpenQASM 3 (no control flow, no `def`
subroutines, etc.), and the code generator produces canonical output. A file may
therefore contain content — unsupported language constructs, but also **user comments
and deliberate formatting** — that a circuit-edit-triggered regeneration would destroy.
User comments are content, not formatting. The binding rule:

> **Data loss is never acceptable. Visual *editing* is only available for documents that
> are fully regenerable** — meaning: every statement round-trips losslessly through the
> transformation *and* the document contains no user comments that regeneration would
> drop. For all other documents, the circuit view is **read-only** (visual *inspection*
> where feasible), with a visible notice explaining why. Text editing and LSP support
> always remain fully available.

An explicit, opt-in command — **"QuaK: Normalize file for visual editing"** — lets the
user convert a document into the canonical, fully regenerable form as a single,
deliberate, undoable action. Only after that does circuit editing unlock. There is no
"warn once, then overwrite" flow: normalization is always an action the user takes, never
a side effect of a gate drop.

*Rationale:* An extension that rewrites or truncates user files destroys trust
permanently and can corrupt work under version control. A read-only visualization of a
partially supported or comment-bearing file is still useful; a lossy round trip is not.
The opt-in normalization command resolves the tension between usability and fidelity
without ever making loss a side effect.

*Consequences:* The parser must distinguish three document states (section 5). The
webview needs an explicit read-only mode with a reason display and a path to the
normalize command. The supported subset must be captured in a **machine-readable support
matrix** (see D8) from which the README documentation is generated.

### D3 — No server dependency in the target state

The extension works fully offline. No QuaK backend, no database, no login. Everything it
needs ships with it or runs locally.

*Rationale:* An editor extension that requires a server for every gate edit is unusable
offline, adds network latency to every interaction, forces users to run infrastructure or
create an account, and couples every extension release to a server API version. Nothing
is gained in return — there is simply nothing that belongs on a server in this scenario.

*Scope of the rule:* "No server" means **no network or infrastructure dependency**. Local
child processes are explicitly fine — LSP servers run exactly this way in VSCode.

*Deliberate, temporary exception:* During the proof of concept (phase 4), the extension
may call the stateless endpoints `POST /api/circuit/parse` and
`POST /api/circuit/qasmCode` of a local development backend (endpoint paths verified
against the current #163 HEAD). This validates the sync mechanism before investing in
the TypeScript port of the transformation. It is scaffolding, not the target state.

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

*Rationale for excluding vscode.dev:* The LSP integration spawns a Go binary as a child
process — impossible in a browser extension host. Supporting vscode.dev would require a
separate web build of the extension and an alternative diagnostics story (e.g. the
language tooling compiled to WASM). That effort has no place in the first version.

*Rationale for keeping Codespaces open:* In Codespaces the extension would run on the
remote (Linux) workspace host, where spawning a linux-x64 LSP binary works. Feasible,
but it adds a test matrix (remote webview behavior, binary provisioning) that should not
burden the initial releases.

*Consequences:* Declare `"extensionKind": ["workspace"]` (the extension needs file access
and process spawning, which belong to the workspace side; on plain desktop installs this
is also simply the local host). Do **not** provide a `browser` entry point in
`package.json` — its absence is what keeps the extension cleanly out of vscode.dev.
Remote scenarios are documented as unsupported until explicitly tested. **Workspace
Trust:** custom editors and process spawning are restricted in untrusted workspaces; the
manifest must declare the extension's behavior (`capabilities.untrustedWorkspaces`),
expected: limited support — syntax highlighting only, no LSP process, no circuit editing.

### D5 — Monorepo, not a separate repository

The extension lives in the QuaK repository next to `frontend/` and `backend/`. Shared
code moves into `packages/` (details in section 8). The repository root already uses npm
workspaces (`workspaces: ["frontend"]`); the structure extends it rather than
introducing new tooling.

*Rationale:* The main long-term risk is the extension falling behind the main project. A
separate repository would encourage exactly that: components get copied instead of
shared, and drift is noticed late. In a monorepo, a PR that changes the circuit editor
changes both products at once. CI builds and tests the extension on every push — a
breaking change turns the PR red, not the marketplace listing three months later.

*Consequences:* Currency is automatic at the code level **as long as shared parts are
actually shared** (imports from `packages/`, never copy-paste) — which in turn requires
the enforced package boundary described in section 7. Additionally, a release pipeline
is needed once (a CI job that packages the VSIX on release and publishes it).

### D6 — CustomTextEditor as the integration mechanism

The circuit editor is registered as a `CustomTextEditorProvider` for `.qasm` files — in
addition to the regular text editor, not as a replacement (the text editor remains the
default).

*Rationale:* This API is built for exactly this scenario: a visual view of a text
document that coexists with the text editor, with persistence concerns handled by VSCode.
The alternative (a free-floating webview panel with manual file handling) would have to
solve undo, dirty state, and conflict handling itself — avoidable effort and avoidable
bugs.

### D7 — Native LSP; evaluate the existing `vscode-qasm` extension first

An official extension from the qasmtools author already exists on the marketplace:
`orangekame3.vscode-qasm` (Apache-2.0), advertising syntax highlighting, formatting,
semantic tokens, LSP-based diagnostics/linting. Microsoft's QDK extension has also added
OpenQASM support. The LSP decision is therefore no longer "how to bundle qasmlsp" but a
choice between three options, to be settled by a hands-on evaluation before phase 3:

1. **Extension dependency:** declare `orangekame3.vscode-qasm` as a dependency and ship
   no language tooling of our own. Cheapest, but feature coverage must be verified
   (completion maturity is unconfirmed) and QuaK takes a dependency on a third-party
   release cycle.
2. **Bundle our own:** start the `qasmlsp` binary via `vscode-languageclient` over
   stdio, distributed per platform (platform-specific VSIX or download on activation,
   platform/architecture matrix required: win-x64/arm64, darwin-x64/arm64,
   linux-x64/arm64). Full control, more distribution work.
3. **Deliberate coexistence:** ship no language features and document that users install
   a QASM language extension of their choice; the QuaK extension contributes only the
   circuit editor. Simplest, weakest out-of-the-box experience.

*In all three options*, QuaK's own frontend LSP stack and the backend WebSocket bridge
are not used in VSCode. Coexistence behavior (multiple installed QASM extensions
claiming the same file type) must be tested regardless of the chosen option.

### D8 — Transformation runs locally, via an ANTLR TypeScript port, with a strict losslessness contract

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

*The losslessness contract.* Round-trip idempotence (`parse → generate → parse`) alone is
**not sufficient evidence of losslessness**: an implementation that silently ignores a
construct in the visitor and never emits it in the generator is perfectly idempotent —
and still lossy. The transformation therefore must satisfy, verified in CI:

1. **Strict visitor:** every AST node type is either explicitly handled or explicitly
   marked unsupported, in which case the document is flagged "outside subset". No
   default fall-through that silently drops nodes.
2. **Positive fixtures:** real `.qasm` files with expected circuit structures (JSON);
   round-trip idempotence over all of them.
3. **Negative fixtures:** at least one fixture per unsupported construct, asserting that
   it is *detected* (triggers the read-only state) rather than dropped.
4. **Semantic source↔output comparison:** for supported documents, source and
   regenerated output must be semantically equivalent (same statements, not merely a
   stable output).
5. **Machine-readable support matrix:** a single data file listing each OpenQASM
   construct and its status (supported / detected-unsupported), consumed by the strict
   visitor, the test suite, and the README generation.

*The only real duplication in the project:* After the port, the visitor and the code
generator exist in Java (web IDE/backend) and TypeScript (extension). Anyone changing
transformation semantics must touch both sides. Safeguards: both implementations run
against the **same fixture suite** in CI (divergence turns the build red), and PRs that
change the transformation change both implementations and add fixtures.

*Long-term option (deliberately left open):* The TS implementation could later also
replace the backend parse/generate endpoints in the web IDE. The duplication would then
disappear again. This decision is deferred until the TS port has proven itself.

### D9 — Library integrated into the editor (#168), shipped as bundled data

Issue #168 makes the gate library a native part of the circuit editor component (layout
similar to the IBM Composer). For the extension this is not merely convenient but
**necessary**: drag & drop across separate webviews is impossible (section 2), so
library and circuit must share one component in one webview. The library's gate
definitions, currently fetched via `GET /api/operations`, ship with the extension as
JSON (ideally exported from the backend at build time so the source stays single). The
Results view is feasible — the simulation already runs client-side via `qulacs-wasm` in
a web worker, and webviews can execute WASM and workers — but it is deliberately
deferred to a later phase.

---

## 4. Architecture overview

```
┌─────────────────────────── VSCode (desktop) ──────────────────┐
│                                                               │
│  Text editor (native)     Circuit editor panels (1..n per doc)│
│  edits grover.qasm        CustomTextEditor webviews,          │
│        │                  React bundle incl. library (#168)   │
│        │                        │        ▲                    │
│        │                        │ postMessage (protocol v2)   │
│        ▼                        ▼        │                    │
│  ┌───────────────────────────────────────────────┐            │
│  │            Extension host (Node.js)           │            │
│  │                                               │            │
│  │  CustomTextEditorProvider                     │            │
│  │   • panel set per document URI                │            │
│  │   • listens to onDidChangeTextDocument        │            │
│  │   • validates + applies WorkspaceEdits        │            │
│  │   • broadcasts authoritative document state   │            │
│  │                                               │            │
│  │  Language features per D7 decision            │            │
│  │  (own LanguageClient ──stdio──► qasmlsp,      │            │
│  │   or extension dependency, or none)           │            │
│  └───────────────────────────────────────────────┘            │
│                        │                                      │
│                        ▼                                      │
│              TextDocument = grover.qasm                       │
│              (single source of truth)                         │
└───────────────────────────────────────────────────────────────┘

Inside each webview:  CircuitEditor incl. Library (from packages/circuit-editor)
                      parse()/generate()          (from packages/qasm-transform)
```

The transformation runs **inside the webview** (plain TypeScript without Node
dependencies). The extension host is the **single authority over the document**: it
validates every incoming edit, applies it, and broadcasts the resulting authoritative
state to *all* panels of that document. Responsibilities stay clear: host = document
lifecycle and arbitration, webview = rendering and domain logic.

---

## 5. Document states and the read-only rule (D2 in practice)

Evaluating a document yields one of three states, and the UI must distinguish all three:

| Document state | Circuit view behavior |
|---|---|
| **Fully regenerable:** valid, every statement within the support matrix, no user comments | Editable circuit, sync in both directions |
| **Valid but not fully regenerable:** unsupported constructs (control flow, `def`, non-standard includes, …) *or* user comments present | **Read-only** rendering of the supported parts where feasible, otherwise a clear "cannot be displayed" state. A visible notice names the reason (the unsupported construct, or "file contains comments"). For comment-only cases, the notice offers the **"Normalize file for visual editing"** command (explicit, undoable, unlocks editing). Circuit-to-text writing is disabled in this state — no exceptions. |
| **Syntactically invalid** (typical while typing) | Keep the last valid rendering with a subtle "view is out of date" indicator; detailed errors are the language tooling's job |

The second row is the direct application of D2. It also bounds the risk of the known
TODOs in the #163 code generator (classical registers, rotation angles): until the
fixture suite proves a construct round-trips losslessly, documents containing it are
treated as read-only rather than risking silent corruption. The support matrix (D8) is
the single source deciding which row a document lands in.

---

## 6. Sync design

This is the core of the extension and the area with the most pitfalls. The model: **the
extension host is the single authority; webviews are clients.** A document can have
multiple circuit editor panels open simultaneously (VSCode supports and recommends
this), so the design is broadcast-based from the start — there is no privileged
"originating" webview and no echo-suppression heuristics.

### Message protocol v2 (host ↔ webview)

| Direction | Message | Meaning |
|---|---|---|
| Webview → host | `ready` | Webview initialized; host responds with `documentChanged` |
| Host → webview(s) | `documentChanged { text, version, state }` | Authoritative document content; sent to **all** panels of the URI on every change, including changes caused by a panel's own edit. `state` is the document state from section 5. |
| Webview → host | `applyEdit { requestId, newText, baseVersion }` | Request to apply a circuit edit as a text change, based on document version `baseVersion` |
| Host → webview | `editApplied { requestId, version }` | The edit was applied; `version` is the resulting document version. The follow-up `documentChanged` with this version is the panel's own edit — used to preserve local UI state (selection, scroll) instead of a full reset. |
| Host → webview | `editRejected { requestId, reason, currentVersion }` | The edit was rejected (stale `baseVersion`, read-only state, or apply failure). The webview rebases on the next `documentChanged`. |
| Host → webview(s) | `themeChanged { kind }` | VSCode theme switched (optional polish) |

### Edit arbitration

The host validates every `applyEdit` strictly:

1. `baseVersion` must equal the current `TextDocument.version`. If not — because the
   user typed in the text editor or another panel edited in the meantime — the edit is
   rejected (`editRejected`, reason `stale`). The webview re-renders from the
   authoritative state and the user repeats the action. No merging is attempted in v1;
   with debounced parsing and human-speed interactions, stale edits are rare, and
   rejection is always safe while merging is not.
2. The document must be in the *fully regenerable* state (section 5); otherwise reject
   with reason `readOnly`. This enforces D2 at the protocol level, not merely in the UI.
3. On success, the host applies the `WorkspaceEdit`, answers `editApplied`, and the
   change lands in VSCode's undo history: **Ctrl+Z in the text editor undoes a circuit
   edit.**

There is deliberately no echo suppression: every panel always receives the authoritative
`documentChanged`, and panels reconcile their local state against it. This makes
multi-panel, split-view, and external-change scenarios one and the same code path.

### Direction: text → circuit

While typing, `onDidChangeTextDocument` fires on every keystroke. The host forwards the
change (`documentChanged`); the webview **debounces** parsing (initial value ~300 ms).
Outcomes and UI behavior follow the table in section 5.

### Direction: circuit → text

A circuit edit produces the new QASM text via `generate(circuit)` and sends `applyEdit`.
From phase 7 onward: compute a diff between old and new text and apply minimal edits
instead of replacing the whole text — preserves cursor positions in parallel text
editors and keeps undo steps small.

### Webview practicalities

* **Panel set per document URI**, managed by the provider; broadcast goes to the set.
* **Lifecycle:** VSCode destroys invisible webviews. Starting point:
  `retainContextWhenHidden: true` for implementation simplicity, with **memory usage
  measured during the spike**; if cost is significant, switch to state serialization —
  cheap here because the state is reconstructible from the file (D1).
* **CSP & assets:** load resources only via `webview.asWebviewUri`; content security
  policy with a nonce; allow `wasm-unsafe-eval` only once the simulation lands.
* **Theming (polish):** VSCode injects `--vscode-*` CSS variables; the Tailwind theme can
  map onto them so the editor blends into dark/light themes.

---

## 7. Frontend reuse: audit first, then boundary, then extraction

The circuit editor's coupling goes beyond `ProjectContext`: components reach into the
global Redux store (the root `package.json` even carries `@reduxjs/toolkit` /
`react-redux` as root dependencies), project-wide UI/CSS imports, and
`circuitService.ts` mixes REST calls, error presentation, and domain operations. Naming
three refactorings is therefore not enough; the reuse work is staged:

**Step 1 — Dependency audit.** Generate the actual import graph of
`CircuitView`/`LibraryView` outward (e.g. `dependency-cruiser`). Output: the honest list
of couplings (store slices, contexts, CSS, utilities) and the effort estimate for
cutting each.

**Step 2 — Define and enforce the package boundary.** Decide what
`packages/circuit-editor` may depend on (React, dnd-kit, `packages/circuit-core` — and
explicitly *not* `frontend/src`, the store, or the REST layer). Enforce it with tooling
(dependency-cruiser rules or ESLint import restrictions) so the boundary survives future
feature PRs.

**Step 3 — Reshape via #168.** Integrating the library into the circuit editor touches
exactly these components; the work is done *toward* the boundary: the integrated
library receives its operation list **as data (props)** rather than fetching
`/api/operations` itself, and the combined component gets the acceptance criterion
**"renders in a test without a running backend."** This makes #168 the first concrete
step of the decoupling rather than a detour.

**Step 4 — Remaining decoupling.** `circuitService.ts` → a **`CircuitPort` interface**
with a REST adapter (web IDE, unchanged behavior) and a local adapter (extension:
mutates the in-memory model; persistence is the file). `CircuitView` detaches from
`ProjectContext`/store; the circuit source is injected.

**Step 5 — Extraction.** Move the now-boundary-clean components into
`packages/circuit-editor` / `packages/circuit-core`. At this point extraction is a move,
not a rewrite.

**Directly reusable as-is:** the DTO types (`api/dto/circuit.ts`, `library.ts`), the
ANTLR grammars (`.g4`), the simulation (`qulacsMapper` + worker), eventually the results
charts.

**Not needed in VSCode:** `dockview` and tab/panel management (VSCode owns layout), the
router, `ProjectContext` and the `editorstate` persistence from #163, the entire
frontend LSP stack including the backend WebSocket bridge, auth.

**To be written:** the extension host (provider, protocol v2, panel management — roughly
400–600 lines), language feature wiring per the D7 decision, the TS port of visitor and
code generator, build configuration (a dedicated Vite entry for the webview bundle,
`esbuild` or similar for the host, VSIX packaging), and the test harness
(`@vscode/test-electron` integration tests, webview protocol tests, undo/redo and
conflict tests).

---

## 8. Repository structure

```
QuaK/
├── backend/                     # unchanged
├── frontend/                    # web IDE; will import from packages/
├── packages/
│   ├── circuit-core/            # DTOs, domain model, CircuitPort interface,
│   │                            #   support matrix (data file)
│   ├── circuit-editor/          # CircuitEditor incl. integrated library (#168) — backend-free
│   └── qasm-transform/          # ANTLR TS parser (generated from backend/src/main/antlr/*.g4),
│                                #   strict visitor, code generator, fixture suite
└── vscode-extension/
    ├── package.json             # extension manifest (contributes, activationEvents,
    │                            #   extensionKind: ["workspace"], untrustedWorkspaces,
    │                            #   no browser entry point)
    ├── src/
    │   ├── extension.ts         # activation, registration
    │   ├── circuitEditorProvider.ts   # panel sets, protocol v2, arbitration
    │   ├── languageFeatures.ts  # per D7 decision
    │   └── webview/             # thin React bootstrap, imports from packages/
    ├── src/test/                # @vscode/test-electron integration tests
    └── syntaxes/qasm.tmLanguage.json   # TextMate grammar (if D7 option 2 or 3)
```

Root npm workspaces already exist (`workspaces: ["frontend"]`) and are extended with
`packages/*` and `vscode-extension`.

Note on syntax highlighting: base colorization in VSCode uses TextMate grammars, not the
existing Monaco Monarch definition. The Monarch file serves as a reference; open TextMate
grammars for QASM exist as starting points. Semantic features come from the language
tooling chosen in D7.

---

## 9. Phased plan

Each phase is independently completable and delivers value on its own. The riskiest
assumption (does the document sync work cleanly, including multiple panels?) is
validated first; the most expensive investment (the TS port) comes last. **Gates are
explicit:** phases 5–7 are not started until their entry conditions hold.

**Phase 0 — Adopt this document.** Team review, resolve the open questions (section 10),
derive issues.

**Phase 1 — Audit, boundary, #168, decoupling.** Steps 1–4 from section 7, coordinated
with the #163 review (overlapping files). Order within the phase: audit → boundary
tooling → #168 → `CircuitPort`/context detachment. *Done when:* the web IDE behaves
unchanged, the integrated circuit editor (incl. library) renders in a test without a
running backend, and the boundary rules run in CI.

**Phase 2 — Extension skeleton + sync spike, with CI (2–4 days).** Scaffold via
`yo code`; `CustomTextEditorProvider` with protocol v2 and panel sets; the webview
initially just mirrors raw text. **CI from this phase on:** extension build +
`@vscode/test-electron` integration tests on every push, covering: text edit propagates
to all panels, `applyEdit` round trip, `editRejected` on stale `baseVersion`, undo/redo
after a webview edit, two panels of the same document stay consistent, memory
measurement for `retainContextWhenHidden`. *Done when:* all of the above pass in CI.
**This is the project's go/no-go gate.**

**Phase 3 — Language features (independent).** Hands-on evaluation of
`orangekame3.vscode-qasm` (actual diagnostics/completion/hover coverage), then the D7
decision (dependency / bundle / coexist) and its implementation, including the
platform/architecture matrix if bundling, and coexistence testing with other QASM
extensions (e.g. Microsoft QDK). *Done when:* the chosen option works on all target
platforms and the decision is recorded in this document.

**Phase 4 — Read-only circuit view (PoC transformation).** Webview bundle with the
phase-1 circuit editor; QASM→circuit initially via `POST /api/circuit/parse` against a
local development backend (the temporary exception from D3). Debounce plus the
three-state behavior from section 5, driven by a provisional support matrix. *Done
when:* typing in the text editor reliably updates the circuit rendering, and
unsupported constructs and user comments correctly trigger the read-only state.

**Phase 5 — `packages/qasm-transform` (TS port) + losslessness contract.** *Entry
condition: #163 merged or API-stable.* ANTLR TS target from the `.g4` files; port
visitor (strict, per D8) and code generator; implement the full contract from D8
(positive + negative fixtures, semantic comparison, support matrix); Java and TS run
against the same fixtures in CI. The suite makes the #163 TODOs (classical registers,
rotation angles) measurable. *Done when:* the phase-4 state runs without a backend and
CI verifies both implementations against the contract.

**Phase 6 — Bidirectional editing.** *Entry condition: phase 5 contract green.* First
as explicit commands ("QuaK: Update circuit from code" / "QuaK: Write circuit to code"),
then live sync. Circuit edits via protocol v2 arbitration; the "Normalize file for
visual editing" command; read-only enforcement at the protocol level per D2. *Done
when:* both directions are stable in day-to-day use, the undo history remains sensible,
and no fixture demonstrates content loss.

**Phase 7 — Results & release polish.** Results view with `qulacs-wasm` in the webview
(CSP extension for WASM), VSCode theming, minimal-diff text edits, VSIX release
pipeline, marketplace listing (publisher account, icon, README generated from the
support matrix, telemetry decision).

---

## 10. Open questions & risks

* **Auth on the new endpoints:** `POST /api/circuit/parse` and `/qasmCode` take no
  `Authentication` parameter, unlike the other circuit endpoints. Clarify whether this
  is intended (relevant independently of VSCode; feed into the #163 review).
* **Round-trip gaps from #163:** TODOs for classical registers and rotation angles in
  the code generator. The D8 contract makes coverage measurable; until proven, affected
  documents fall into the read-only state. Feed the strict-visitor requirement into the
  #163 review as well.
* **D7 evaluation outcome:** actual feature coverage of `orangekame3.vscode-qasm`
  (completion maturity unconfirmed) and the resulting decision. Coexistence with other
  QASM extensions (Microsoft QDK) needs testing regardless.
* **Stale-edit UX:** v1 rejects stale circuit edits instead of merging. Acceptable at
  human interaction speed; revisit if rejection turns out to be noticeable in practice.
* **Remote development / Codespaces:** deliberately untested initially (D4). Before a
  later "supported" claim: webview behavior over remote connections, binary
  provisioning on the workspace host (linux-x64/arm64).
* **Visitor/codegen duplication (D8):** accepted risk, bounded by the shared fixture
  contract and convention. After the TS port has proven itself, decide whether it
  becomes authoritative for the web IDE as well.
* **`retainContextWhenHidden` memory cost:** measured in phase 2; switch to
  serialization if significant.

---

## 11. Summary in three sentences

The circuit editor with its integrated library (#168) is packaged as a webview inside a
VSCode CustomTextEditor in which the `.qasm` file is the only source of truth — the
extension host arbitrates all edits and broadcasts the authoritative state to every open
panel, and visual editing is only ever enabled for documents proven fully regenerable;
everything else is read-only until the user explicitly opts into normalization, so data
loss is impossible by construction. Shared code lives in `packages/` in the monorepo
(extending the existing npm workspaces), so the extension automatically moves with the
main project; the only deliberate duplication is the transformation's visitor and code
generator (the ANTLR grammar remains a single source), held together by a strict,
CI-enforced losslessness contract rather than idempotence alone. The extension targets
desktop VSCode only — vscode.dev is excluded because its browser extension host cannot
spawn processes, Codespaces remains a possible later addition, and the language-feature
strategy (own LSP bundle vs. the existing `vscode-qasm` extension vs. coexistence) is
settled by a hands-on evaluation before phase 3.