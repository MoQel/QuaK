import { OperationIdentifier } from '@/lib/operations.ts';

export type DragData = {
    origin: 'library' | 'circuit';
    operationIdentifier: OperationIdentifier;
    id?: string;
};
