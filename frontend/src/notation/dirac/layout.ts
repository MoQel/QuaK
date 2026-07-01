import { CircuitResponse, ElementaryQuantumGateDto } from '@/api/dto/circuit.ts';

const COMPOSITION = String.raw` \cdot `;

export type Layout = 'inline' | 'layered';

/**
 * Groups the rendered operators per circuit layer, in reverse application order (last-applied
 * layer first). `renderOperation` turns one gate into its token; an empty token is dropped, and
 * empty layers are omitted. Shared by both Dirac mappers, which only differ in `renderOperation`.
 */
export function buildLayerGroups(
    circuit: CircuitResponse,
    renderOperation: (gate: ElementaryQuantumGateDto) => string,
): string[][] {
    const layerGroups: string[][] = [];

    for (let layerIdx = circuit.layers.length - 1; layerIdx >= 0; layerIdx--) {
        const operations = circuit.layers[layerIdx].quantumOperations;
        const tokens: string[] = [];

        for (let opIdx = operations.length - 1; opIdx >= 0; opIdx--) {
            const operation = operations[opIdx];

            if (operation.type !== 'ELEMENTARY_QUANTUM_GATE') continue;

            const token = renderOperation(operation);
            if (token) tokens.push(token);
        }

        if (tokens.length > 0) layerGroups.push(tokens);
    }

    return layerGroups;
}

/**
 * Joins the operator tokens (grouped per circuit layer) and the initial state into one Dirac
 * expression. `inline` renders a single product; `layered` breaks after each layer, wrapping the
 * layer in parentheses and continuing with a leading `\cdot` on the next line.
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

// A single, already-parenthesised factor (an unlabelled tensor token) needs no extra grouping.
function groupLayer(tokens: string[]): string {
    if (tokens.length === 1 && tokens[0].startsWith(String.raw`\left(`)) return tokens[0];

    return String.raw`\left(${tokens.join(COMPOSITION)}\right)`;
}
