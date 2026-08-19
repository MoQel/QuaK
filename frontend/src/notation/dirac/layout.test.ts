import { describe, it, expect } from 'vitest';
import { assembleDirac } from './layout.ts';

describe('assembleDirac', () => {
    it('joins everything into a single product for the inline layout', () => {
        const result = assembleDirac([['A', 'B'], ['C'], ['D', 'E', 'F']], 'K', 'inline');

        expect(result).toBe(String.raw`A \cdot B \cdot C \cdot D \cdot E \cdot F \cdot K`);
    });

    it('breaks after each layer for the layered layout', () => {
        const result = assembleDirac([['A', 'B'], ['C'], ['D', 'E', 'F']], 'K', 'layered');

        expect(result).toBe(
            [
                '\\begin{aligned}',
                String.raw`& \left(A \cdot B\right) \\`,
                String.raw`& \cdot \left(C\right) \\`,
                String.raw`& \cdot \left(D \cdot E \cdot F\right) \\`,
                String.raw`& \cdot K`,
                '\\end{aligned}',
            ].join('\n'),
        );
    });

    it('renders just the ket when there are no operators', () => {
        expect(assembleDirac([], 'K', 'inline')).toBe('K');
        expect(assembleDirac([], 'K', 'layered')).toBe('\\begin{aligned}\n& K\n\\end{aligned}');
    });
});
