import type { OperationDefinitionResponse } from '@quak/circuit-core';
import operationDefinitions from '../../../backend/src/main/resources/operation-definitions.json';

// Same operation definitions the backend serves over /api/operations.
// The test next to this file guards the cast.
const ALL_OPERATIONS = operationDefinitions as OperationDefinitionResponse[];

/**
 * MEASURE is withheld from the extension's library: `@quak/qasm-transform`
 * neither reads `measure`/`creg` nor writes them, so a measurement placed here
 * would be dropped on the next write and would make the document read-only on
 * the next read. The web IDE offers it, because its backend stores both.
 */
export const OPERATIONS = ALL_OPERATIONS.filter((operation) => operation.id.toUpperCase() !== 'MEASURE');

/** By the identifier a gate call writes, e.g. `h` or `cx`. */
export const operationById = (id: string): OperationDefinitionResponse | undefined =>
    OPERATIONS.find((operation) => operation.id === id);
