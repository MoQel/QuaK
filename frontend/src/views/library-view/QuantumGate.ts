export interface QuantumGate {
    id: string;
    name: string;
    symbol: string;
    type: string;
    description: string;
    qubitCount: number;
    parameters: string[];
    inspectorInfo: InspectorInfo;
}

export interface InspectorInfo {
    operatorDefinition: string;
    truthTable: TruthTableEntry[];
    matrix: MatrixInfo;
}

export interface TruthTableEntry {
    input: string;
    output: string;
}

export interface MatrixInfo {
    display: string;
    rows: number;
    cols: number;
    computable: string[][];
}