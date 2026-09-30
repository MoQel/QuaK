// @quak/circuit-editor: the circuit editor with its gate library. The host supplies the circuit and its
// setter through CircuitStoreProvider, and the theme tokens listed in editor.css.

export { CircuitView } from './circuit/CircuitView.tsx';
export { CircuitToolbar } from './circuit/components/CircuitToolbar.tsx';
export { ElementaryQuantumGate } from './circuit/components/ElementaryQuantumGate.tsx';
export { LibraryView } from './library/LibraryView.tsx';
export { CircuitDragProvider, useCircuitDrag } from './CircuitDragContext.tsx';
export { CircuitWorkspaceShell } from './CircuitWorkspaceShell.tsx';
export { CircuitStoreProvider, useCircuitStore, type CircuitStore } from './CircuitStoreContext.tsx';
export {
    CircuitCapabilitiesProvider,
    useCircuitCapabilities,
    type CircuitCapabilities,
} from './CircuitCapabilitiesContext.tsx';
export { createCircuitMutations } from './circuitMutations.ts';
export { QuantikzExportButton, type LatexCodePreviewProps } from './notation/QuantikzExportButton.tsx';
export { useQuantikzExport, type ExportStatus } from './notation/useQuantikzExport.ts';
export * from './operations.ts';
export * from './types.ts';
export type { FlatQubit, HoverPos, RegisterSection, UiLayer, UiQuantumOperation } from './circuit/util/types.ts';
