# Merge with `development` + Transformation in the Extension — Plan

> Companion to [`status-and-next-steps.md`](./status-and-next-steps.md) (living state) and
> [`vscode-extension-architecture.md`](./vscode-extension-architecture.md) (the plan/decisions).
> Written after PR #163 (QASM↔circuit) and the multi-circuit work landed on `development`.

## Situation

`hiwi/167-…` is **30 ahead / 25 behind** `origin/development` (merge base `5e6196c6`).
`development` brought in:

- the **ANTLR transformation, Java-only**: `backend/src/main/antlr/*.g4`, `QasmCircuitVisitor`,
  `QasmService`, `QasmCodeGenerator` (+ Qiskit/Qrisp generators), exposed as
  `POST /api/circuit/parse` and `POST /api/circuit/qasmCode`;
- **multi-circuit tabs**: `CircuitTabsContext`, `useTabsPersistence`, `CircuitTabBar`,
  `EditorState` persistence in the backend;
- a **changed mutation model** in the circuit editor (see the key decision below);
- fixes to drop zones / operation identities (#119, #127) and rotation angles (`util/angle.ts`).

Only three files collide by path (`.gitignore`, `frontend/src/lib/operations.ts`,
`package-lock.json`). The real overlap is that `development` heavily edited exactly the files this
branch **moved** into `packages/circuit-editor` — git follows the renames, so the conflicts land in
the new paths.

## The one architectural insight from the merge

`development` moved circuit editing from *REST-call-per-action* to **pure local mutation of a
`CircuitResponse` plus a debounced full-circuit save**: `DropzoneGrid` now takes
`setCircuit: Dispatch<SetStateAction<CircuitResponse | undefined>>` and mutates in place;
persistence happens once, centrally, in `CircuitTabsContext` (`saveCircuitContent`).

That is *the same shape the extension needs* — and it makes our `CircuitPort` (8 imperative
RPC-ish methods: `addQubit`, `addQuantumOperation`, `moveQuantumOperation`, …) obsolete on both
sides. **Resolve the merge toward the new model**, not toward the old port:

```
CircuitStore (context, in @quak/circuit-editor)
  circuit:    CircuitResponse | undefined
  setCircuit: (updater) => void          // pure, synchronous, host-agnostic
```

- **Web IDE** injects `activeCircuit` / `setActiveCircuit` from `CircuitTabsContext`
  → debounced `PUT /api/circuit/{id}`.
- **Extension** injects the circuit parsed from the document, and a `setCircuit` that runs
  circuit→QASM and requests an `applyEdit` through protocol v2.

This collapses Phase 6 ("write edits back") into "implement one function", and it deletes an
abstraction rather than adding one. `circuitService.ts` (add/delete qubit, reset) becomes a pure
helper on `(circuit, setCircuit)` and moves into `@quak/circuit-editor` unchanged in spirit.

## Step 1 — Prepare (before touching the merge)

1. The working tree has untracked files that are **not** part of #167 —
   `frontend/src/views/inspector-view/DiracInspectorView.tsx`, `…/diracInspect.ts` (looks like
   #161 Dirac notation) and `test.qasm`. Move them out or commit them on their own branch; do not
   carry them through the merge.
2. `git branch backup/167-pre-merge` — a cheap escape hatch for a merge this size.
3. Merge, do **not** rebase: 30 commits replayed over these renames would hit the same conflicts
   repeatedly.

## Step 2 — The merge (mechanical part)

`git merge origin/development`. Measured conflict set, with the resolution rule
**"structure and wiring from us, logic and layout from `development`"**:

| File | Markers | Resolution |
|---|---|---|
| `.gitignore` | 3 | Union of both blocks (dev adds `/package-lock.json`, `/.claude/`, `CLAUDE.md`). |
| `package-lock.json` | 3 | Do not hand-merge. Take dev's, then `npm install` and commit the result. Note dev now gitignores it — clarify with the team whether the lockfile stays tracked; the JS CI job needs it. |
| `frontend/src/lib/operations.ts` | 3 | Keep our one-line re-export shim. Port dev's changes (`normalizeOperationIdentifier`, the unknown-identifier fallback, `hasRotationAngle` on RX/RY/RZ, the `ComponentType<{className?: string}>` tightening) into `packages/circuit-editor/src/operations.ts`. |
| `circuit-workspace/circuitService.ts` | 6 | Take dev's version wholesale (it gained `deleteQubit` re-indexing semantics), then move it to `@quak/circuit-editor` on top of `CircuitStore`. |
| `circuit/CircuitView.tsx` | 12 | Hardest. Dev's version calls `useCircuitTabs()` + `useSelector(state.dragOperation)` and renders `<CircuitTabBar />` inline. Keep our injected contexts (`CircuitStore`, `CircuitDragContext`) and our `toolbarStart` slot; take every `activeCircuit`-based computation from dev. Beware: most of dev's `activeCircuit` renames **auto-merged silently** into our prop-based file — read the whole file, not just the marked hunks. |
| `circuit/components/DropzoneGrid.tsx` | 18 | Take dev's drop logic verbatim (#119/#127 fixes); replace `useDispatch`/`stopOperationDrag` with our `useCircuitDrag()`, and `setCircuit` prop with `useCircuitStore()`. |
| `circuit/components/ElementaryQuantumGate.tsx` | 6 | Take dev's rotation-angle rendering; keep our imports. |
| `circuit/components/CircuitToolbar.tsx` | 6 | See step 3 — dev added backend coupling here. |
| `circuit/components/QuantumOperationGrid.tsx`, `QubitWires.tsx` | 3 each | Take dev's; fix import paths. |

Five files `development` added inside directories we renamed — git leaves them stranded or
misplaced, they must be placed by hand:

| File | Git left it at | Belongs at |
|---|---|---|
| `util/angle.ts` | `frontend/src/views/circuit-view/util/` | `packages/circuit-core/src/angle.ts` (pure; also wanted by quantikz and later by `qasm-transform`) |
| `util/angle.test.ts` | same | `frontend/…/circuit-workspace/` — `packages/` still has no test runner (same pattern as `quantikzMapper.test.ts`) |
| `util/circuitPersistence.ts` | same | `frontend/src/views/circuit-workspace/` — REST, web-IDE-only |
| `components/CircuitTabBar.tsx` | `circuit-workspace/notation/` (wrong) | `frontend/src/views/circuit-workspace/` — see step 3 |
| `components/ElementaryQuantumGate.test.tsx` | `circuit-workspace/notation/` (wrong) | `frontend/src/views/circuit-workspace/` |

## Step 3 — Keep the package backend-free (the part the merge cannot decide)

`development` put **backend coupling into two files we extracted**. Both need the slot pattern we
already built for `toolbarStart`:

- **`CircuitToolbar`** gained a "parse active editor" button using `apiRequest('/api/circuit/parse')`,
  `useActiveCode()` and `toast`. That is web-IDE-only. It stays in the frontend and is injected
  through the existing `start` slot, next to `QuantikzExportButton`. Same for `CodeToolbar`
  (generate code), which is already frontend-side.
- **`CircuitTabBar`** is multi-circuit tab management bound to `CircuitTabsContext` and the backend.
  Add a second slot to `CircuitView` (e.g. `header?: ReactNode`); the web IDE passes the tab bar,
  the extension passes nothing (one document = one circuit).

Dependency-cruiser should catch violations here — verify it actually fails if `@/api` sneaks into
`packages/` rather than assuming it.

## Step 4 — Green gates (definition of done for the merge commit)

In order, do not skip: `npm run lint` · boundaries · typecheck · frontend unit tests ·
extension unit tests · `@vscode/test-electron` integration tests · extension build ·
`check:vsix` · backend `./gradlew :test` (the merge touches no Java, but the CI job must pass) ·
**manual**: web IDE — parse/generate round trip, multi-circuit tabs, drag & drop; extension —
open a `.qasm`, editor + library render, quantikz export works.

Only after all of that is green: the follow-up commits (port collapse, slots) can be separate
commits on top, but the merge commit itself must compile and pass.

## Step 5 — Re-check the known drag bug

The drag-placeholder bug (gate dropped on another does not make room, dragged gate flickers;
extension only) sits in exactly the code `development` rewrote in #119 ("Stabilize Operation
Identities, Fix Drop Zones") and #127 ("Fix Gate Loss on Invalid Drop, Match Drop Position to Hover
Preview"). **Re-test it after the merge before investigating it** — it may be fixed, or it may have
changed shape. Do not port the old suspicion (the reverted memo-deps fix) forward.

---

# After the merge: the transformation in the extension

The transformation on `development` is **Java + REST**. The extension has no backend (D3), so the
port is unavoidable — but the merge confirmed D8's decisive lever:

**The `.g4` grammars are target-clean.** `OpenQASM3Lexer.g4` (264 lines) and `OpenQASM3Parser.g4`
(233 lines) contain no `@header`/`@members` and no embedded Java actions, on ANTLR 4.13.1.
The same files can generate a TypeScript parser via `antlr4ng-cli` — the grammar stays a single
source in the repo. Only the two Java classes need porting:
`QasmCircuitVisitor` (173 lines) and `QasmCodeGenerator` (237 lines).

**Phase 5 — `packages/qasm-transform`.** In this order, each step independently verifiable:

1. **Generator wiring — done, and the size risk is settled.** `antlr4ng-cli` (ANTLR 4.13,
   TypeScript target) generates from `backend/src/main/antlr/*.g4` into
   `packages/qasm-transform/src/generated/`. Both grammars generate without a single warning
   and the parser works: Bell pair, rotations with `pi/2` and `tau`, `ccx`/`swap` all parse
   with 0 syntax errors, malformed input reports 3.

   *Generated code is committed*, because the `js-checks` CI job is deliberately Node-only
   and generating would force a JDK into it. The hazard that creates — someone edits a `.g4`
   and the two parsers silently diverge — is covered by `npm run check:generated`, which
   hashes the grammars against a stamp written at generation time (Node-only, runs in CI,
   verified to fail on a one-line grammar edit).

   **Measured bundle cost** (real webview build, not an estimate): `webview.js` goes
   641 KB → 1011 KB minified, 201 KB → 287 KB gzipped, so **+370 KB / +86 KB compressed**.
   That is affordable — it lands roughly where KaTeX already sits, and ~86 KB on a vsix that
   is ~450 KB once the placeholder icon is fixed. No code-splitting needed: the parser is
   wanted immediately at webview startup, so lazy-loading would buy nothing.

   Worth knowing if size ever gets critical: that 370 KB carries the **full** OpenQASM 3
   grammar while the visitor supports a small subset of it. A trimmed grammar would cut it
   substantially — at the price of D8's single-source property, so not now.
2. **Port the visitor**, strict per D8: every AST node type either explicitly handled or explicitly
   marked unsupported — no silent fall-through.
3. **Port the code generator.** Watch the round-trip details already solved in Java: symbolic
   `tau`/`euler` emission (#146), rotation angles for rx/ry/rz, layer numbers in comments.
4. **The losslessness contract** (D8, items 1–5): positive fixtures, one negative fixture per
   unsupported construct, semantic source↔output comparison, machine-readable support matrix.
   **Java and TS run against the same fixture directory in CI** — that is the only thing keeping the
   two implementations from drifting. The existing `QasmTest.java` is the seed for the fixture set.

**Phase 6 — wire it into the extension.** With the `CircuitStore` from step 2 this is small:

- read direction: `documentChanged` → `parse(text)` → `setCircuit` (debounced), plus the three-state
  behaviour from §5 of the architecture doc (unsupported construct → read-only).
- write direction: `setCircuit` → `generate(circuit)` → `applyEdit` through protocol v2. The
  arbitration, undo and multi-panel broadcast already work.
- delete `demoCircuit.ts` / `NOOP_PORT`.

**Deliberately not now:** replacing the backend's Java parser with the TS one (D8 keeps this open,
decide after the TS port has proven itself), the Results view, and the publish pipeline
(needs a publisher account + `VSCE_PAT` from the team).
