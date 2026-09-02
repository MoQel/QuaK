import { OperationIdentifier } from './operations.ts';

/** What a drag carries: a library element to add, or an operation already in the circuit to move. */
export type DragData =
    | { origin: 'library'; operationIdentifier: OperationIdentifier }
    | { origin: 'circuit'; operationIdentifier: OperationIdentifier; id: string };
