import { ElementaryQuantumGateDto } from '@/api/dto/circuit.ts';
import { angleToLatex, resolveAngle } from '@/lib/quantumAngle.ts';

// Split so the dagger can be inserted between the name and a rotation's `\!\left(\theta\right)`.
export interface GateSymbol {
    base: string;
    suffix: string;
}

/**
 * Upright Dirac operator symbol without qubit labels or dagger, shared by both Dirac mappers.
 * X-type gates with controls are named by their controlled form (CNOT / CCNOT).
 */
export function gateSymbol(gate: ElementaryQuantumGateDto): GateSymbol {
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

        return { base: String.raw`\mathrm{R}_{${axis}}`, suffix: String.raw`\!\left(${angle}\right)` };
    }

    return { base: String.raw`\mathrm{${identifier}}`, suffix: '' };
}

/** Full upright symbol including the dagger (if inverse), but without qubit labels. */
export function gateSymbolLatex(gate: ElementaryQuantumGateDto): string {
    const { base, suffix } = gateSymbol(gate);
    const dagger = gate.inverseForm ? String.raw`^{\dagger}` : '';

    return `${base}${dagger}${suffix}`;
}
