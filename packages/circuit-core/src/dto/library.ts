import type { OperationIdentifier } from '../gate-types.ts';

export interface OperationDefinitionResponse {
    id: string;
    name: string;
    symbol: OperationIdentifier;
    category: string;
    description: string;
    qubitCount: number;
    /** Present only for parametric gates. */
    parameters?: string[];
    inspectorInfo: InspectorInfoDto;
}

export interface InspectorInfoDto {
    /** LaTeX operator definition. */
    operatorDefinition: string;
    truthTable: TruthTableEntryDto[];
    matrix: MatrixInfoDto;
}

export interface TruthTableEntryDto {
    input: string;
    output: string;
}

export interface MatrixInfoDto {
    /** LaTeX matrix for display. */
    display: string;
    rows: number;
    cols: number;
    /** Matrix entries as computable string expressions. */
    computable: string[][];
}
