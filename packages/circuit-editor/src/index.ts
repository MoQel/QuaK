// @quak/circuit-editor. The circuit editor with its integrated gate library.
//
// Backend-free by construction: the host supplies the circuit and a setter through
// CircuitStoreProvider, and provides the theme tokens the styles reference. What an
// edit means downstream (REST save, .qasm rewrite) is the host's business.

export { CircuitView } from './circuit/CircuitView.tsx';
export { CircuitToolbar } from './circuit/components/CircuitToolbar.tsx';
export { ElementaryQuantumGate } from './circuit/components/ElementaryQuantumGate.tsx';
export { LibraryView } from './library/LibraryView.tsx';
export { CircuitDragProvider, useCircuitDrag } from './CircuitDragContext.tsx';
export { CircuitWorkspaceShell } from './CircuitWorkspaceShell.tsx';
export { CircuitStoreProvider, useCircuitStore, type CircuitStore } from './CircuitStoreContext.tsx';
export { createCircuitMutations } from './circuitMutations.ts';
export { QuantikzExportButton, type LatexCodePreviewProps } from './notation/QuantikzExportButton.tsx';
export { useQuantikzExport, type ExportStatus } from './notation/useQuantikzExport.ts';
export * from './operations.ts';
export * from './types.ts';
