// Messages between the extension host and the circuit editor webview.
//
// The host is the single authority over the document. Webviews are clients that render whatever state the host broadcasts.
// A document can have several panels open at once, so every change goes to all of them. There is no privileged "originating" panel.

export interface ReadyMessage {
    type: 'ready';
}

/** Webview -> host. */
export type WebviewMessage = ReadyMessage;

export interface DocumentChangedMessage {
    type: 'documentChanged';
    text: string;
    version: number;
}

/** Host -> webview. */
export type HostMessage = DocumentChangedMessage;
