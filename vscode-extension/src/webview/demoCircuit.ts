import type { CircuitResponse } from '@quak/circuit-core';

/**
 * A fixed circuit, so the editor can be rendered before the QASM transformation
 * exists. It is not derived from the open document yet — parsing the file is
 * what replaces this.
 */
export const DEMO_CIRCUIT: CircuitResponse = {
    id: 'demo',
    registers: [{ id: 'q', name: 'q', type: 'Quantum_Register', numberOfQubits: 3 }],
    layers: [
        {
            quantumOperations: [
                {
                    id: 'op-h',
                    type: 'ELEMENTARY_QUANTUM_GATE',
                    identifier: 'H',
                    inverseForm: false,
                    targetQubits: [{ registerId: 'q', index: 0 }],
                    controlQubits: [],
                    rotationAngle: 0,
                },
            ],
        },
        {
            quantumOperations: [
                {
                    id: 'op-cx',
                    type: 'ELEMENTARY_QUANTUM_GATE',
                    identifier: 'CX',
                    inverseForm: false,
                    targetQubits: [{ registerId: 'q', index: 1 }],
                    controlQubits: [{ registerId: 'q', index: 0 }],
                    rotationAngle: 0,
                },
            ],
        },
        {
            quantumOperations: [
                {
                    id: 'op-z',
                    type: 'ELEMENTARY_QUANTUM_GATE',
                    identifier: 'Z',
                    inverseForm: false,
                    targetQubits: [{ registerId: 'q', index: 2 }],
                    controlQubits: [],
                    rotationAngle: 0,
                },
            ],
        },
    ],
};
