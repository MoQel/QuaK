import { describe, expect, it } from 'vitest';
import { normalizeParsedCircuit } from './CircuitToolbar.tsx';
import type { CircuitResponse, SubcircuitOperationDto } from '@/api/dto/circuit.ts';

/**
 * Everything the parser produces goes through this before it reaches the circuit, so a field the
 * normalizer forgets is silently gone — and only surfaces wherever it is read next.
 */
describe('normalizeParsedCircuit', () => {
    const current: CircuitResponse = {
        id: 'c-1',
        registers: [{ id: 'r-1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }],
        layers: [],
    };

    const parsedWithSubcircuit = {
        registers: [{ id: 'r-parsed', name: 'q', numberOfQubits: 4 }],
        layers: [
            {
                quantumOperations: [
                    {
                        id: 'op-1',
                        type: 'SUBCIRCUIT_OPERATION',
                        inverseForm: false,
                        definitionCircuitId: 'referenced-circuit',
                        definitionName: 'Subcircuit.qasm',
                        targetQubits: [{ registerId: 'r-parsed', index: 0 }],
                        controlQubits: [],
                    },
                ],
            },
        ],
        loopBlocks: [{ id: 'b-1', repeatCount: 3, operationIds: ['op-1'] }],
    };

    it('keeps the circuit a subcircuit points at', () => {
        // Without this the operation kept its type but lost its reference, and the quantikz export
        // crashed the whole app on the next render reading definitionCircuitId.
        const result = normalizeParsedCircuit(parsedWithSubcircuit, current);
        const operation = result.layers[0].quantumOperations[0] as SubcircuitOperationDto;

        expect(operation.type).toBe('SUBCIRCUIT_OPERATION');
        expect(operation.definitionCircuitId).toBe('referenced-circuit');
        expect(operation.definitionName).toBe('Subcircuit.qasm');
    });

    it('carries the repetition frame over with it', () => {
        const result = normalizeParsedCircuit(parsedWithSubcircuit, current);

        expect(result.loopBlocks).toHaveLength(1);
        expect(result.loopBlocks?.[0].repeatCount).toBe(3);
    });

    it('still normalizes an elementary gate', () => {
        const result = normalizeParsedCircuit(
            {
                registers: [{ id: 'r-parsed', name: 'q', numberOfQubits: 4 }],
                layers: [
                    {
                        quantumOperations: [
                            {
                                id: 'h-1',
                                type: 'ELEMENTARY_QUANTUM_GATE',
                                identifier: 'H',
                                inverseForm: false,
                                targetQubits: [{ registerId: 'r-parsed', index: 0 }],
                                controlQubits: [],
                                rotationAngle: 0,
                            },
                        ],
                    },
                ],
            },
            current,
        );

        expect(result.layers[0].quantumOperations[0].identifier).toBe('H');
    });
});
