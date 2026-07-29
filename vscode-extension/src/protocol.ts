// Messages between the extension host and the circuit editor webview.
//
// The host is the single authority over the document. Webviews are clients that render whatever state the host broadcasts.
// A document can have several panels open at once, so every change goes to all of them. There is no privileged "originating" panel.

export interface ReadyMessage {
    type: 'ready';
}

/** Asks the host to write `newText` to the document, assuming it is still at `baseVersion`. */
export interface ApplyEditMessage {
    type: 'applyEdit';
    requestId: string;
    newText: string;
    baseVersion: number;
}

/**
 * The user chose to edit a document the transform cannot round-trip losslessly,
 * having been told what it will cost. Deliberately an explicit act: the default
 * is read-only, and the host is the one that remembers the choice.
 */
export interface EnableEditingMessage {
    type: 'enableEditing';
}

/** Webview -> host. */
export type WebviewMessage = ReadyMessage | ApplyEditMessage | EnableEditingMessage;

/**
 * Whether the document may be edited through the circuit view.
 *
 * Only documents that survive a parse/generate round trip without losing
 * anything may be written back to. Everything else is rendered read-only, so a
 * visual edit can never silently drop content.
 *
 * `editableByChoice` is the escape hatch: the user was shown what would be lost
 * and asked for it anyway. Kept distinct from `editable` so the view can keep
 * saying so — the warning belongs before the work, not after it.
 */
export type DocumentState = 'editable' | 'readOnly' | 'editableByChoice';

/** Why a document is not editable, in the user's terms. */
export interface DocumentDiagnostic {
    line: number;
    construct: string;
    message: string;
}

export interface DocumentChangedMessage {
    type: 'documentChanged';
    text: string;
    version: number;
    state: DocumentState;
    /** What the transform could not represent. Empty when the document is clean. */
    diagnostics: DocumentDiagnostic[];
}

export interface EditAppliedMessage {
    type: 'editApplied';
    requestId: string;
    version: number;
}

export type EditRejectedReason =
    /** Someone else changed the document since baseVersion; the webview must rebase. */
    | 'stale'
    /** The document is not safely regenerable. */
    | 'readOnly'
    /** VSCode refused the edit. */
    | 'applyFailed';

export interface EditRejectedMessage {
    type: 'editRejected';
    requestId: string;
    reason: EditRejectedReason;
    currentVersion: number;
}

/** Host -> webview. */
export type HostMessage = DocumentChangedMessage | EditAppliedMessage | EditRejectedMessage;
