import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    isQuantumRegister,
    RegisterResponse,
} from '../../dto/circuit.ts';
import { gateSymbol } from './symbols.ts';
import { assembleDirac, buildLayerGroups, Layout } from './layout.ts';
import { buildWireIndex, getGateOperands, resolveWireIndices, WireIndex } from '../../lib/circuitIndex.ts';
import { escapeLatexText } from '../latex/escape.ts';

type LabelResolver = (selector: ElementSelectorDto) => string;

/**
 * Exports a circuit as labeled Dirac notation.
 */
export function toLabeledDirac(circuit: CircuitResponse, layout: Layout = 'inline'): string {
    const resolveLabel = buildLabelResolver(circuit.registers);

    const ket = renderInitialState(circuit.registers, resolveLabel);
    if (!ket) return '';

    const wireIndex = buildWireIndex(circuit.registers, 'quantum');
    const orderKey = (gate: ElementaryQuantumGateDto) => topmostWire(gate, wireIndex);

    const layerGroups = buildLayerGroups(circuit, (gate) => renderOperator(gate, resolveLabel), orderKey);

    return assembleDirac(layerGroups, ket, layout);
}

/**
 * Creates LaTeX labels for qubit selectors.
 */
function buildLabelResolver(registers: RegisterResponse[]): LabelResolver {
    const nameById = new Map(registers.map((register) => [register.id, register.name]));

    return (selector) => {
        const name = nameById.get(selector.registerId) ?? selector.registerId;
        // Keep one letter or digit italic. Escape longer names inside \text{}.
        const base = /^[a-zA-Z0-9]$/.test(name) ? name : String.raw`\text{${escapeLatexText(name)}}`;

        return `${base}_{${selector.index}}`;
    };
}

/**
 * Renders the all-zero initial state with qubit labels.
 */
function renderInitialState(registers: RegisterResponse[], resolveLabel: LabelResolver): string {
    const labels: string[] = [];

    for (const register of registers) {
        if (!isQuantumRegister(register)) continue;

        for (let index = 0; index < register.numberOfQubits; index++) {
            labels.push(resolveLabel({ registerId: register.id, index }));
        }
    }

    if (labels.length === 0) return '';

    return String.raw`\lvert ${'0'.repeat(labels.length)}\rangle_{${labels.join(' ')}}`;
}

function renderOperator(gate: ElementaryQuantumGateDto, resolveLabel: LabelResolver): string {
    const symbol = gateSymbol(gate);

    // Keep operand order: controls first, then targets.
    const labels = getGateOperands(gate).map(resolveLabel).join(' ');

    return `${symbol}_{${labels}}`;
}

// Used to order gates inside a layer.
function topmostWire(gate: ElementaryQuantumGateDto, wireIndex: WireIndex): number {
    const wires = resolveWireIndices(wireIndex, getGateOperands(gate));

    return wires.length > 0 ? Math.min(...wires) : Number.MAX_SAFE_INTEGER;
}
