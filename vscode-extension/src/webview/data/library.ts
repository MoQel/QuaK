import type { OperationDefinitionResponse } from '@quak/circuit-core';
import operationDefinitions from '../../../../backend/src/main/resources/operation-definitions.json';

// Same operation definitions the backend serves over /api/operations.
// The test next to this file guards the cast.
export const OPERATIONS = operationDefinitions as OperationDefinitionResponse[];
