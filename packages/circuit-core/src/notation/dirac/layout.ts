import { CircuitResponse, ElementaryQuantumGateDto } from '../../dto/circuit.ts';

const COMPOSITION = String.raw` \cdot `;

export type Layout = 'inline' | 'layered';

/**
 * Builds operator groups from last layer to first.
 * Empty gate tokens and empty layers are skipped.
 * `orderKey` sorts gates inside a layer for stable output.
 */
export function buildLayerGroups(
    circuit: CircuitResponse,
    renderOperation: (gate: ElementaryQuantumGateDto) => string,
    orderKey?: (gate: ElementaryQuantumGateDto) => number,
): string[][] {
    const layerGroups: string[][] = [];

    for (let layerIdx = circuit.layers.length - 1; layerIdx >= 0; layerIdx--) {
        const gates = circuit.layers[layerIdx].quantumOperations.filter(
            (operation): operation is ElementaryQuantumGateDto => operation.type === 'ELEMENTARY_QUANTUM_GATE',
        );

        if (orderKey) gates.sort((a, b) => orderKey(a) - orderKey(b));

        const tokens = gates.map(renderOperation).filter((token) => token.length > 0);

        if (tokens.length > 0) layerGroups.push(tokens);
    }

    return layerGroups;
}

/**
 * Builds the final Dirac product.
 * `inline` returns one line; `layered` returns an aligned block with one row per layer.
 */
export function assembleDirac(layerGroups: string[][], ket: string, layout: Layout): string {
    const groups = layerGroups.filter((tokens) => tokens.length > 0);

    if (layout === 'inline') {
        return [...groups.flat(), ket].join(COMPOSITION);
    }

    const lines = [...groups.map(groupLayer), ket];
    const rows = lines.map((line, index) => (index === 0 ? `& ${line}` : String.raw`& \cdot ${line}`));

    return `\\begin{aligned}\n${rows.join(' \\\\\n')}\n\\end{aligned}`;
}

// A single pre-grouped factor does not need another pair of parentheses.
function groupLayer(tokens: string[]): string {
    if (tokens.length === 1 && tokens[0].startsWith(String.raw`\left(`)) return tokens[0];

    return String.raw`\left(${tokens.join(COMPOSITION)}\right)`;
}
