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

    // The hover lays the entries out as a grid, taking the column count from the first row.
    it('carries matrices that are rectangular and the size they claim', () => {
        for (const { symbol, inspectorInfo } of OPERATIONS) {
            const { rows, cols, computable } = inspectorInfo.matrix;

            expect(computable, `row count of ${symbol}`).toHaveLength(rows);
            for (const [index, row] of computable.entries()) {
                expect(row, `row ${index} of ${symbol}`).toHaveLength(cols);
            }
        }
    });
});
