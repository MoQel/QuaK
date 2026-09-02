// Shared message types for the VSCode extension host and the circuit editor webview.
// VSCode provides the postMessage transport. This file defines the application protocol.
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

/** A crash in the webview, so it reaches the log instead of only blanking the panel. */
export interface WebviewErrorMessage {
    type: 'webviewError';
    message: string;
    stack?: string;
}

/** Webview -> host. */
export type WebviewMessage = ReadyMessage | ApplyEditMessage | EnableEditingMessage | WebviewErrorMessage;

/**
 * Whether the document may be edited through the circuit view. `failed` is ours, not
 * the document's: the transform threw, so nothing about the file is known.
 */
export type DocumentState = 'editable' | 'readOnly' | 'editableByChoice' | 'failed';

/** Single definition, so the host and the webview cannot disagree on who may write. */
export const isWritable = (state: DocumentState | undefined): boolean =>
    state === 'editable' || state === 'editableByChoice';

export interface DocumentChangedMessage {
    type: 'documentChanged';
    circuit: CircuitResponse | null;
    version: number;
    state: DocumentState;
    /** Why the document is in that state, decided once by the transform. Null when it threw. */
    classification: DocumentClassification | null;
}

/**
 * The edit landed. `documentChanged` follows whenever the text actually changed; this
 * message is what clears the optimistic circuit when it did not (an edit that produced
 * byte-identical QASM fires no document change).
 */
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

// Both bundles ship together, so the types above are the contract. The guards below
// exist because postMessage delivers `unknown`: a message the other side never sent
// (or sent half-formed) must be reported, not dispatched on a field that is not there.

const WEBVIEW_MESSAGE_TYPES: ReadonlySet<string> = new Set<WebviewMessage['type']>([
    'ready',
    'applyEdit',
    'enableEditing',
    'webviewError',
]);
const HOST_MESSAGE_TYPES: ReadonlySet<string> = new Set<HostMessage['type']>([
    'documentChanged',
    'editApplied',
    'editRejected',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const hasRequestFields = (message: Record<string, unknown>): boolean =>
    typeof message.requestId === 'string' && typeof message.baseVersion === 'number' && isRecord(message.content);

/** Whether `value` is a message the webview sends, with the fields its type promises. */
export function isWebviewMessage(value: unknown): value is WebviewMessage {
    if (!isRecord(value) || typeof value.type !== 'string' || !WEBVIEW_MESSAGE_TYPES.has(value.type)) return false;
    if (value.type === 'applyEdit') return hasRequestFields(value);
    if (value.type === 'webviewError') return typeof value.message === 'string';
    return true;
}

/** Whether `value` is a message the host sends, with the fields its type promises. */
export function isHostMessage(value: unknown): value is HostMessage {
    if (!isRecord(value) || typeof value.type !== 'string' || !HOST_MESSAGE_TYPES.has(value.type)) return false;
    if (value.type === 'documentChanged') return typeof value.version === 'number' && typeof value.state === 'string';
    return typeof value.requestId === 'string';
}
