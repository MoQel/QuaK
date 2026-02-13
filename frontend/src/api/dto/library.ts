import {OperationIdentifier} from '@/api/dto/OperationDefinition.ts'

export interface GateDefinitionResponse {
    id: OperationIdentifier;
    name: string;
    symbol: string;
    category: string;
    description: string;
    qubitCount: number;
    parameters: string[];
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