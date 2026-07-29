// React hook for the webview side of the VSCode document protocol.
import { useEffect, useRef, useState } from 'react';
import type { CircuitContent, CircuitResponse } from '@quak/circuit-core';
import type { DocumentDiagnostic, DocumentState, HostMessage } from '../../shared/protocol.ts';
import { vscodeApi } from '../vscodeApi.ts';

export interface DocumentSnapshot {
    circuit: CircuitResponse | null;
    version: number;
    state: DocumentState;
    diagnostics: DocumentDiagnostic[];
}

export interface RequestedEdit {
    requestId: string;
    baseVersion: number;
}

/** Mirrors the host-owned document and lets the webview request edits. */
export function useDocument() {
    const [snapshot, setSnapshot] = useState<DocumentSnapshot | undefined>();
    const snapshotRef = useRef<DocumentSnapshot | undefined>(undefined);
    // Last refused edit; optimistic UI must stop showing it.
    const [rejectedRequestId, setRejectedRequestId] = useState<string | undefined>();

    useEffect(() => {
        function onMessage(event: MessageEvent<HostMessage>) {
            // The webview origin differs between desktop and hosted VSCode.
            if (event.origin !== globalThis.origin) {
                return;
            }

            const message = event.data;
            switch (message.type) {
                case 'documentChanged': {
                    const next = {
                        circuit: message.circuit,
                        version: message.version,
                        state: message.state,
                        diagnostics: message.diagnostics,
                    };
                    snapshotRef.current = next;
                    setSnapshot(next);
                    break;
                }
                case 'editApplied':
                    break;
                case 'editRejected':
                    setRejectedRequestId(message.requestId);
                    break;
            }
        }

        window.addEventListener('message', onMessage);
        vscodeApi.postMessage({ type: 'ready' });

        return () => window.removeEventListener('message', onMessage);
    }, []);

    /** Returns the id the host will answer with, if a document snapshot exists. */
    function requestEdit(content: CircuitContent): RequestedEdit | undefined {
        const base = snapshotRef.current;
        if (!base) {
            return undefined;
        }

        const requestId = crypto.randomUUID();
        vscodeApi.postMessage({ type: 'applyEdit', requestId, content, baseVersion: base.version });
        return { requestId, baseVersion: base.version };
    }

    return { snapshot, requestEdit, rejectedRequestId };
}
