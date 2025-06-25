import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";


export const quantumGates: QuantumGate[] = [
    {
        id: 'hadamard',
        type: 'H',
        qubits: 1,
    },
    {
        id: 'pauli-x',
        type: 'X',
        qubits: 1,
    },
    {
        id: 'pauli-y',
        type: 'Y',
        qubits: 1,
    },
    {
        id: 'pauli-z',
        type: 'Z',
        qubits: 1,
    },
    {
        id: 'cnot',
        type: 'CNOT',
        qubits: 2,
    },
    {
        id: 's-gate',
        type: 'S',
        qubits: 1,
    },
    {
        id: 't-gate',
        type: 'T',
        qubits: 1,
    },
    {
        id: 'measure',
        type: 'MEASURE',
        qubits: 1,
    }
]