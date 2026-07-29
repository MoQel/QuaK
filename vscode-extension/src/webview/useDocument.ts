import { useEffect, useRef, useState } from 'react';
import type { DocumentDiagnostic, DocumentState, HostMessage } from '../protocol.ts';
import { vscodeApi } from './vscodeApi.ts';

export interface DocumentSnapshot {
    text: string;
    version: number;
    state: DocumentState;
    diagnostics: DocumentDiagnostic[];
}

/**
 * Mirrors the document the host owns, and lets the view ask for changes.
 *
 * The host is the authority: we never mutate our copy directly, we request an
 * edit and wait for the broadcast that follows.
 */
export function useDocument() {
    const [snapshot, setSnapshot] = useState<DocumentSnapshot | undefined>();
    const [status, setStatus] = useState('waiting for the document...');
    const snapshotRef = useRef<DocumentSnapshot | undefined>(undefined);

    useEffect(() => {
        function onMessage(event: MessageEvent<HostMessage>) {
            // Only trust messages from our own frame. Compared against globalThis.origin rather than a fixed string,
            // because the origin differs per environment: "vscode-webview:" in desktop VSCode, "https:" when web-hosted.
            if (event.origin !== globalThis.origin) {
                setStatus(`ignored a message from an unexpected origin: ${event.origin}`);
                return;
            }

            const message = event.data;
            switch (message.type) {
                case 'documentChanged': {
                    const next = {
                        text: message.text,
                        version: message.version,
                        state: message.state,
                        diagnostics: message.diagnostics,
                    };
                    snapshotRef.current = next;
                    setSnapshot(next);
                    setStatus(`version ${message.version} | ${message.text.length} chars | ${message.state}`);
                    break;
                }
                case 'editApplied':
                    setStatus(`edit ${message.requestId.slice(0, 8)} APPLIED -> version ${message.version}`);
                    break;
                case 'editRejected':
                    setStatus(
                        `edit ${message.requestId.slice(0, 8)} REJECTED (${message.reason}) | document is at version ${message.currentVersion}`,
                    );
                    break;
            }
        }

        window.addEventListener('message', onMessage);
        vscodeApi.postMessage({ type: 'ready' });

        return () => window.removeEventListener('message', onMessage);
    }, []);

    function requestEdit(newText: string) {
        const base = snapshotRef.current;
        if (!base) {
            return;
        }

        const requestId = crypto.randomUUID();
        setStatus(`edit ${requestId.slice(0, 8)} sent (base version ${base.version})...`);
        vscodeApi.postMessage({ type: 'applyEdit', requestId, newText, baseVersion: base.version });
    }

    return { snapshot, status, requestEdit };
}
