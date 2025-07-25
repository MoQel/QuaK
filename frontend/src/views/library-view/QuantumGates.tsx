import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";


export const quantumLibraryGates: QuantumGate[] = [
    {
        id: 'hadamard',
        type: 'H',
        qubit: 1,
    },
    {
        id: 'pauli-x',
        type: 'X',
        qubit: 1,
    },
    {
        id: 'pauli-y',
        type: 'Y',
        qubit: 1,
    },
    {
        id: 'pauli-z',
        type: 'Z',
        qubit: 1,
    },
    {
        id: 'cnot',
        type: 'CNOT',
        qubit: 2,
    },
    {
        id: 's-gate',
        type: 'S',
        qubit: 1,
    },
    {
        id: 't-gate',
        type: 'T',
        qubit: 1,
    },
    {
        id: 'measure',
        type: 'MEASURE',
        qubit: 1,
    }
]