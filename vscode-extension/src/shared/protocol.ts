// Shared message types for the VSCode extension host and the circuit editor webview.
// VSCode provides the postMessage transport; this file defines the application protocol.
import type { CircuitContent, CircuitResponse } from '@quak/circuit-core';
// Type-only on purpose: a value import here would pull the ANTLR parser into the webview bundle.
import type { DocumentClassification } from '@quak/qasm-transform';

export interface ReadyMessage {
    type: 'ready';
}

/** Asks the host to write `content` to the document, assuming it is still at `baseVersion`. */
export interface ApplyEditMessage {
    type: 'applyEdit';
    requestId: string;
    content: CircuitContent;
    baseVersion: number;
}

/** User opt-in to edit a document that cannot be round-tripped losslessly. */
export interface EnableEditingMessage {
    type: 'enableEditing';
}

/** Webview -> host. */
export type WebviewMessage = ReadyMessage | ApplyEditMessage | EnableEditingMessage;

/** Whether the document may be edited through the circuit view. */
export type DocumentState = 'editable' | 'readOnly' | 'editableByChoice';

export interface DocumentChangedMessage {
    type: 'documentChanged';
    circuit: CircuitResponse | null;
    version: number;
    state: DocumentState;
    /** Why the document is in that state, decided once by the transform. */
    classification: DocumentClassification;
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
