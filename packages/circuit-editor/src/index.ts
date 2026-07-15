// @quak/circuit-editor - the circuit editor with its integrated gate library.
//
// Backend-free by construction: the host passes the circuit in, injects a
// CircuitPort for changes, and provides the theme tokens the styles reference.

export { CircuitView } from './circuit/CircuitView.tsx';
export { LibraryView } from './library/LibraryView.tsx';
export { CircuitDragProvider, useCircuitDrag } from './CircuitDragContext.tsx';
export { CircuitPortProvider, useCircuitPort } from './CircuitPortContext.tsx';
export * from './operations.ts';
export * from './types.ts';
