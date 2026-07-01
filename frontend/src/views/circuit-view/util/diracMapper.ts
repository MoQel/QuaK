import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    isQuantumRegister,
    RegisterResponse,
} from '@/api/dto/circuit.ts';
import { angleToLatex, resolveAngle } from '@/lib/quantumAngle.ts';

const COMPOSITION = String.raw` \cdot `;

interface GateSymbol {
    base: string;
    suffix: string;
}

/**
 * Export a circuit as labelled Dirac notation.
 */
export function toLabeledDirac(circuit: CircuitResponse): string {
    const resolveLabel = buildLabelResolver(circuit.registers);
    const tokens: string[] = [];

    // Reverse application order: the last gate is rendered first.
    for (let layerIdx = circuit.layers.length - 1; layerIdx >= 0; layerIdx--) {
        const operations = circuit.layers[layerIdx].quantumOperations;

        for (let opIdx = operations.length - 1; opIdx >= 0; opIdx--) {
            const operation = operations[opIdx];

            if (operation.type !== 'ELEMENTARY_QUANTUM_GATE') continue;
            tokens.push(renderOperator(operation, resolveLabel));
        }
    }

    const initialState = renderInitialState(circuit.registers, resolveLabel);
    if (initialState) tokens.push(initialState);

    return tokens.join(COMPOSITION);
}

/**
 * Resolve a qubit selector to its labelled Dirac form.
 */
function buildLabelResolver(registers: RegisterResponse[]): (selector: ElementSelectorDto) => string {
    const nameById = new Map(registers.map((register) => [register.id, register.name]));

    return (selector) => {
        const name = nameById.get(selector.registerId) ?? selector.registerId;
        const base = name.length === 1 ? name : String.raw`\text{${escapeLatexText(name)}}`;

        return `${base}_{${selector.index}}`;
    };
}

/**
 * Render |00...0⟩ with explicit qubit labels.
 */
function renderInitialState(
    registers: RegisterResponse[],
    resolveLabel: (selector: ElementSelectorDto) => string,
): string {
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

function renderOperator(
    gate: ElementaryQuantumGateDto,
    resolveLabel: (selector: ElementSelectorDto) => string,
): string {
    const { base, suffix } = gateSymbol(gate);
    const dagger = gate.inverseForm ? String.raw`^{\dagger}` : '';

    // Keep operand order: controls first, then targets.
    const labels = [...gate.controlQubits, ...gate.targetQubits].map(resolveLabel).join(' ');

    return `${base}${dagger}${suffix}_{${labels}}`;
}

/**
 * Map a gate to its Dirac symbol.
 */
function gateSymbol(gate: ElementaryQuantumGateDto): GateSymbol {
    const identifier = gate.identifier.toUpperCase();
    const controlCount = gate.controlQubits.length;

    if (identifier === 'X' || identifier === 'CX' || identifier === 'CCX') {
        if (controlCount === 1) return { base: String.raw`\mathrm{CNOT}`, suffix: '' };
        if (controlCount === 2) return { base: String.raw`\mathrm{CCNOT}`, suffix: '' };

        return { base: String.raw`\mathrm{X}`, suffix: '' };
    }

    if (identifier === 'CZ') return { base: String.raw`\mathrm{CZ}`, suffix: '' };
    if (identifier === 'SWAP') return { base: String.raw`\mathrm{SWAP}`, suffix: '' };

    if (identifier === 'RX' || identifier === 'RY' || identifier === 'RZ') {
        if (gate.rotationAngle === undefined || gate.rotationAngle === null) {
            return { base: String.raw`\mathrm{${identifier}}`, suffix: '' };
        }

        const axis = identifier[1].toLowerCase();
        const angle = angleToLatex(resolveAngle(gate.rotationAngle));

        return {
            base: String.raw`\mathrm{R}_{${axis}}`,
            suffix: String.raw`\!\left(${angle}\right)`,
        };
    }

    return { base: String.raw`\mathrm{${identifier}}`, suffix: '' };
}

function escapeLatexText(value: string): string {
    return value.replaceAll(/[\\{}]/g, String.raw`\$&`);
}
