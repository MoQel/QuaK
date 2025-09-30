import {QuantumGatesInit} from "@/views/circuit-view/InitCircuit.tsx";


export const quantumLibraryGates: QuantumGatesInit[] = [
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
        id: 'cz',
        type: 'CZ',
        qubit: 2,
    },
    {
        id: 'swap',
        type: 'SWAP',
        qubit: 2,
    },
    {
        id: 'CCX',
        type: 'CCX',
        qubit: 3,
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
        id: 'rx',
        type: 'RX',
        qubit: 1,
    },
    {
        id: 'ry',
        type: 'RY',
        qubit: 1,
    },
    {
        id: 'rz',
        type: 'RZ',
        qubit: 1,
    },
    {
        id: 'measure',
        type: 'MEASURE',
        qubit: 1,
    }
]