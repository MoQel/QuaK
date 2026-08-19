import type { CircuitResponse } from '@quak/circuit-core';
import {
    classify,
    toCircuit,
    type DocumentClassification,
    type QasmPreamble,
    type QasmUnsupportedConstruct,
} from '@quak/qasm-transform';
import type { DocumentState } from '../shared/protocol.ts';

/** Not `vscode.DiagnosticSeverity`: this module stays loadable, and testable, without VSCode. */
export type DiagnosticSeverity = 'error' | 'info' | 'hint';

/** A finding the transform can point at, ready to become a squiggle. */
export interface DocumentDiagnostic {
    /** 1-based, the way ANTLR counts. */
    line: number;
    /** 0-based, the way ANTLR and VSCode both count. */
    column: number;
    /** Grammar rule or gate name; shown as the diagnostic code. */
    construct: string;
    message: string;
    severity: DiagnosticSeverity;
}

/** Everything the host learns from one parse of a document. */
export interface ClassifiedDocument {
    state: Exclude<DocumentState, 'editableByChoice'>;
    circuit: CircuitResponse | null;
    preamble: QasmPreamble;
    classification: DocumentClassification;
}

/** Parses QASM text and reports whether visual edits can be applied without data loss. */
export function classifyText(text: string): ClassifiedDocument {
    const result = toCircuit(text);
    const classification = classify(result);
    const circuit = result.content
        ? { id: 'document', registers: result.content.registers, layers: result.content.layers }
        : null;

    return {
        state: classification.kind === 'editable' ? 'editable' : 'readOnly',
        circuit,
        preamble: result.preamble,
        classification,
    };
}

/** What the cache needs of a `vscode.TextDocument`, structural so this module stays testable without VSCode. */
export interface SourceDocument {
    uri: { toString(): string };
    version: number;
    getText(): string;
}

/**
 * One parse per document version.
 *
 * A single keystroke reaches the diagnostics, the panel broadcast and, on a visual
 * edit, arbitration as well — all of them asking the same question about the same
 * text. Without this they each run the ANTLR parser again.
 */
export class ClassificationCache {
    private readonly byUri = new Map<string, { version: number; classified: ClassifiedDocument }>();

    public of(document: SourceDocument): ClassifiedDocument {
        const key = document.uri.toString();
        const cached = this.byUri.get(key);
        if (cached?.version === document.version) {
            return cached.classified;
        }

        const classified = classifyText(document.getText());
        this.byUri.set(key, { version: document.version, classified });

        return classified;
    }

    /** Closing a document is what bounds this cache; a reopened one starts over at version 1. */
    public forget(document: SourceDocument): void {
        this.byUri.delete(document.uri.toString());
    }

    public get size(): number {
        return this.byUri.size;
    }
}

/**
 * The lines worth marking — never simply everything the transform rejected. A cause
 * such as the file's version already accounts for the rejections under it, and next
 * to the real finding they bury it.
 */
export function diagnosticsFor(classification: DocumentClassification): DocumentDiagnostic[] {
    switch (classification.kind) {
        // Nobody else reports these: the bundled language server lints a lenient parse
        // and stays silent on a missing bracket. Measured, not assumed.
        case 'invalid':
            return classification.syntaxErrors.map((error) => ({
                line: error.line,
                column: error.column,
                construct: 'syntax',
                message: error.message,
                severity: 'error',
            }));

        // Valid OpenQASM this editor cannot write back — informational, not a defect.
        case 'unsupported':
            return classification.constructs.map((entry) => toDiagnostic(entry, 'info'));

        // Which comments block visual editing, so the opt-in is an informed choice.
        case 'commentsOnly':
            return classification.comments.map((entry) => toDiagnostic(entry, 'hint'));

        // Facts about the whole document; the notice states them, no line to underline.
        case 'unsupportedVersion':
        case 'empty':
        case 'noRegister':
        case 'editable':
            return [];
    }
}

/** Tested on its own: an off-by-one here moves every marker a line and still looks right. */
export const positionOf = (entry: DocumentDiagnostic): { line: number; column: number } => ({
    line: Math.max(0, entry.line - 1),
    column: Math.max(0, entry.column),
});

const toDiagnostic = (entry: QasmUnsupportedConstruct, severity: DiagnosticSeverity): DocumentDiagnostic => ({
    line: entry.line,
    column: entry.column,
    construct: entry.construct,
    message: entry.message,
    severity,
});
