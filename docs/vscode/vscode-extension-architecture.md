# QuaK VSCode Extension — Architecture

Orientation for developers picking up the extension. It covers what the extension is,
how it is put together and why the load-bearing decisions were made. The mechanics —
source layout, build commands, edit flow step by step — live in
[`vscode-extension/README.dev.md`](../../vscode-extension/README.dev.md); the Marketplace
text is `vscode-extension/README.md`.

---

## What it is

A user opens a `.qasm` file in VSCode and gets the normal text editor. One click on the
circuit icon in the editor title bar opens the same file as a circuit **beside** the
text, with the gate library attached, and it can be edited visually there. Both views
stay in sync, and the file remains an ordinary text document — save, undo, git and split
view keep working.

Opening beside rather than in place is the default on purpose: the circuit is a second
view of the file, and the pairing is what the editor is for. `Open With…` still works and
still replaces the text editor, for anyone who wants that.

The title bar carries one icon per direction, and the `when` clauses make them exclusive:
the circuit icon while a text editor is active, the source icon while the circuit editor
is. A custom editor has no text of its own to fall back on, so without the second one a
user who opened the circuit in place has no way back.

It is not a second QuaK. There are no projects, no accounts and no database in VSCode.
The circuit editor from the web IDE is repackaged; nothing more. Local simulation
(the Results view) is not part of it.

---

## Two runtimes, and why that matters

A VSCode extension is a Node.js program running in the **extension host** process. It
has the `vscode` API and the file system, and it may spawn processes.

Complex UI cannot be built from native editor widgets, so the circuit editor runs in a
**webview**: a sandboxed browser frame rendering our React bundle. Host and webview only
ever exchange messages; there is no shared memory. Two things follow from that. The
protocol between them has to be small and explicit, and **drag & drop across two
webviews is impossible** — which is the technical reason the gate library must be part
of the circuit editor component rather than a separate sidebar panel.

The integration point is a **CustomTextEditor**. The underlying `TextDocument` stays an
ordinary VSCode text document; our editor is only a view of it. Undo/redo, dirty state,
saving, hot exit and git diffs come for free. VSCode also allows several instances of
the same custom editor for one document, so the design has to tolerate that from the
start.

---

## The decisions made

**The `.qasm` file is the source of truth.** In the web IDE the circuit is the primary
artifact and the code is derived. Here it is inverted: the file is authoritative, the
circuit is a projection. There is no second persistent state — circuit edits go straight
into the document as text changes. Anything else would raise the question which version
wins, and would break undo and git.

**Lossless over visual.** The editor supports a subset of OpenQASM 3, and writing a
circuit back regenerates the whole file. A document may contain things regeneration
would destroy: unsupported constructs, but also user comments, which are content and not
formatting. The rule is absolute:

> Visual **editing** is only available for documents that regenerate losslessly.
> Everything else is read-only, with a notice explaining why. Text editing is never
> restricted.

This is enforced in the protocol, not only in the UI — the host rejects an edit against
a read-only document even if a webview asks for it. An extension that silently truncates
user files loses trust permanently, and a read-only view of a partially supported file
is still useful.

**No server.** The extension works offline. No backend, no login, no network call per
gate drop. Local child processes would be fine (that is how language servers work), but
today nothing of the sort is needed.

**The host owns both the document and its interpretation.** Parsing and code generation
run in the extension host, not in the webview. The host is the single authority: it
validates every incoming edit, applies it, and broadcasts the resulting state to all
panels of that document. The webview renders and does drag & drop; it never sees QASM
text. This keeps the authority over the document and the interpretation of the document
in one place, and keeps the parser out of the webview bundle.

**Monorepo.** The extension lives next to `frontend/` and `backend/`, sharing code
through `packages/`. The long-term risk is the extension drifting away from the web IDE;
a separate repository would encourage copying instead of sharing. Here, a PR that
changes the circuit editor changes both products, and CI turns red instead of the
Marketplace listing three months later.

**Desktop only.** Windows, macOS and Linux. vscode.dev is out of scope and stays out
until there is a reason: it would need a separate web build. Remote development and
Codespaces are untested rather than unsupported — the extension declares
`extensionKind: ["workspace"]`, which is where it would run there anyway.

---

## Document states

Every parse of the document yields one of four states, and the circuit view has to
distinguish them.

| State | Meaning | Behaviour |
|---|---|---|
| `editable` | Parses, every construct within the support matrix, no comments below the header | Circuit editing enabled, both directions in sync |
| `readOnly` | Syntax errors, unsupported constructs, or comments that regeneration would drop | Circuit renders where possible; writing is refused at the protocol level. A notice names the reason |
| `editableByChoice` | Only comments stood in the way and the user explicitly opted in | Editing enabled; the comments below the header are dropped on the next write |
| `failed` | The transform threw — a defect of ours, not a property of the file | Read-only, with a notice saying so. The stack goes to the QuaK output channel |

`editableByChoice` exists so that losslessness does not become a dead end. The opt-in is an
action the user takes, never a side effect of a gate drop. It is currently a button in
the webview notice and is remembered per document for the session.

---

## Host ↔ webview protocol

Defined in `vscode-extension/src/shared/protocol.ts`. Small on purpose.

| Direction | Message | Meaning |
|---|---|---|
| webview → host | `ready` | Webview mounted; the host answers with `documentChanged` |
| webview → host | `applyEdit { requestId, content, baseVersion }` | Please write this circuit, assuming the document is still at `baseVersion` |
| webview → host | `enableEditing` | Opt in to lossy editing for this document |
| webview → host | `webviewError { message, stack }` | The circuit editor crashed while rendering |
| host → webview | `documentChanged { circuit, version, state, classification }` | Authoritative state, broadcast to every panel of the URI |
| host → webview | `editApplied { requestId, version }` | The edit landed |
| host → webview | `editRejected { requestId, reason, currentVersion }` | `stale`, `readOnly` or `applyFailed` |

Arbitration is a pure function (`arbitration.ts`) so it can be tested without VSCode:
the edit must match the current document version and the document must be writable.
Which states are writable is defined once, in `protocol.ts`, and asked as a question —
so a state added later is refused until someone decides otherwise.
Rejected edits are not merged — the webview rebases on the next `documentChanged`. At
human interaction speed that is rare, and rejecting is always safe while merging is not.

Accepted edits are applied as a `WorkspaceEdit`, which is what puts them into VSCode's
undo history: Ctrl+Z in the text editor undoes a circuit edit.

---

## The QASM transformation

`packages/qasm-transform` turns OpenQASM 3 into the circuit model and back. It is a
TypeScript port of the backend's Java visitor and code generator, and it is generated
from **the same `.g4` grammars** in `backend/src/main/antlr/` — ANTLR has an official
TypeScript target, so the grammar stays a single source. `npm run check:generated` fails
when the generated parser falls behind the grammar it came from.

The port is the only real duplication in the project: transformation semantics now exist
in Java and in TypeScript, and anyone changing them has to touch both sides.

Two properties make the duplication and the read-only rule tractable:

**The visitor is strict.** Unlike the backend visitor, which walks past what it does not
understand, this one rejects it. Every construct is either handled or recorded as
unsupported with a line number and a reason. A transformation that silently drops a
statement is perfectly round-trip idempotent and still lossy — strictness is what closes
that gap.

**The support matrix is the single source.** `packages/circuit-core/src/support-matrix.ts`
lists which statements and gates round-trip. The visitor consults it, the tests assert
against it, and it decides which of the three document states a file lands in. It is also
where an unsupported construct's user-facing wording comes from.

---

## Shared packages

| Package | Contents | Depends on |
|---|---|---|
| `@quak/circuit-core` | DTOs, gate types, support matrix, quantikz export, angle formatting | nothing |
| `@quak/ui` | The shadcn primitives both hosts use | radix, tailwind |
| `@quak/circuit-editor` | The circuit editor with its integrated gate library | circuit-core, ui |
| `@quak/qasm-transform` | OpenQASM 3 ↔ circuit, for the extension only | antlr4ng |

The web IDE consumes these through re-export shims, so its import paths did not change.
The boundary is enforced by dependency-cruiser in CI: `packages/` must not import from
`frontend/`, imports must resolve, dependencies must be declared, no cycles.

The gate library is not fetched at runtime. `operation-definitions.json` is imported from
the backend resources at build time, so the definitions have one source and ship inside
the vsix.

---

## Language features

QuaK contributes a TextMate grammar and a language configuration, which covers
highlighting, comment toggling and bracket matching for `.qasm` files. On top of
that it publishes its own diagnostics — what the circuit editor cannot write back —
so a file explains itself in the Problems panel without the circuit view being open.

---

## Building and shipping

The host bundle is built with esbuild (`dist/extension.cjs`), the webview with Vite. The
webview is loaded through a CSP with a per-panel nonce and may only read from `dist/`.

CI runs on every push: lint, package boundaries, typechecks, unit tests, the
`@vscode/test-electron` integration tests under xvfb, the extension build, and packaging.
`check:vsix` inspects the produced archive and fails if sources, tests or secrets leak
into it — it once caught a configuration that would have shipped `.git` and `.env`.

There is no publish pipeline yet; it needs a Marketplace publisher account and a
`VSCE_PAT` secret.

---

## Where to look next

- `vscode-extension/README.dev.md` — source layout, edit flow, dev commands
- `vscode-extension/src/host/circuitEditorProvider.ts` — where document, parse and
  arbitration meet
- `packages/circuit-core/src/support-matrix.ts` — what the editor claims to support
- `backend/src/main/antlr/` — the grammars both parsers come from
