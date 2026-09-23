import { describe, it, expect } from 'vitest';
import { toQuantikz, toStandaloneQuantikzDocument } from '@quak/circuit-core/notation/quantikz';
import type {
    CircuitResponse,
    ClassicRegisterResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    MeasurementDto,
    OperationIdentifier,
    QuantumOperationDto,
    QuantumRegisterResponse,
    RegisterResponse,
} from '@quak/circuit-core';

// fixture builders

const sel = (registerId: string, index: number): ElementSelectorDto => ({ registerId, index });

const qreg = (id: string, numberOfQubits: number): QuantumRegisterResponse => ({
    id,
    name: id,
    type: 'Quantum_Register',
    numberOfQubits,
});

const creg = (id: string, numberOfBits: number): ClassicRegisterResponse => ({
    id,
    name: id,
    type: 'Classic_Register',
    numberOfBits,
});

const gate = (
    identifier: OperationIdentifier,
    targetQubits: ElementSelectorDto[],
    opts: { controlQubits?: ElementSelectorDto[]; rotationAngle?: number } = {},
): ElementaryQuantumGateDto => ({
    id: `${identifier}-${targetQubits.map((selector) => selector.index).join('-')}`,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    targetQubits,
    controlQubits: opts.controlQubits ?? [],
    rotationAngle: opts.rotationAngle ?? 0,
});

const measurement = (targetQubits: ElementSelectorDto[], classicBits: ElementSelectorDto[]): MeasurementDto => ({
    id: 'measure',
    type: 'MEASUREMENT',
    identifier: 'MEASURE',
    inverseForm: false,
    targetQubits,
    controlQubits: [],
    classicBits,
});

const circuit = (registers: RegisterResponse[], layers: QuantumOperationDto[][]): CircuitResponse => ({
    id: 'c1',
    registers,
    layers: layers.map((quantumOperations) => ({ quantumOperations })),
});

// tests

describe('toQuantikz', () => {
    it('wraps a single gate in a quantikz environment with lstick labels', () => {
        const latex = toQuantikz(circuit([qreg('q', 1)], [[gate('H', [sel('q', 0)])]]));

        expect(latex).toContain(String.raw`\begin{quantikz}[wire types={q}]`);
        expect(latex).toContain(String.raw`\lstick{q[0]}`);
        expect(latex).toContain(String.raw`\gate{H}`);
        expect(latex).toContain(String.raw`\end{quantikz}`);
    });

    it('renders a controlled-X as a target with a control offset to the target wire', () => {
        // control on wire 0, target on wire 1 -> \ctrl{1} points down one wire.
        const latex = toQuantikz(
            circuit([qreg('q', 2)], [[gate('CX', [sel('q', 1)], { controlQubits: [sel('q', 0)] })]]),
        );

        expect(latex).toContain(String.raw`\targ{}`);
        expect(latex).toContain(String.raw`\ctrl{1}`);
    });

    it('renders a SWAP as a swap marker plus a targX on the connected wire', () => {
        const latex = toQuantikz(circuit([qreg('q', 2)], [[gate('SWAP', [sel('q', 0), sel('q', 1)])]]));

        expect(latex).toContain(String.raw`\swap{1}`);
        expect(latex).toContain(String.raw`\targX{}`);
    });

    it('formats a rotation angle as a symbolic pi fraction', () => {
        const latex = toQuantikz(
            circuit([qreg('q', 1)], [[gate('RX', [sel('q', 0)], { rotationAngle: Math.PI / 2 })]]),
        );

        expect(latex).toContain(String.raw`\gate{\ensuremath{R_X(\frac{\pi}{2})}}`);
    });

    it('renders a measurement as a meter on the measured wire and marks the classic wire type', () => {
        const latex = toQuantikz(circuit([qreg('q', 1), creg('c', 1)], [[measurement([sel('q', 0)], [sel('c', 0)])]]));

        expect(latex).toContain(String.raw`\meter{}`);
        expect(latex).toContain(String.raw`\begin{quantikz}[wire types={q,c}]`);
    });

    it('wires the meter to the bit the result is written to', () => {
        // One qubit, then one classic bit: the bit sits on the row below.
        const latex = toQuantikz(circuit([qreg('q', 1), creg('c', 1)], [[measurement([sel('q', 0)], [sel('c', 0)])]]));

        expect(latex).toContain(String.raw`\meter{} \wire[d][1]{c}`);
    });

    it('keeps two crossing measurements apart, which a bare meter cannot', () => {
        // q[0] writes to c[1] and q[1] writes to c[0]. Rows: q0=0, q1=1, c0=2, c1=3.
        const latex = toQuantikz(
            circuit(
                [qreg('q', 2), creg('c', 2)],
                [[measurement([sel('q', 0)], [sel('c', 1)]), measurement([sel('q', 1)], [sel('c', 0)])]],
            ),
        );

        expect(latex).toContain(String.raw`\meter{} \wire[d][3]{c}`);
        expect(latex).toContain(String.raw`\meter{} \wire[d][1]{c}`);
    });

    it('sends the wire upwards when the classic register is declared first', () => {
        const latex = toQuantikz(circuit([creg('c', 1), qreg('q', 1)], [[measurement([sel('q', 0)], [sel('c', 0)])]]));

        expect(latex).toContain(String.raw`\meter{} \wire[u][1]{c}`);
    });

    it('still meters a target that has no bit to write to', () => {
        const latex = toQuantikz(circuit([qreg('q', 1), creg('c', 1)], [[measurement([sel('q', 0)], [])]]));

        expect(latex).toContain(String.raw`\meter{}`);
        expect(latex).not.toContain(String.raw`\wire[`);
    });

    it('lays layers out as columns and wires as rows, with one trailing wire column', () => {
        const latex = toQuantikz(
            circuit(
                [qreg('q', 2)],
                [
                    [gate('H', [sel('q', 0)]), gate('X', [sel('q', 1)])],
                    [gate('CX', [sel('q', 1)], { controlQubits: [sel('q', 0)] })],
                ],
            ),
        );

        expect(latex).toBe(
            [
                String.raw`\begin{quantikz}[wire types={q,q}]`,
                String.raw`    \lstick{q[0]} & \gate{H} & \ctrl{1} &  \\`,
                String.raw`    \lstick{q[1]} & \gate{X} & \targ{} &  \\`,
                String.raw`\end{quantikz}`,
                '',
            ].join('\n'),
        );
    });

    it('draws a multi-target gate other than SWAP as nothing rather than as one of its targets', () => {
        const latex = toQuantikz(circuit([qreg('q', 2)], [[gate('H', [sel('q', 0), sel('q', 1)])]]));

        expect(latex).not.toContain(String.raw`\gate{H}`);
    });

    it('escapes LaTeX-special characters in register names', () => {
        const latex = toQuantikz(circuit([qreg('q_a', 1)], [[gate('H', [sel('q_a', 0)])]]));

        expect(latex).toContain(String.raw`\lstick{q\_a[0]}`);
    });
});

describe('toStandaloneQuantikzDocument', () => {
    it('wraps the circuit in a compilable standalone document', () => {
        const latex = toStandaloneQuantikzDocument(circuit([qreg('q', 1)], [[gate('H', [sel('q', 0)])]]));

        expect(latex).toContain(String.raw`\documentclass[tikz,border=2pt]{standalone}`);
        expect(latex).toContain(String.raw`\usetikzlibrary{quantikz2}`);
        expect(latex).toContain(String.raw`\begin{document}`);
        expect(latex).toContain(String.raw`\gate{H}`);
        expect(latex).toContain(String.raw`\end{document}`);
    });
});
