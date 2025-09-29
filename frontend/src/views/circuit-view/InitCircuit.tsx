import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";

export type QuantumGatesInit = QuantumGate & {
    qubit : number
}
// export const quantumGates: QuantumGate[][] = [
//     [
//         { id: "hadamard", type: "H" }
//     ],
//     [
//         {
//             id: 'pauli-x',
//             type: 'X',
//         },
//         {
//             id: 'pauli-y',
//             type: 'Y',
//         },
//         {
//             id: 'pauli-z',
//             type: 'Z',
//         },
//     ],
//     [
//         {
//             id: 'pauli-y',
//             type: 'Y',
//         },
//         {
//             id: 'pauli-z',
//             type: 'Z',
//         },
//     ],
//     [
//         {
//             id: 'pauli-y',
//             type: 'Y',
//         },
//         {
//             id: 'pauli-z',
//             type: 'Z',
//         },
//         {
//             id: 'hadamard',
//             type: 'H',
//         },
//         {
//             id: 'pauli-x',
//             type: 'X',
//         },
//     ],
//     [
//
//     ],
// ];
export const quantumGates: QuantumGatesInit[] = [

    {
        id: 'hadamard',
        type: 'H',
        qubit: 0,
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
        id: 'pauli-y',
        type: 'Y',
        qubit: 2,
    },
    {
        id: 'pauli-z',
        type: 'Z',
        qubit: 2,
    },
    {
        id: 'pauli-y',
        type: 'Y',
        qubit: 3,
    },
    {
        id: 'pauli-z',
        type: 'Z',
        qubit: 3,
    },
    {
        id: 'hadamard',
        type: 'H',
        qubit: 3,
    },
    {
        id: 'pauli-x',
        type: 'X',
        qubit: 3,
    },
]