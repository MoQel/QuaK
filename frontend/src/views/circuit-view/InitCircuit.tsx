import { QuantumGate } from "@/views/QuantumGate.tsx";

export type QuantumGatesInit = QuantumGate & {
  qubit: number;
};

export const quantumGates: QuantumGatesInit[] = [
  {
    name: "Hadamard",
    symbol: "H",
    type: "Hadamard",
    description: "Hadamard gate (creates superposition).",
    qubitCount: 1,
    qubit: 0,
  },
  {
    name: "NOT",
    symbol: "X",
    type: "Classical",
    description: "Pauli-X gate (NOT gate).",
    qubitCount: 1,
    qubit: 1,
  },
  {
    name: "Pauli-Y",
    symbol: "Y",
    type: "Quantum",
    description: "Pauli-Y gate.",
    qubitCount: 1,
    qubit: 1,
  },
  {
    name: "Pauli-Z",
    symbol: "Z",
    type: "Quantum",
    description: "Pauli-Z gate.",
    qubitCount: 1,
    qubit: 1,
  },
  {
    name: "Pauli-Y",
    symbol: "Y",
    type: "Quantum",
    description: "Pauli-Y gate.",
    qubitCount: 1,
    qubit: 2,
  },
  {
    name: "Pauli-Z",
    symbol: "Z",
    type: "Quantum",
    description: "Pauli-Z gate.",
    qubitCount: 1,
    qubit: 2,
  },
  {
    name: "Pauli-Y",
    symbol: "Y",
    type: "Quantum",
    description: "Pauli-Y gate.",
    qubitCount: 1,
    qubit: 3,
  },
  {
    name: "Pauli-Z",
    symbol: "Z",
    type: "Quantum",
    description: "Pauli-Z gate.",
    qubitCount: 1,
    qubit: 3,
  },
  {
    name: "Hadamard",
    symbol: "H",
    type: "Hadamard",
    description: "Hadamard gate (creates superposition).",
    qubitCount: 1,
    qubit: 3,
  },
  {
    name: "NOT",
    symbol: "X",
    type: "Classical",
    description: "Pauli-X gate (NOT gate).",
    qubitCount: 1,
    qubit: 3,
  },
];
