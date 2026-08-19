import type { OperationDefinitionResponse } from '@quak/circuit-core';
import operationDefinitions from '../../../backend/src/main/resources/operation-definitions.json';

// Same operation definitions the backend serves over /api/operations.
// The test next to this file guards the cast.
export const OPERATIONS = operationDefinitions as OperationDefinitionResponse[];

/** By the identifier a gate call writes, e.g. `h` or `cx`. */
export const operationById = (id: string): OperationDefinitionResponse | undefined =>
    OPERATIONS.find((operation) => operation.id === id);
