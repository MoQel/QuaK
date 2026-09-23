import { describe, expect, it } from 'vitest';
import { checkRegisterName } from '@quak/circuit-core';

// A register name is written into generated OpenQASM verbatim, so anything the
// grammar would not accept as an Identifier must be refused before it is created.
describe('checkRegisterName', () => {
    it.each(['q', 'q0', '_c', 'my_reg', 'Ψ'])('accepts %s', (name) => {
        expect(checkRegisterName(name)).toBeNull();
    });

    it.each([
        ['a name with spaces', 'my reg'],
        ['a leading digit', '2q'],
        ['punctuation', 'q-1'],
        ['a bracket, which would swallow the index', 'q[0]'],
        ['nothing at all', '   '],
    ])('refuses %s', (_label, name) => {
        expect(checkRegisterName(name)).not.toBeNull();
    });

    it.each(['qubit', 'bit', 'creg', 'measure', 'gate', 'OPENQASM'])('refuses the keyword %s', (name) => {
        expect(checkRegisterName(name)).toBe('reserved-keyword');
    });

    it('trims before judging, the way the register manager does', () => {
        expect(checkRegisterName('  q  ')).toBeNull();
    });
});
