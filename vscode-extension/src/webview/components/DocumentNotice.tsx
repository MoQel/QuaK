import type { ReactNode } from 'react';
import type { DocumentClassification } from '@quak/qasm-transform';
import type { DocumentState } from '../../shared/protocol.ts';

interface DocumentNoticeProps {
    state: DocumentState | undefined;
    classification: DocumentClassification | null | undefined;
    /** Whether a circuit is on screen next to this notice, which changes what is true to say. */
    hasCircuit: boolean;
    onEditAnyway: () => void;
}

/** How many findings to name before the list stops being useful. */
const SHOWN = 3;

/** What a notice says. */
interface NoticeCopy {
    headline: string;
    detail?: ReactNode;
    /** Set only where accepting the loss actually unlocks editing. */
    offersOptIn?: boolean;
}

/** Keyed by kind, so a new kind is a type error here rather than a silent blank notice. */
const COPY: {
    [K in DocumentClassification['kind']]: (
        classification: Extract<DocumentClassification, { kind: K }>,
        hasCircuit: boolean,
    ) => NoticeCopy | null;
} = {
    editable: () => null,

    empty: () => ({
        headline: 'This file is empty.',
        detail: <MissingLines hasVersion={false} hasInclude={false} />,
    }),

    noRegister: ({ hasVersion, hasInclude }) => ({
        headline: 'This file does not declare a qubit register yet.',
        detail: <MissingLines hasVersion={hasVersion} hasInclude={hasInclude} />,
    }),

    unsupportedVersion: ({ version }) => ({
        headline: `This file declares OpenQASM ${version}.`,
        detail: 'The circuit editor reads OpenQASM 3. Text editing is unaffected.',
    }),

    // Not an error: the file is valid OpenQASM, it just holds more than the editor can write back.
    unsupported: ({ constructs }) => ({
        headline: 'Read-only: this file uses constructs the circuit editor cannot write back.',
        detail: <Findings entries={constructs} />,
    }),

    commentsOnly: ({ comments }) => ({
        headline: 'Read-only: editing this circuit would drop your comments.',
        detail: `${count(comments.length, 'comment')} below the header would be lost when the circuit is written back. Comments at the top of the file are kept.`,
        offersOptIn: true,
    }),

    // Not only syntax: an undefined gate or register lands here too, and both mean the
    // file is wrong rather than merely beyond this editor. Whatever could still be read
    // is drawn, so the headline must not deny it.
    invalid: ({ problems }, hasCircuit) => ({
        headline: hasCircuit
            ? 'Read-only: this file has errors, so the circuit below is incomplete.'
            : 'This file has errors, so there is no circuit to show.',
        detail: <Findings entries={problems} />,
    }),
};

/** Ours, not the document's, so it does not read as the user having written a bad file. */
const ANALYSIS_FAILED: NoticeCopy = {
    headline: 'QuaK could not read this file.',
    detail: 'Something went wrong inside the circuit editor, so the file stays read-only here. The details are in the QuaK output channel. Text editing is unaffected.',
};

/** The user has been told what happens to the comments and asked for it anyway. */
const EDITING_BY_CHOICE: NoticeCopy = {
    headline: 'Editing this file.',
    detail: 'Comments below the header will be dropped when the circuit is written back.',
};

/**
 * Explains why the circuit cannot be edited, and what to do about it.
 *
 * The reason is decided in the transform; this only puts it in words.
 */
export function DocumentNotice({ state, classification, hasCircuit, onEditAnyway }: Readonly<DocumentNoticeProps>) {
    const copy = noticeFor(state, classification, hasCircuit);
    if (!copy) return null;

    return (
        <div className="border-b border-border bg-bg-light px-3 py-2 text-xs">
            <p className="font-medium text-text">{copy.headline}</p>
            {copy.detail && <div className="mt-1 text-text-muted">{copy.detail}</div>}
            {copy.offersOptIn && (
                <button
                    type="button"
                    onClick={onEditAnyway}
                    className="mt-2 rounded border border-border px-2 py-1 text-text hover:bg-bg-light-hover"
                >
                    Edit anyway (comments will be lost)
                </button>
            )}
        </div>
    );
}

function noticeFor(
    state: DocumentState | undefined,
    classification: DocumentClassification | null | undefined,
    hasCircuit: boolean,
): NoticeCopy | null {
    // Before everything else: with no classification there is nothing to explain.
    if (state === 'failed') return ANALYSIS_FAILED;

    // Outranks the classification: the comments are still there, but the user has
    // already seen this notice and accepted what happens to them.
    if (state === 'editableByChoice') return EDITING_BY_CHOICE;
    if (!classification) return null;

    // One entry per kind, so the entry always matches this payload.
    const copy = COPY[classification.kind] as (
        classification: DocumentClassification,
        hasCircuit: boolean,
    ) => NoticeCopy | null;
    return copy(classification, hasCircuit);
}

/** Names only the lines the file is still missing, so the advice fits what is already there. */
function MissingLines({ hasVersion, hasInclude }: Readonly<{ hasVersion: boolean; hasInclude: boolean }>) {
    if (hasVersion && hasInclude) {
        return (
            <>
                Add a register such as <code>qubit[4] q;</code> and the circuit appears here.
            </>
        );
    }

    if (hasVersion) {
        return (
            <>
                Add <code>include "stdgates.inc";</code> and a register such as <code>qubit[4] q;</code>.
            </>
        );
    }

    return (
        <>
            A circuit starts with three lines: <code>OPENQASM 3.0;</code>, <code>include "stdgates.inc";</code> and{' '}
            <code>qubit[4] q;</code>.
        </>
    );
}

/** Lines worth naming, from either the parser or the visitor. */
function Findings({ entries }: Readonly<{ entries: readonly { line: number; message: string }[] }>) {
    return (
        <>
            <ul className="list-disc pl-4">
                {entries.slice(0, SHOWN).map((entry) => (
                    <li key={`${entry.line}-${entry.message}`}>
                        Line {entry.line}: {entry.message}
                    </li>
                ))}
            </ul>
            {entries.length > SHOWN && <p className="mt-1">and {entries.length - SHOWN} more.</p>}
        </>
    );
}

const count = (amount: number, noun: string): string => `${amount} ${noun}${amount === 1 ? '' : 's'}`;
