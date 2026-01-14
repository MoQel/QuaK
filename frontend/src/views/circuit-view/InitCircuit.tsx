import { QuantumGate } from "@/views/library-view/QuantumGate.ts";

export type QuantumGatesInit = QuantumGate & {
  qubit: number;
};

const emptyInfo = {
  operatorDefinition: "",
  truthTable: [],
  matrix: { display: "", rows: 0, cols: 0, computable: [] }
};

export const quantumGates: QuantumGatesInit[] = [
  {
    id: "h",
    name: "Hadamard",
    symbol: "H",
    type: "Hadamard",
    description: "Hadamard gate.",
    qubitCount: 1,
    qubit: 0,
    parameters: [],
    inspectorInfo: emptyInfo // Placeholder
  },
  {
    id: "x",
    name: "NOT",
    symbol: "X",
    type: "Classical",
    description: "Pauli-X gate (NOT gate).",
    qubitCount: 1,
    qubit: 1,
    parameters: [],
    inspectorInfo: emptyInfo
  },
  {
    id: "y",
    name: "Pauli-Y",
    symbol: "Y",
    type: "Quantum",
    description: "Pauli-Y gate.",
    qubitCount: 1,
    qubit: 1,
    parameters: [],
    inspectorInfo: emptyInfo
  },
  {
    id: "z",
    name: "Pauli-Z",
    symbol: "Z",
    type: "Quantum",
    description: "Pauli-Z gate.",
    qubitCount: 1,
    qubit: 1,
    parameters: [],
    inspectorInfo: emptyInfo
  }
];
