import { SubcircuitOption } from '@/views/library-view/util/subcircuits.ts';
import { CompositeQuantumGateDto, QuantumOperationDto, RegisterType } from '@/api/dto/circuit.ts';
import { GateIdentifier } from '@/lib/operations.ts';

export type RegisterSection = 'quantum' | 'classic';

export type UiLayer = {
    quantumOperations: UiQuantumOperation[];
};

export type UiQuantumOperation = QuantumOperationDto & {
    originalLayerIdx: number;
};

export type DragData = {
    origin: 'library' | 'circuit';
    /** A library gate's identifier, or a user-defined gate's own name when dragging a composite. */
    operationIdentifier: GateIdentifier;
    id?: string;
    /**
     * The gate to insert, when a user-defined one is dragged in from the library.
     *
     * A custom gate has no entry in the built-in catalogue, so nothing at the drop site could look
     * up its arity or its body — the template has to travel with the drag. Absent for built-ins and
     * for anything dragged within the circuit, where the operation is already there to be found.
     */
    composite?: CompositeQuantumGateDto;
    /**
     * The circuit to reference, when a subcircuit is dragged in from the library.
     *
     * Only the id, the name and the arity travel: unlike a custom gate a subcircuit has no body to
     * carry, because it lives in the circuit this points at.
     */
    subcircuit?: SubcircuitOption;
};

export type FlatQubit = {
    regId: string;
    regName: string;
    regIdx: number;
    relQubitIdx: number;
    absQubitIdx: number;
    regType: RegisterType;
    section: RegisterSection;
    headerY: number;
    registerSize: number;
    isCollapsed: boolean;
    visualY: number;
};

export type HoverPos = {
    qubitIdx: number;
    layerIdx: number;
};
