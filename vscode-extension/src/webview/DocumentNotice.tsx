import type { DocumentDiagnostic, DocumentState } from '../protocol.ts';

interface DocumentNoticeProps {
    state: DocumentState | undefined;
    diagnostics: DocumentDiagnostic[];
    onEditAnyway: () => void;
}

/**
 * Says why the circuit cannot be edited, and offers the way past it — before the
 * user starts working, not after. Telling someone their comments are gone once
 * they have rearranged a circuit is information arriving too late to act on.
 */
export function DocumentNotice({ state, diagnostics, onEditAnyway }: Readonly<DocumentNoticeProps>) {
    if (state === 'editable') return null;

    if (state === 'editableByChoice') {
        return (
            <div className="border-b border-border bg-bg-light px-3 py-2 text-xs text-text-muted">
                Editing this file. Comments below the header will be dropped when the circuit is written back.
            </div>
        );
    }

    const syntaxErrors = diagnostics.filter((entry) => entry.construct === 'syntax');
    const comments = diagnostics.filter((entry) => entry.construct === 'comment');
    const other = diagnostics.filter((entry) => entry.construct !== 'syntax' && entry.construct !== 'comment');

    // A file that does not parse is not a choice the user can opt past — there is
    // no circuit to edit in the first place.
    if (syntaxErrors.length > 0) {
        return (
            <div className="border-b border-border bg-bg-light px-3 py-2 text-xs">
                <p className="font-medium text-text">
                    This file has syntax errors, so it cannot be shown as a circuit.
                </p>
                <ul className="mt-1 list-disc pl-4 text-text-muted">
                    {syntaxErrors.slice(0, 3).map((entry) => (
                        <li key={`${entry.line}-${entry.message}`}>
                            Line {entry.line}: {entry.message}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="border-b border-border bg-bg-light px-3 py-2 text-xs">
            <p className="font-medium text-text">Read-only: editing this circuit would change more than the circuit.</p>
            <ul className="mt-1 list-disc pl-4 text-text-muted">
                {comments.length > 0 && (
                    <li>
                        {comments.length === 1 ? '1 comment' : `${comments.length} comments`} below the header would be
                        lost. Comments at the top of the file are kept.
                    </li>
                )}
                {other.slice(0, 3).map((entry) => (
                    <li key={`${entry.line}-${entry.construct}`}>
                        Line {entry.line}: {entry.message}
                    </li>
                ))}
            </ul>

            {other.length === 0 && comments.length > 0 && (
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
