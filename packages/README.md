# Shared packages

Code that both the web IDE (`frontend/`) and the VSCode extension (`vscode-extension/`) use.
Each package points straight at its TypeScript sources; there is no build step.

| Package | What goes in | May depend on |
|---|---|---|
| `@quak/circuit-core` | DTOs, gate types, the support matrix, pure circuit logic, notation mappers. No React, no DOM. | no other package |
| `@quak/ui` | Generic shadcn primitives. Nothing about circuits. | no other package |
| `@quak/circuit-editor` | The React circuit editor and its gate library. | circuit-core, ui |
| `@quak/qasm-transform` | OpenQASM ↔ circuit for the extension host. No UI. | circuit-core |

`npm run lint:boundaries` enforces these layers in CI. The architecture behind them is described in
[`docs/vscode/vscode-extension-architecture.md`](../docs/vscode/vscode-extension-architecture.md).

## Where does new code go?

- Only one host needs it → keep it in that host.
- Both hosts need it and it is pure logic or data → `circuit-core`.
- Both hosts need it and it is circuit UI → `circuit-editor`.
- A generic UI primitive → `ui`.
- Anything that needs the backend, the Redux store or VSCode stays in its host. The editor gets it
  injected: the circuit and its setter through `CircuitStoreProvider`, what the host can store
  through `CircuitCapabilitiesProvider`, data as props.

## Importing

| From | Import |
|---|---|
| `circuit-core` | `@quak/circuit-core`, `@quak/circuit-core/notation/quantikz`, `@quak/circuit-core/notation/dirac` |
| `ui` | `@quak/ui/<component>`, `@quak/ui/lib/utils` |
| `circuit-editor` | `@quak/circuit-editor`, `@quak/circuit-editor/editor.css` |
| `qasm-transform` | `@quak/qasm-transform` |

Inside a package, import relatively. Code that leaves `circuit-core`, `circuit-editor` or
`qasm-transform` goes through the package's `src/index.ts`; a new `ui` component needs an entry
under `exports` in `packages/ui/package.json`.

## Styling

The editor's CSS contract (the colour tokens a host defines, the `dark` variant) is at the top of
`circuit-editor/src/editor.css`. Each host imports that file once from its own stylesheet.

## The OpenQASM parser

`qasm-transform/src/generated/` is ANTLR output of the grammars in `backend/src/main/antlr/`.
Do not edit it by hand. After a grammar change, regenerate it and commit the result:

```bash
npm run generate --workspace=packages/qasm-transform
```

`npm run check:generated` fails in CI when the generated parser no longer matches the grammar.

## Tests and checks

Tests sit next to their code and run with the package's own vitest config.

```bash
npm run test:packages
```

```bash
npm run typecheck:packages
```

```bash
npm run lint:boundaries
```

A new package needs a `package.json` with a `typecheck` script, a `tsconfig.json` and, if it has
tests, a `test` script and a `vitest.config.ts`. The scripts above and the root vitest config pick it
up automatically. What it may depend on goes as a rule into `.dependency-cruiser.cjs`.
