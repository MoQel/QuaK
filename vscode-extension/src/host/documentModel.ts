import type { CircuitResponse } from '@quak/circuit-core';
import {
    classify,
    toCircuit,
    type DocumentClassification,
    type QasmPreamble,
    type QasmRejection,
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

/** One parse per document version, shared by the diagnostics, the panel broadcast and arbitration. */
export class ClassificationCache {
    private readonly byUri = new Map<string, { version: number; classified: ClassifiedDocument | null }>();

    /** `onFailure` reports a defect in the transform; it runs once per version, not once per caller. */
    public constructor(private readonly onFailure: (error: unknown, context: string) => void) {}

    /** Null when the document could not be analysed at all. */
    public of(document: SourceDocument): ClassifiedDocument | null {
        const key = document.uri.toString();
        const cached = this.byUri.get(key);
        if (cached?.version === document.version) {
            return cached.classified;
        }

        const classified = this.classify(document, key);
        this.byUri.set(key, { version: document.version, classified });

        return classified;
    }

    /** A throw would be swallowed by the VSCode event handler calling this, so it is caught and reported. */
    private classify(document: SourceDocument, key: string): ClassifiedDocument | null {
        try {
            return classifyText(document.getText());
        } catch (error) {
            this.onFailure(error, key);
            return null;
        }
    }

    /** Closing a document is what bounds this cache; a reopened one starts over at version 1. */
    public forget(document: SourceDocument): void {
        this.byUri.delete(document.uri.toString());
    }

    public get size(): number {
        return this.byUri.size;
    }
}

export interface DiagnosticCategories {
    errors: boolean;
    syncSupport: boolean;
}

/** Nothing switched on means nothing to parse for. */
export const reportsAnything = (categories: DiagnosticCategories): boolean =>
    categories.errors || categories.syncSupport;

/** The findings worth a squiggle. A document-wide cause such as the version hides the rejections it explains. */
export function diagnosticsFor(
    classification: DocumentClassification,
    categories: DiagnosticCategories,
): DocumentDiagnostic[] {
    switch (classification.kind) {
        case 'invalid':
            return categories.errors ? classification.problems.map((entry) => toDiagnostic(entry, 'error')) : [];

        // Valid OpenQASM this editor cannot write back: informational, not a defect.
        case 'unsupported':
            return categories.syncSupport ? classification.constructs.map((entry) => toDiagnostic(entry, 'info')) : [];

        // Which comments block visual editing, so the opt-in is an informed choice.
        case 'commentsOnly':
            return categories.syncSupport ? classification.comments.map((entry) => toDiagnostic(entry, 'hint')) : [];

        // Facts about the whole document. The notice states them, no line to underline.
        case 'unsupportedVersion':
        case 'empty':
        case 'noRegister':
        case 'editable':
            return [];
    }
}

/** ANTLR lines are 1-based, VSCode's are 0-based. */
export const positionOf = (entry: DocumentDiagnostic): { line: number; column: number } => ({
    line: Math.max(0, entry.line - 1),
    column: Math.max(0, entry.column),
});

const toDiagnostic = (entry: QasmRejection, severity: DiagnosticSeverity): DocumentDiagnostic => ({
    line: entry.line,
    column: entry.column,
    construct: entry.construct,
    message: entry.message,
    severity,
});
