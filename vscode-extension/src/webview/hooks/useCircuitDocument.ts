// Connects the VSCode document snapshot to the shared circuit editor model.
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { toCircuitContent, type CircuitResponse } from '@quak/circuit-core';
import { isWritable } from '../../shared/protocol.ts';
import { useDocument } from './useDocument.ts';
import { showsPendingEdit, type PendingEdit } from '../lib/pendingEdit.ts';

/** Connects the host-provided circuit snapshot to editable React state. */
export function useCircuitDocument() {
    const { snapshot, requestEdit, rejectedRequestId, appliedRequestId } = useDocument();

    // Optimistic circuit shown until the host broadcasts, rejects or confirms the edit.
    const [pending, setPending] = useState<PendingEdit | undefined>();

    const showPending = showsPendingEdit({
        pending,
        documentVersion: snapshot?.version,
        rejectedRequestId,
        appliedRequestId,
    });
    const circuit = showPending && pending ? pending.circuit : (snapshot?.circuit ?? undefined);

    const readOnly = snapshot !== undefined && !isWritable(snapshot.state);

    const setCircuit: Dispatch<SetStateAction<CircuitResponse | undefined>> = useCallback(
        (update) => {
            if (readOnly) return;

            const next = typeof update === 'function' ? update(circuit) : update;
            if (!next) return;

            const requested = requestEdit(toCircuitContent(next));
            if (!requested) return;

            // Show the edit immediately while the host applies it.
            setPending({ ...requested, circuit: next });
        },
        [circuit, readOnly, requestEdit],
    );

    return {
        circuit,
        setCircuit,
        readOnly,
        state: snapshot?.state,
        classification: snapshot?.classification,
    };
}
