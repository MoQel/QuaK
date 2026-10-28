import type { QasmRejection } from './circuitBuilder.ts';
import type { QasmSyntaxError } from './parse.ts';
import type { ToCircuitResult } from './toCircuit.ts';

/** Why a document is, or is not, editable through the circuit view. */
export type DocumentClassification =
    | { kind: 'editable' }
    | { kind: 'invalid'; problems: QasmRejection[] }
    | { kind: 'unsupportedVersion'; version: string }
    | { kind: 'unsupported'; constructs: QasmRejection[] }
    | { kind: 'commentsOnly'; comments: QasmRejection[] }
    | { kind: 'empty' }
    /** Nothing to draw yet; the notice names the lines that are still missing. */
    | { kind: 'noRegister'; hasVersion: boolean; hasInclude: boolean };

/** OpenQASM 2 is read as well, the way the backend reads it, and written back as OpenQASM 3. */
const SUPPORTED_MAJOR_VERSIONS: ReadonlySet<string> = new Set(['2', '3']);

/** `OPENQASM 3;` and `OPENQASM 3.0;` declare the same major version. */
export const majorVersion = (version: string): string => version.split('.')[0];

/** Comments are the one rejection a user can knowingly accept, so they stand apart. */
const isComment = (entry: QasmRejection): boolean => entry.construct === 'comment';

/** Syntax errors are reported in the same shape as every other rejection. */
const asRejection = (error: QasmSyntaxError): QasmRejection => ({ ...error, construct: 'syntax', kind: 'invalid' });

/**
 * The single most useful reason a document cannot be edited visually. The first matching check is the cause; what the
 * later checks would find is mostly a consequence of it.
 */
export function classify(result: ToCircuitResult): DocumentClassification {
    if (result.syntaxErrors.length > 0) {
        // Alone: other rejections next to a syntax error are fragments of the broken tree.
        return { kind: 'invalid', problems: result.syntaxErrors.map(asRejection) };
    }

    const { version, includes, headerComments } = result.preamble;
    if (version !== null && !SUPPORTED_MAJOR_VERSIONS.has(majorVersion(version))) {
        return { kind: 'unsupportedVersion', version };
    }

    // Ahead of the register and error checks: a skipped statement makes later references look undefined.
    const constructs = result.unsupported.filter((entry) => entry.kind === 'unsupported' && !isComment(entry));
    if (constructs.length > 0) {
        return { kind: 'unsupported', constructs };
    }

    const problems = result.unsupported.filter((entry) => entry.kind === 'invalid');
    if (problems.length > 0) {
        return { kind: 'invalid', problems };
    }

    if (result.content === null) {
        const nothingWritten = version === null && includes.length === 0 && headerComments.length === 0;
        if (nothingWritten) return { kind: 'empty' };

        return { kind: 'noRegister', hasVersion: version !== null, hasInclude: includes.length > 0 };
    }

    // Last, so the opt-in is only offered where accepting it actually unlocks editing.
    const comments = result.unsupported.filter(isComment);
    if (comments.length > 0) {
        return { kind: 'commentsOnly', comments };
    }

    return { kind: 'editable' };
}

/** Editable means the transform can regenerate the document; `classify` names the reasons it cannot. */
export const isEditable = (result: ToCircuitResult): boolean => classify(result).kind === 'editable';
