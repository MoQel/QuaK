import { describe, expect, it } from 'vitest';
import { groupIntoComposite } from './groupIntoComposite.ts';
import { CircuitResponse, ElementaryQuantumGateDto, isCompositeGate, REGISTER_TYPE_QUANTUM } from '@quak/circuit-core';
import { FlatQubit } from './types.ts';

const flatQubits: FlatQubit[] = [
    {
        regId: 'r1',
        regName: 'q',
        regIdx: 0,
        relQubitIdx: 0,
        absQubitIdx: 0,
        regType: REGISTER_TYPE_QUANTUM,
        section: 'quantum',
        headerY: 0,
        registerSize: 2,
        isCollapsed: false,
        visualY: 0,
    },
    {
        regId: 'r1',
        regName: 'q',
        regIdx: 0,
        relQubitIdx: 1,
        absQubitIdx: 1,
        regType: REGISTER_TYPE_QUANTUM,
        section: 'quantum',
        headerY: 0,
        registerSize: 2,
        isCollapsed: false,
        visualY: 48,
    },
];

const makeH = (id: string, wire: number): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: 'H',
    rotationAngle: 0,
    inverseForm: false,
    targetQubits: [{ registerId: 'r1', index: wire }],
    controlQubits: [],
});

const makeCX = (id: string, control: number, target: number): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: 'CX',
    rotationAngle: 0,
    inverseForm: false,
    controlQubits: [{ registerId: 'r1', index: control }],
    targetQubits: [{ registerId: 'r1', index: target }],
});

describe('groupIntoComposite', () => {
    it('groups multiple operations into a composite gate', () => {
        const circuit: CircuitResponse = {
            id: 'c1',
            registers: [],
            layers: [{ quantumOperations: [makeH('op1', 0)] }, { quantumOperations: [makeCX('op2', 0, 1)] }],
            loopBlocks: [],
        };

        const result = groupIntoComposite(circuit, ['op1', 'op2'], 'bell_state', flatQubits);

        expect(result.layers[0].quantumOperations).toHaveLength(1);
        const comp = result.layers[0].quantumOperations[0];
        expect(isCompositeGate(comp)).toBe(true);
        if (isCompositeGate(comp)) {
            expect(comp.identifier).toBe('bell_state');
            expect(comp.targetQubits).toHaveLength(2);
            expect(comp.body).toHaveLength(2);
        }
        // second layer should now have no operations
        expect(result.layers[1].quantumOperations).toHaveLength(0);
    });

    it('updates enclosing loop block when grouped', () => {
        const circuit: CircuitResponse = {
            id: 'c1',
            registers: [],
            layers: [{ quantumOperations: [makeH('op1', 0)] }, { quantumOperations: [makeCX('op2', 0, 1)] }],
            loopBlocks: [{ id: 'loop1', repeatCount: 3, operationIds: ['op1', 'op2'] }],
        };

        const result = groupIntoComposite(circuit, ['op1', 'op2'], 'bell_loop', flatQubits);

        expect(result.loopBlocks).toHaveLength(1);
        const comp = result.layers[0].quantumOperations[0];
        expect(result.loopBlocks![0].operationIds).toEqual([comp.id]);
    });
});
