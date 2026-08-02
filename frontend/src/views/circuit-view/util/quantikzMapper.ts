import {
    CircuitResponse,
    CompositeQuantumGateDto,
    ElementaryQuantumGateDto,
    getRegisterSize,
    isQuantumRegister,
    MeasurementDto,
    QuantumOperationDto,
    RegisterResponse,
} from '@/api/dto/circuit.ts';
import { buildWireIndex, WireIndex } from '@/lib/circuitIndex.ts';
import { getLoopFrames, LoopFrame } from '@/views/circuit-view/util/loopFrames.ts';

const ROTATION_GATES = new Set(['RX', 'RY', 'RZ']);
const PI_FRACTION_DENOMINATORS = [1, 2, 3, 4, 6, 8, 12, 16];
const ANGLE_TOLERANCE = 1e-8;
const TRAILING_COLUMNS = 1; // Keep trailing wire column so the rendered circuit does not end directly at the last gate.

/**
 * Exports circuits using Quantikz2 syntax
 * (quantikz package v1.0+, loaded via \usetikzlibrary{quantikz2}).
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

    applyLoopFrames(grid, circuit);

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

/**
 * Draws the repetition frames as quantikz gate groups.
 *
 * `\gategroup` is attached to the top-left cell of the area it covers and takes the size in wires
 * and steps, which is exactly the bounding box a frame already is. Without this the exported LaTeX
 * would show the loop body once with nothing saying it repeats — the same silent loss the simulator
 * would suffer by ignoring frames.
 */
function applyLoopFrames(grid: string[][], circuit: CircuitResponse): void {
    for (const frame of getLoopFrames(circuit.layers, circuit.loopBlocks ?? [], circuit.registers)) {
        grid[frame.topWire][frame.firstColumn] += buildGateGroup(frame);
    }
}

function buildGateGroup(frame: LoopFrame): string {
    const wires = frame.bottomWire - frame.topWire + 1;
    const steps = frame.lastColumn - frame.firstColumn + 1;

    return (
        String.raw`\gategroup[${wires},steps=${steps},style={dashed,rounded corners},background,` +
        String.raw`label style={label position=below,anchor=north,yshift=-0.2cm}]{$\times ${frame.repeatCount}$}`
    );
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

    if (operation.type === 'COMPOSITE_QUANTUM_GATE') {
        applyCompositeGate(grid, wireIndex, operation, layerIdx);
        return;
    }

    if (operation.type === 'ELEMENTARY_QUANTUM_GATE') {
        applyElementaryGate(grid, wireIndex, operation, layerIdx);
    }
}

/**
 * A user-defined gate becomes one multi-wire box, mirroring how the editor draws it.
 *
 * Expanding it into its elementary gates instead would not work here: the whole body sits in a
 * single layer, so several gates would compete for the same grid cell and all but one would be
 * lost. `\gate[n]{...}` is placed on the topmost wire and quantikz draws it across the following
 * n-1 wires, which is why the spanned cells are left empty.
 */
function applyCompositeGate(
    grid: string[][],
    wireIndex: WireIndex,
    gate: CompositeQuantumGateDto,
    layerIdx: number,
): void {
    const wires = gate.targetQubits
        .map((qubit) => wireIndex.getWireIndex(qubit))
        .filter((wire): wire is number => wire !== undefined);

    if (wires.length === 0) return;

    const topWire = Math.min(...wires);
    const span = Math.max(...wires) - topWire + 1;
    // Gate names are user-chosen, so they need the same escaping as the register labels.
    const label = escapeLatexText(gate.identifier);

    grid[topWire][layerIdx] = span > 1 ? String.raw`\gate[${span}]{${label}}` : String.raw`\gate{${label}}`;
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
    const targetWires = getTargetWires(wireIndex, gate);

    // Do not allow multitarget gates
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

    // Quantikz draws SWAP as a swap marker plus a target-X marker on the connected wire.
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

function getTargetWires(wireIndex: WireIndex, gate: ElementaryQuantumGateDto): number[] {
    return gate.targetQubits
        .map((target) => wireIndex.getWireIndex(target))
        .filter((wireIdx): wireIdx is number => wireIdx !== undefined);
}

function gateLabel(gate: ElementaryQuantumGateDto): string {
    const identifier = gate.identifier.toUpperCase();

    if (ROTATION_GATES.has(identifier)) {
        const axis = identifier[1];
        // \ensuremath works with both quantikz versions where gate labels may be handled in text or math mode.
        return String.raw`\ensuremath{R_${axis}(${formatAngle(gate.rotationAngle)})}`;
    }

    if (identifier === 'CZ') {
        return 'Z';
    }

    return identifier;
}

function isControlledXGate(identifier: string, gate: ElementaryQuantumGateDto): boolean {
    return ['X', 'CX', 'CCX'].includes(identifier) && Boolean(gate.controlQubits?.length);
}

// Prefer symbolic π fractions for common rotation angles; fall back to a compact decimal.
function formatAngle(angle: number | null | undefined): string {
    if (angle === null || angle === undefined) {
        return '?';
    }

    if (Math.abs(angle) < ANGLE_TOLERANCE) {
        return '0';
    }

    const piRatio = angle / Math.PI;

    for (const denominator of PI_FRACTION_DENOMINATORS) {
        const numerator = Math.round(piRatio * denominator);

        if (numerator === 0) continue;

        if (Math.abs(piRatio - numerator / denominator) < ANGLE_TOLERANCE) {
            return formatPiFraction(numerator, denominator);
        }
    }

    return Number(angle.toFixed(2)).toString();
}

function formatPiFraction(numerator: number, denominator: number): string {
    const divisor = gcd(Math.abs(numerator), denominator);
    const reducedNumerator = numerator / divisor;
    const reducedDenominator = denominator / divisor;
    const sign = reducedNumerator < 0 ? '-' : '';
    const absNumerator = Math.abs(reducedNumerator);

    if (reducedDenominator === 1) {
        return absNumerator === 1 ? String.raw`${sign}\pi` : String.raw`${sign}${absNumerator}\pi`;
    }

    if (absNumerator === 1) {
        return String.raw`${sign}\frac{\pi}{${reducedDenominator}}`;
    }

    return String.raw`${sign}\frac{${absNumerator}\pi}{${reducedDenominator}}`;
}

function gcd(a: number, b: number): number {
    let x = a;
    let y = b;

    while (y !== 0) {
        [x, y] = [y, x % y];
    }

    return x || 1;
}

function escapeLatexText(value: string): string {
    return value
        .replaceAll('\\', String.raw`\textbackslash{}`)
        .replaceAll('&', String.raw`\&`)
        .replaceAll('%', String.raw`\%`)
        .replaceAll('$', String.raw`\$`)
        .replaceAll('#', String.raw`\#`)
        .replaceAll('_', String.raw`\_`)
        .replaceAll('{', String.raw`\{`)
        .replaceAll('}', String.raw`\}`)
        .replaceAll('~', String.raw`\textasciitilde{}`)
        .replaceAll('^', String.raw`\textasciicircum{}`);
}
