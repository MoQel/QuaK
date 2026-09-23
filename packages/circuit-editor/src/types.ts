import type { CompositeQuantumGateDto, GateIdentifier, SubcircuitOption } from '@quak/circuit-core';

/** What a drag carries: a library element to add, or an operation already in the circuit to move. */
export type DragData =
    | {
          origin: 'library';
          /** A library gate's identifier, or a user-defined gate's own name when dragging a composite. */
          operationIdentifier: GateIdentifier;
          /**
           * The gate to insert, when a user-defined one is dragged in from the library.
           *
           * A custom gate has no entry in the built-in catalogue, so nothing at the drop site could look
           * up its arity or its body, so the template has to travel with the drag. Absent for built-ins.
           */
          composite?: CompositeQuantumGateDto;
          /**
           * The circuit to reference, when a subcircuit is dragged in from the library.
           *
           * Only the id, the name and the arity travel: unlike a custom gate a subcircuit has no body to
           * carry, because it lives in the circuit this points at.
           */
          subcircuit?: SubcircuitOption;
      }
    | {
          origin: 'circuit';
          operationIdentifier: GateIdentifier;
          id: string;
          composite?: never;
          subcircuit?: never;
      };
