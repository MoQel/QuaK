import { OperationIdentifier } from './operations.ts';

export type DragData = {
    origin: 'library' | 'circuit';
    operationIdentifier: OperationIdentifier;
    id?: string;
};
