import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    isQuantumRegister,
    RegisterResponse,
} from '@/api/dto/circuit.ts';
import { gateSymbol } from '@/notation/dirac/symbols.ts';
import { assembleDirac, buildLayerGroups, Layout } from '@/notation/dirac/layout.ts';

/**
 * Export a circuit as labelled Dirac notation.
 */
export function toLabeledDirac(circuit: CircuitResponse, layout: Layout = 'inline'): string {
    const resolveLabel = buildLabelResolver(circuit.registers);

    const ket = renderInitialState(circuit.registers, resolveLabel);
    if (!ket) return '';

    const layerGroups = buildLayerGroups(circuit, (gate) => renderOperator(gate, resolveLabel));

    return assembleDirac(layerGroups, ket, layout);
}

/**
 * Resolve a qubit selector to its labelled Dirac form.
 */
function buildLabelResolver(registers: RegisterResponse[]): (selector: ElementSelectorDto) => string {
    const nameById = new Map(registers.map((register) => [register.id, register.name]));

    return (selector) => {
        const name = nameById.get(selector.registerId) ?? selector.registerId;
        // Keep a single letter/digit italic; anything else goes through \text{} and must be escaped.
        const base = /^[a-zA-Z0-9]$/.test(name) ? name : String.raw`\text{${escapeLatexText(name)}}`;

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

// Escape the characters that are special inside a KaTeX \text{} group.
function escapeLatexText(value: string): string {
    return value
        .replaceAll('\\', String.raw`\textbackslash{}`)
        .replaceAll('{', String.raw`\{`)
        .replaceAll('}', String.raw`\}`)
        .replaceAll('_', String.raw`\_`)
        .replaceAll('#', String.raw`\#`)
        .replaceAll('$', String.raw`\$`)
        .replaceAll('%', String.raw`\%`)
        .replaceAll('&', String.raw`\&`);
}
