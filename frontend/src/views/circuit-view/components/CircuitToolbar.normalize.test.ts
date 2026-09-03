import { describe, expect, it } from 'vitest';
import { normalizeParsedCircuit } from './CircuitToolbar.tsx';
import type { CircuitResponse, SubcircuitOperationDto } from '@/api/dto/circuit.ts';

const registers: CircuitResponse['registers'] = [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 3 }];

const current: CircuitResponse = { id: 'c1', registers, layers: [] };

describe('normalizeParsedCircuit', () => {
    /**
     * A subcircuit is nothing but its reference. Falling into the generic branch it kept its type
     * and lost the id, so it pointed nowhere -- the backend could not resolve it, the simulator had
     * no body to run, and the export tripped over the missing field.
     */
    it('keeps the circuit a subcircuit points at', () => {
        const parsed = {
            registers,
            layers: [
                {
                    quantumOperations: [
                        {
                            id: 'call-1',
                            type: 'SUBCIRCUIT_OPERATION',
                            identifier: 'Subcircuit.qasm',
                            definitionCircuitId: 'other-circuit',
                            definitionName: 'Subcircuit.qasm',
                            inverseForm: false,
                            targetQubits: [{ registerId: 'r1', index: 0 }],
                            controlQubits: [],
                        },
                    ],
                },
            ],
        };

        const normalized = normalizeParsedCircuit(parsed as never, current);
        const operation = normalized.layers[0].quantumOperations[0] as SubcircuitOperationDto;

        expect(operation.type).toBe('SUBCIRCUIT_OPERATION');
        expect(operation.definitionCircuitId).toBe('other-circuit');
        expect(operation.definitionName).toBe('Subcircuit.qasm');
    });

    /** The body keeps the circuit runnable until the next read refills it. */
    it('carries the resolved body over', () => {
        const parsed = {
            registers,
            layers: [
                {
                    quantumOperations: [
                        {
                            id: 'call-1',
                            type: 'SUBCIRCUIT_OPERATION',
                            identifier: 'Subcircuit.qasm',
                            definitionCircuitId: 'other-circuit',
                            inverseForm: false,
                            targetQubits: [{ registerId: 'r1', index: 0 }],
                            controlQubits: [],
                            body: [
                                {
                                    id: 'body-h',
                                    type: 'ELEMENTARY_QUANTUM_GATE',
                                    identifier: 'H',
                                    inverseForm: false,
                                    rotationAngle: 0,
                                    targetQubits: [{ registerId: 'r1', index: 0 }],
                                    controlQubits: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const normalized = normalizeParsedCircuit(parsed as never, current);
        const operation = normalized.layers[0].quantumOperations[0] as SubcircuitOperationDto;

        expect(operation.body).toHaveLength(1);
        expect(operation.body?.[0].identifier).toBe('H');
    });

    it('still normalizes an elementary gate', () => {
        const parsed = {
            registers,
            layers: [
                {
                    quantumOperations: [
                        {
                            type: 'ELEMENTARY_QUANTUM_GATE',
                            identifier: 'H',
                            targetQubits: [{ registerId: 'r1', index: 0 }],
                            controlQubits: [],
                        },
                    ],
                },
            ],
        };

        const normalized = normalizeParsedCircuit(parsed as never, current);
        const operation = normalized.layers[0].quantumOperations[0];

        expect(operation.type).toBe('ELEMENTARY_QUANTUM_GATE');
        expect(operation.identifier).toBe('H');
        expect(operation.id).toBeTruthy();
    });
});
