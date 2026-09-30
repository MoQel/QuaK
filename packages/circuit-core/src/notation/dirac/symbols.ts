import { ElementaryQuantumGateDto } from '#dto/circuit.ts';
import { angleToLatex, resolveAngle } from '#quantumAngle.ts';

/**
 * Renders an upright Dirac operator symbol without qubit labels.
 * Controlled X gates are rendered as CNOT or CCNOT.
 */
export function gateSymbol(gate: ElementaryQuantumGateDto): string {
    const identifier = gate.identifier.toUpperCase();
    const controlCount = gate.controlQubits.length;

    if (identifier === 'X' || identifier === 'CX' || identifier === 'CCX') {
        if (controlCount === 1) return String.raw`\mathrm{CNOT}`;
        if (controlCount === 2) return String.raw`\mathrm{CCNOT}`;

        return String.raw`\mathrm{X}`;
    }

    if (identifier === 'CZ') return String.raw`\mathrm{CZ}`;
    if (identifier === 'SWAP') return String.raw`\mathrm{SWAP}`;

    if (identifier === 'RX' || identifier === 'RY' || identifier === 'RZ') {
        if (gate.rotationAngle === undefined || gate.rotationAngle === null) {
            return String.raw`\mathrm{${identifier}}`;
        }

        const axis = identifier[1].toLowerCase();
        const angle = angleToLatex(resolveAngle(gate.rotationAngle));

        return String.raw`\mathrm{R}_{${axis}}\!\left(${angle}\right)`;
    }

    return String.raw`\mathrm{${identifier}}`;
}
