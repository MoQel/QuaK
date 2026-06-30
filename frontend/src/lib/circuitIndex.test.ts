import { describe, it, expect } from 'vitest';
import { buildWireIndex } from './circuitIndex';
import { ClassicRegisterResponse, QuantumRegisterResponse, RegisterResponse } from '@/api/dto/circuit';

const quantumRegister = (id: string, numberOfQubits: number): QuantumRegisterResponse => ({
    id,
    name: id,
    type: 'Quantum_Register',
    numberOfQubits,
});

const classicRegister = (id: string, numberOfBits: number): ClassicRegisterResponse => ({
    id,
    name: id,
    type: 'Classic_Register',
    numberOfBits,
});

describe('buildWireIndex', () => {
    it('numbers wires consecutively in register order, then by local index', () => {
        const registers: RegisterResponse[] = [quantumRegister('q0', 2), quantumRegister('q1', 3)];

        const wireIndex = buildWireIndex(registers);

        expect(wireIndex.getWireIndex({ registerId: 'q0', index: 0 })).toBe(0);
        expect(wireIndex.getWireIndex({ registerId: 'q0', index: 1 })).toBe(1);
        expect(wireIndex.getWireIndex({ registerId: 'q1', index: 0 })).toBe(2);
        expect(wireIndex.getWireIndex({ registerId: 'q1', index: 1 })).toBe(3);
        expect(wireIndex.getWireIndex({ registerId: 'q1', index: 2 })).toBe(4);
    });

    it('returns undefined for selectors outside the indexed registers', () => {
        const wireIndex = buildWireIndex([quantumRegister('q0', 2)]);

        // Index beyond the register size.
        expect(wireIndex.getWireIndex({ registerId: 'q0', index: 2 })).toBeUndefined();
        // Unknown register id.
        expect(wireIndex.getWireIndex({ registerId: 'does-not-exist', index: 0 })).toBeUndefined();
    });

    it("includes classic registers in 'all' mode", () => {
        const registers: RegisterResponse[] = [quantumRegister('q0', 2), classicRegister('c0', 2)];

        const wireIndex = buildWireIndex(registers, 'all');

        expect(wireIndex.getWireIndex({ registerId: 'q0', index: 0 })).toBe(0);
        expect(wireIndex.getWireIndex({ registerId: 'q0', index: 1 })).toBe(1);
        expect(wireIndex.getWireIndex({ registerId: 'c0', index: 0 })).toBe(2);
        expect(wireIndex.getWireIndex({ registerId: 'c0', index: 1 })).toBe(3);
    });

    it("defaults to 'all' mode when no mode is passed", () => {
        const registers: RegisterResponse[] = [quantumRegister('q0', 1), classicRegister('c0', 1)];

        const wireIndex = buildWireIndex(registers);

        expect(wireIndex.getWireIndex({ registerId: 'c0', index: 0 })).toBe(1);
    });

    it("skips classic registers in 'quantum' mode and keeps quantum indices contiguous", () => {
        // Classic register sits between two quantum registers.
        const registers: RegisterResponse[] = [
            quantumRegister('q0', 2),
            classicRegister('c0', 4),
            quantumRegister('q1', 1),
        ];

        const wireIndex = buildWireIndex(registers, 'quantum');

        expect(wireIndex.getWireIndex({ registerId: 'q0', index: 0 })).toBe(0);
        expect(wireIndex.getWireIndex({ registerId: 'q0', index: 1 })).toBe(1);
        // q1 follows immediately after q0 — the classic register does not consume an index.
        expect(wireIndex.getWireIndex({ registerId: 'q1', index: 0 })).toBe(2);
        // Classic selectors are not indexed in quantum mode.
        expect(wireIndex.getWireIndex({ registerId: 'c0', index: 0 })).toBeUndefined();
    });

    it('returns undefined for every selector when there are no registers', () => {
        const wireIndex = buildWireIndex([]);

        expect(wireIndex.getWireIndex({ registerId: 'q0', index: 0 })).toBeUndefined();
    });
});
