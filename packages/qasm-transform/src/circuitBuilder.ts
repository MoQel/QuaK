import {
    getInvolvedSelectors,
    getSelectorKey,
    type LayerResponse,
    type QuantumOperationDto,
    type RegisterResponse,
} from '@quak/circuit-core';
import type { SourcePosition, SourceSpan } from './parseTree.ts';

/**
 * `invalid`: the document is wrong, no OpenQASM tool would accept it. `unsupported`: the document is fine, but this
 * editor cannot write it back.
 */
export type RejectionKind = 'invalid' | 'unsupported';

export interface QasmRejection {
    line: number;
    column: number;
    /** Grammar rule or gate name, for the support matrix. */
    construct: string;
    message: string;
    kind: RejectionKind;
}

const sharesQubit = (layer: LayerResponse, operation: QuantumOperationDto): boolean => {
    const used = new Set(
        layer.quantumOperations
            .flatMap((placed) => getInvolvedSelectors(placed))
            .map((selector) => getSelectorKey(selector)),
    );
    return getInvolvedSelectors(operation).some((selector) => used.has(getSelectorKey(selector)));
};

export class CircuitBuilder {
    readonly registers: RegisterResponse[] = [];
    readonly layers: LayerResponse[] = [];
    readonly unsupported: QasmRejection[] = [];
    readonly includes: string[] = [];

    constructor(
        private readonly source: string,
        private readonly continuedLayers: ReadonlySet<number>,
    ) {}

    /**
     * Opens a layer, unless these operations were written as part of the one before it. Operations of one statement
     * share a layer as long as they touch different qubits.
     */
    place(operations: QuantumOperationDto[], line: number): void {
        let layer = this.layers.at(-1);
        if (!layer || !this.continuedLayers.has(line)) layer = this.open();

        for (const [position, operation] of operations.entries()) {
            if (position > 0 && sharesQubit(layer, operation)) layer = this.open();
            layer.quantumOperations.push(operation);
        }
    }

    private open(): LayerResponse {
        const layer: LayerResponse = { quantumOperations: [] };
        this.layers.push(layer);
        return layer;
    }

    /**
     * What the user wrote for a construct, cut from the source: `getText()` walks a node's default channel, losing
     * every space and picking up invented tokens.
     */
    excerpt(ctx: SourceSpan): string {
        const from = ctx.start?.start ?? -1;
        const to = ctx.stop?.stop ?? -1;
        if (from < 0 || to < from) return '';

        return truncate(this.source.slice(from, to + 1).replaceAll(/\s+/g, ' '));
    }

    registerByName(name: string): RegisterResponse | undefined {
        return this.registers.find((register) => register.name === name);
    }

    /** Valid OpenQASM this editor cannot write back. */
    reject(ctx: SourcePosition, construct: string, message: string): void {
        this.push(ctx, construct, message, 'unsupported');
    }

    /** OpenQASM that is wrong, whatever tool reads it. */
    invalid(ctx: SourcePosition, construct: string, message: string): void {
        this.push(ctx, construct, message, 'invalid');
    }

    private push(ctx: SourcePosition, construct: string, message: string, kind: RejectionKind): void {
        this.unsupported.push({
            line: ctx.start?.line ?? 0,
            column: ctx.start?.column ?? 0,
            construct,
            message,
            kind,
        });
    }
}

const truncate = (text: string): string => (text.length > 60 ? `${text.slice(0, 60)}…` : text);
