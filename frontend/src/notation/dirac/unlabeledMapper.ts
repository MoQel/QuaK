import { CircuitResponse, ElementaryQuantumGateDto, getCircuitWidth } from '@/api/dto/circuit.ts';
import { buildWireIndex, WireIndex } from '@/lib/circuitIndex.ts';
import { gateSymbolLatex } from '@/notation/dirac/symbols.ts';
import { assembleDirac, buildLayerGroups, Layout } from '@/notation/dirac/layout.ts';

const COMPOSITION = String.raw` \cdot `;
const IDENTITY = 'I';
const SWAP = String.raw`\mathrm{SWAP}`;

interface Placement {
    start: number;
    span: number;
    symbol: string;
}

/**
 * Export a circuit as unlabelled Dirac notation: operators as tensor products with identities
 * (e.g. `I \otimes \mathrm{CNOT}`) applied to `\lvert 0\ldots0\rangle`.
 */
export function toUnlabeledDirac(circuit: CircuitResponse, layout: Layout = 'inline'): string {
    const numQubits = getCircuitWidth(circuit);
    if (numQubits === 0) return '';

    const wireIndex = buildWireIndex(circuit.registers, 'quantum');
    const layerGroups = buildLayerGroups(circuit, (gate) => renderGate(gate, numQubits, wireIndex));

    const ket = String.raw`\lvert ${'0'.repeat(numQubits)}\rangle`;

    return assembleDirac(layerGroups, ket, layout);
}

function renderGate(gate: ElementaryQuantumGateDto, numQubits: number, wireIndex: WireIndex): string {
    const symbol = gateSymbolLatex(gate);

    // Operand wires in the gate's order (controls first, then targets), never sorted.
    const wires = [...gate.controlQubits, ...gate.targetQubits]
        .map((selector) => wireIndex.getWireIndex(selector))
        .filter((wire): wire is number => wire !== undefined);

    if (wires.length === 0) return '';

    if (wires.length === 1) {
        return tensorFactor(numQubits, [{ start: wires[0], span: 1, symbol }]);
    }

    const base = Math.min(...wires);

    // Contiguous and already in ascending operand order → one clean tensor factor.
    const isContiguousBlock = wires.every((wire, index) => wire === base + index);
    if (isContiguousBlock) {
        return tensorFactor(numQubits, [{ start: base, span: wires.length, symbol }]);
    }

    return renderWithSwapConjugation(numQubits, wires, base, symbol);
}

/**
 * A gate on non-adjacent/out-of-order wires is written as `S^\dagger (I \otimes G \otimes I) S`,
 * where `S` routes the operands into the contiguous block `[base, base + k)` and cancels around it.
 */
function renderWithSwapConjugation(numQubits: number, wires: number[], base: number, symbol: string): string {
    const routing = routeOperandsToBlock(wires, numQubits, base);
    const swapFactor = (position: number) => tensorFactor(numQubits, [{ start: position, span: 2, symbol: SWAP }]);

    const block = tensorFactor(numQubits, [{ start: base, span: wires.length, symbol }]);
    const parts = [...routing.map(swapFactor), block, ...[...routing].reverse().map(swapFactor)];

    return parts.join(COMPOSITION);
}

/** Adjacent SWAPs (each given by its lower position) that bring the operands into `[base, base + k)`. */
function routeOperandsToBlock(wires: number[], numQubits: number, base: number): number[] {
    const target = new Array<number>(numQubits);
    wires.forEach((wire, index) => {
        target[base + index] = wire;
    });

    const operandSet = new Set(wires);
    const remaining: number[] = [];
    for (let wire = 0; wire < numQubits; wire++) {
        if (!operandSet.has(wire)) remaining.push(wire);
    }
    let remainingIdx = 0;
    for (let position = 0; position < numQubits; position++) {
        target[position] ??= remaining[remainingIdx++];
    }

    // Insertion sort into `target`; never disturbs already-placed positions.
    const arrangement = Array.from({ length: numQubits }, (_, index) => index);
    const swaps: number[] = [];
    for (let position = 0; position < numQubits; position++) {
        let current = arrangement.indexOf(target[position]);
        while (current > position) {
            swaps.push(current - 1);
            [arrangement[current - 1], arrangement[current]] = [arrangement[current], arrangement[current - 1]];
            current--;
        }
    }

    return swaps;
}

/** Builds `\left(f_0 \otimes ... \right)`, filling wires not covered by a placement with `I`. */
function tensorFactor(numQubits: number, placements: Placement[]): string {
    const placementByStart = new Map(placements.map((placement) => [placement.start, placement]));
    const entries: string[] = [];

    let wire = 0;
    while (wire < numQubits) {
        const placement = placementByStart.get(wire);
        if (placement) {
            entries.push(placement.symbol);
            wire += placement.span;
        } else {
            entries.push(IDENTITY);
            wire++;
        }
    }

    const tensorFactor = entries.join(String.raw` \otimes `);
    return String.raw`\left(${tensorFactor}\right)`;
}
