# Phase 1 — Frontend reuse: audit, boundary, extraction

> **Companion to** [`vscode-extension-architecture.md`](./vscode-extension-architecture.md) section 7.
> Tracks the concrete extraction of the circuit editor into shared `packages/`
> so the extension builds on backend-free building blocks (issue #167).

## Step 1 — Dependency audit (done)

Outward couplings of `frontend/src/views/circuit-workspace` (the circuit editor +
integrated library from #168):

| Coupling | Where | Resolution |
|---|---|---|
| REST layer `@/api/api.ts` + `sonner` | `circuit/util/circuitService.ts` (all mutations), `library/LibraryView.tsx` (`GET /api/operations`) | `CircuitPort` interface; REST adapter (web) / local adapter (extension). Library receives operations as **props**, not by fetching. |
| `ProjectContext` | `circuit/CircuitView.tsx` (`useProject().circuit/setCircuit`) | Inject the circuit source instead of pulling it from context. |
| Dockview panel `PanelDataContext` | `CircuitWorkspace.tsx` (`setSelectedOperation`) | Not needed in VSCode — inject the callback. |
| DTOs `@/api/dto/{circuit,library}.ts` | 25 + 6 files repo-wide | Move to `@quak/circuit-core` (reusable as-is). |
| Domain types + presentation `@/lib/operations.ts` | 7 files | **Split:** `OperationIdentifier` / `QuantumOperationType` → core; icon/color/`formClass` stay in the editor layer. |
| Misc | `theme.tsx` (LatexCodeBlock), `circuitIndex.ts` (quantikzMapper), `App.module.css`, `@/components/ui/*` (51 files) | Travel with the editor components in the later `circuit-editor` extraction. |

Two structural findings:
- `dto/circuit.ts` ↔ `lib/operations.ts` were **circularly** coupled, but only at
  type level (`OperationIdentifier`). Moving the type to core breaks the cycle.
- `operations.ts` is **not** pure TS (imports `react` + `lucide-react` for icon
  components) — hence the presentation split.

## Consumption strategy

The frontend is fully Vite-transpiled (`noEmit`, `moduleResolution: bundler`), so
shared packages are consumed **as raw TS source via an alias** — no build step:

- `@quak/circuit-core` → `packages/circuit-core/src` (vite alias + tsconfig paths).
- Moved files leave a **re-export shim** at their old path, so none of the 25/51
  existing importers change. New code (the extension) imports from
  `@quak/circuit-core` directly.

## Increment status

- [x] **circuit-core skeleton** — `packages/circuit-core` wired into root
  `workspaces: ["frontend", "packages/*"]`. Contains:
  - `gate-types.ts` — `OperationIdentifier`, `QuantumOperationType` (breaks the cycle).
  - `dto/circuit.ts`, `dto/library.ts` — moved; frontend keeps shims.
  - `port/CircuitPort.ts` — the mutation seam; `createCircuitService` is now typed
    `: CircuitPort` (REST adapter), proving the interface matches the existing surface.
  - `support-matrix.ts` — D8 skeleton (gates provisional until phase-5 fixtures).
  - Verified: `tsc -b`, `vite build`, and all 39 frontend tests pass unchanged.
- [x] **Boundary tooling** (Step 2) — `dependency-cruiser` (`.dependency-cruiser.cjs`)
  with rules `packages-not-to-frontend` (packages must not import `frontend/`),
  `not-to-unresolvable` (also catches the frontend-only `@/` alias in packages) and
  `no-circular`. Wired into: root `npm run lint:boundaries` (and `npm run lint`), the
  Husky pre-commit hook, and a new `boundaries` CI job in `test_and_build.yml` (the
  repo's first JS CI job). Verified: passes clean, exits non-zero on a deliberate
  violation. NOTE: there is still **no CI job for frontend typecheck/lint/tests** —
  a separate gap worth closing.
- [x] **Library as data** (Step 3) — `LibraryView` takes its operations as a prop;
  the `GET /api/operations` fetch moved up into `CircuitWorkspace` (the app shell).
- [x] **Context detach** (Step 4) — `CircuitView` takes `circuit`/`setCircuit` as
  props instead of `useProject`; `CircuitWorkspace` is now the frontend shell
  (`useProject` + operations fetch + `usePanelData`) and injects everything down.
  `CircuitView` and `LibraryView` render from plain props — covered by
  `backend-free-render.test.tsx`. Web IDE behavior unchanged; `tsc -b`, `vite build`
  and all 41 tests pass.

With this, Phase 1's done-criterion holds: web IDE unchanged, the editor (incl.
library) renders without a backend, and the boundary runs in CI. What remains is
deliberately deferred until there's a real second consumer to design against:

- **Full `CircuitPort` injection through the mutation path** — the mutating children
  (`CircuitToolbar`, `DropzoneGrid`, `QubitLabel`) still build the REST adapter via
  `createCircuitService`. Fine for the web IDE; the extension will inject a local
  adapter instead. Best designed against that adapter, not guessed now.
- **`packages/circuit-editor` extraction** — move the components only once the
  extension webview actually imports them (avoids premature displacement and forcing
  the `@/components/ui/*` / CSS-module share-vs-copy decision early).
