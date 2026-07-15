import type { OperationIdentifier } from '../gate-types.ts';

export interface OperationDefinitionResponse {
    id: string;
    name: string;
    symbol: OperationIdentifier;
    category: string;
    description: string;
    qubitCount: number;
    /** Only the parametric gates have any: the backend omits this for the rest. */
    parameters?: string[];
    inspectorInfo: InspectorInfoDto;
}

export interface InspectorInfoDto {
    operatorDefinition: string; // LaTeX
    truthTable: TruthTableEntryDto[];
    matrix: MatrixInfoDto;
}

export interface TruthTableEntryDto {
    input: string;
    output: string;
}

export interface MatrixInfoDto {
    display: string; // LaTeX
    rows: number;
    cols: number;
    computable: string[][]; // Matrix as 2D Array of Strings
}
