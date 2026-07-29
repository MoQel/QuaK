import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    getRegisterSize,
    isQuantumRegister,
    MeasurementDto,
    QuantumOperationDto,
    RegisterResponse,
} from '@/api/dto/circuit.ts';
import { buildWireIndex, resolveWireIndices, WireIndex } from '@/lib/circuitIndex.ts';
import { angleToLatex, resolveAngle } from '@/lib/quantumAngle.ts';
import { escapeLatexText } from '@/notation/latex/escape.ts';

const ROTATION_GATES = new Set(['RX', 'RY', 'RZ']);
const TRAILING_COLUMNS = 1; // Keep trailing wire column so the rendered circuit does not end directly at the last gate.

/**
 * Exports a circuit using Quantikz2 syntax.
 */
export function toQuantikz(circuit: CircuitResponse): string {
    const wireIndex = buildWireIndex(circuit.registers);

    const grid = buildGrid(circuit.registers, circuit.layers.length + TRAILING_COLUMNS);

    const wireTypes = buildWireTypes(circuit.registers);

    for (const [layerIdx, layer] of circuit.layers.entries()) {
        for (const operation of layer.quantumOperations) {
            applyOperation(grid, wireIndex, operation, layerIdx);
        }
    }

    const rows = buildRows(circuit.registers, grid);

    return [
        String.raw`\begin{quantikz}[wire types={` + wireTypes.join(',') + '}]',

        ...rows.map((row) => `    ${row}`),

        String.raw`\end{quantikz}`,

        '',
    ].join('\n');
}

export function toStandaloneQuantikzDocument(circuit: CircuitResponse): string {
    return toStandaloneDocument(toQuantikz(circuit));
}

/**
 * Wraps Quantikz code in a minimal standalone LaTeX document.
 */
export function toStandaloneDocument(latexCode: string): string {
    return [
        String.raw`\documentclass[tikz,border=2pt]{standalone}`,
        String.raw`\usepackage{tikz}`,
        String.raw`\usetikzlibrary{quantikz2}`,
        '',
        String.raw`\begin{document}`,
        '',
        latexCode.trimEnd(),
        '',
        String.raw`\end{document}`,
        '',
    ].join('\n');
}

function buildGrid(registers: RegisterResponse[], totalLayers: number): string[][] {
    return registers.flatMap((register) =>
        Array.from({ length: getRegisterSize(register) }, () => new Array<string>(totalLayers).fill('')),
    );
}

function buildWireTypes(registers: RegisterResponse[]): string[] {
    return registers.flatMap((register) =>
        Array.from({ length: getRegisterSize(register) }, () => (isQuantumRegister(register) ? 'q' : 'c')),
    );
}

function applyOperation(
    grid: string[][],
    wireIndex: WireIndex,
    operation: QuantumOperationDto,
    layerIdx: number,
): void {
    if (operation.type === 'MEASUREMENT') {
        applyMeasurement(grid, wireIndex, operation, layerIdx);
        return;
    }

    if (operation.type === 'ELEMENTARY_QUANTUM_GATE') {
        applyElementaryGate(grid, wireIndex, operation, layerIdx);
    }
}

function buildRows(registers: RegisterResponse[], grid: string[][]): string[] {
    const rows: string[] = [];
    let wireIdx = 0;

    for (const register of registers) {
        const size = getRegisterSize(register);

        for (let i = 0; i < size; i++) {
            const lstick = buildLstick(register, i);
            rows.push(`${lstick} & ${grid[wireIdx].join(' & ')} \\\\`);
            wireIdx++;
        }
    }

    return rows;
}

function buildLstick(register: RegisterResponse, wireIndex: number): string {
    const registerName = escapeLatexText(register.name);

    return String.raw`\lstick{${registerName}[${wireIndex}]}`;
}

function applyMeasurement(grid: string[][], wireIndex: WireIndex, measurement: MeasurementDto, layerIdx: number): void {
    for (let i = 0; i < measurement.targetQubits.length; i++) {
        if (i >= measurement.classicBits.length) break;

        const wireIdx = wireIndex.getWireIndex(measurement.targetQubits[i]);

        if (wireIdx !== undefined) {
            grid[wireIdx][layerIdx] = String.raw`\meter{}`;
        }
    }
}

function applyElementaryGate(
    grid: string[][],
    wireIndex: WireIndex,
    gate: ElementaryQuantumGateDto,
    layerIdx: number,
): void {
    const identifier = gate.identifier.toUpperCase();
    const targetWires = resolveWireIndices(wireIndex, gate.targetQubits);

    // Only SWAP supports multiple targets.
    if (identifier !== 'SWAP' && targetWires.length !== 1) {
        return;
    }

    if (!targetWires.length) return;

    if (identifier === 'SWAP') {
        applySwapGate(grid, targetWires, layerIdx);
        return;
    }

    if (isControlledXGate(identifier, gate)) {
        applyControlledXGate(grid, wireIndex, gate, targetWires, layerIdx);
        return;
    }

    applyGate(grid, wireIndex, gate, targetWires, layerIdx);
}

function applySwapGate(grid: string[][], targetWires: number[], layerIdx: number): void {
    if (targetWires.length !== 2) return;

    const [topWire, bottomWire] = [...targetWires].sort((a, b) => a - b);

    // Quantikz draws SWAP with one swap marker and one target-X marker.
    grid[topWire][layerIdx] = String.raw`\swap{${bottomWire - topWire}}`;
    grid[bottomWire][layerIdx] = String.raw`\targX{}`;
}

function applyControlledXGate(
    grid: string[][],
    wireIndex: WireIndex,
    gate: ElementaryQuantumGateDto,
    targetWires: number[],
    layerIdx: number,
): void {
    for (const targetWire of targetWires) {
        grid[targetWire][layerIdx] = String.raw`\targ{}`;
    }

    applyControls(grid, wireIndex, gate, targetWires, layerIdx);
}

function applyGate(
    grid: string[][],
    wireIndex: WireIndex,
    gate: ElementaryQuantumGateDto,
    targetWires: number[],
    layerIdx: number,
): void {
    const label = gateLabel(gate);

    for (const targetWire of targetWires) {
        grid[targetWire][layerIdx] = String.raw`\gate{${label}}`;
    }

    applyControls(grid, wireIndex, gate, targetWires, layerIdx);
}

function applyControls(
    grid: string[][],
    wireIndex: WireIndex,
    gate: ElementaryQuantumGateDto,
    targetWires: number[],
    layerIdx: number,
): void {
    for (const control of gate.controlQubits ?? []) {
        const controlWire = wireIndex.getWireIndex(control);

        if (controlWire === undefined) continue;

        const targetWire = targetWires[0];
        grid[controlWire][layerIdx] = String.raw`\ctrl{${targetWire - controlWire}}`;
    }
}

function gateLabel(gate: ElementaryQuantumGateDto): string {
    const identifier = gate.identifier.toUpperCase();

    if (ROTATION_GATES.has(identifier)) {
        const axis = identifier[1];
        // Works when gate labels are handled in text or math mode.
        return String.raw`\ensuremath{R_${axis}(${angleToLatex(resolveAngle(gate.rotationAngle))})}`;
    }

    if (identifier === 'CZ') {
        return 'Z';
    }

    return identifier;
}

function isControlledXGate(identifier: string, gate: ElementaryQuantumGateDto): boolean {
    return ['X', 'CX', 'CCX'].includes(identifier) && Boolean(gate.controlQubits?.length);
}
