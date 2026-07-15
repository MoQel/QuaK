import type { OperationDefinitionResponse } from '@quak/circuit-core';
import operationDefinitions from '../../../backend/src/main/resources/operation-definitions.json';

// Bundled from the file the backend serves over /api/operations, so the two
// products cannot drift apart. TypeScript infers `string` for the symbols, hence
// the cast; library.test.ts checks the data really fits.
export const OPERATIONS = operationDefinitions as OperationDefinitionResponse[];
