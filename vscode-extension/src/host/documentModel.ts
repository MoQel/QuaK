import type { DocumentDiagnostic, DocumentState } from '../shared/protocol.ts';
import type { CircuitResponse } from '@quak/circuit-core';
import {
    classify,
    toCircuit,
    type DocumentClassification,
    type QasmPreamble,
    type QasmUnsupportedConstruct,
} from '@quak/qasm-transform';

/** Parses QASM text and reports whether visual edits can be applied without data loss. */
export function classifyText(text: string): {
    state: Exclude<DocumentState, 'editableByChoice'>;
    circuit: CircuitResponse | null;
    preamble: QasmPreamble;
    diagnostics: DocumentDiagnostic[];
    classification: DocumentClassification;
} {
    const result = toCircuit(text);
    const classification = classify(result);
    const circuit = result.content
        ? { id: 'document', registers: result.content.registers, layers: result.content.layers }
        : null;

    return {
        state: classification.kind === 'editable' ? 'editable' : 'readOnly',
        circuit,
        preamble: result.preamble,
        diagnostics: diagnosticsFor(classification),
        classification: classification,
    };
}

/**
 * The lines worth marking — never simply everything the transform rejected.
 *
 * A recovered parse tree makes the visitor reject fragments the user never wrote,
 * and a cause such as the file's version already accounts for the rejections under
 * it. Reporting those next to the real finding buries it.
 */
function diagnosticsFor(classification: DocumentClassification): DocumentDiagnostic[] {
    switch (classification.kind) {
        case 'invalid':
            return classification.syntaxErrors.map((error) => ({
                line: error.line,
                construct: 'syntax',
                message: error.message,
            }));
        case 'unsupported':
            return classification.constructs.map(toDiagnostic);
        case 'commentsOnly':
            return classification.comments.map(toDiagnostic);
        // A wrong version, a missing register and an empty file are facts about the
        // document as a whole. The notice states them; there is no line to underline.
        case 'unsupportedVersion':
        case 'empty':
        case 'noRegister':
        case 'editable':
            return [];
    }
}

const toDiagnostic = (entry: QasmUnsupportedConstruct): DocumentDiagnostic => ({
    line: entry.line,
    construct: entry.construct,
    message: entry.message,
});
