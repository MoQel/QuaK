import {QuantumGate} from "@/views/QuantumGate.tsx";

export type QuantumGatesInit = QuantumGate & {
    qubit : string
}

export const quantumGates: QuantumGatesInit[] = [

    {
        id: 'hadamard',
        type: 'H',
        qubit: 'q0',
    },
    {
        id: 'pauli-x',
        type: 'X',
        qubit: 'q1',
    },
    {
        id: 'pauli-y',
        type: 'Y',
        qubit: 'q1',
    },
    {
        id: 'pauli-z',
        type: 'Z',
        qubit: 'q1',
    },
    {
        id: 'pauli-y',
        type: 'Y',
        qubit: 'q2',
    },
    {
        id: 'pauli-z',
        type: 'Z',
        qubit: 'q2',
    },
    {
        id: 'pauli-y',
        type: 'Y',
        qubit: 'q3',
    },
    {
        id: 'pauli-z',
        type: 'Z',
        qubit: 'q3',
    },
    {
        id: 'hadamard',
        type: 'H',
        qubit: 'q3',
    },
    {
        id: 'pauli-x',
        type: 'X',
        qubit: 'q3',
    },
]