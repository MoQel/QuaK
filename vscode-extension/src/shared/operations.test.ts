import { describe, expect, it } from 'vitest';
import { supportedGates } from '@quak/circuit-core';
import { OPERATIONS } from './operations.ts';

// Guards the cast in operations.ts: the backend owns this data, we only bundle it.

describe('the bundled gate library', () => {
    it('offers exactly the gates the editor can place: every supported gate call, plus measurement', () => {
        const offered = OPERATIONS.map((operation) => operation.symbol).sort();

        expect(offered).toEqual([...supportedGates(), 'MEASURE'].sort());
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
