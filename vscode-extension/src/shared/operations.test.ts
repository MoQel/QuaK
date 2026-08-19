import { describe, expect, it } from 'vitest';
import { OPERATIONS } from './operations.ts';

// Guards the cast in library.ts: the backend owns this data, we only bundle it.

const KNOWN_SYMBOLS = ['H', 'X', 'Y', 'Z', 'CX', 'CCX', 'CZ', 'SWAP', 'S', 'T', 'RX', 'RY', 'RZ', 'MEASURE', 'DUMMY'];

describe('the bundled gate library', () => {
    it('is not empty', () => {
        expect(OPERATIONS.length).toBeGreaterThan(0);
    });

    it('only uses symbols the editor can render', () => {
        const unknown = OPERATIONS.filter((o) => !KNOWN_SYMBOLS.includes(o.symbol));
        expect(unknown.map((o) => o.symbol)).toEqual([]);
    });

    it('has everything the DTO says is required', () => {
        for (const operation of OPERATIONS) {
            expect(operation.id, 'id').toBeTruthy();
            expect(operation.name, `name of ${operation.symbol}`).toBeTruthy();
            expect(operation.category, `category of ${operation.symbol}`).toBeTruthy();
            expect(typeof operation.qubitCount, `qubitCount of ${operation.symbol}`).toBe('number');
        }
    });

    it('carries the matrix the library tooltip renders', () => {
        for (const operation of OPERATIONS) {
            expect(operation.inspectorInfo?.matrix?.display, `matrix of ${operation.symbol}`).toBeTruthy();
        }
    });
});
