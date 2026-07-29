import { useCallback, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { CircuitResponse } from '@quak/circuit-core';
import { toCircuit, toQasm } from '@quak/qasm-transform';
import { useDocument } from './useDocument.ts';

/**
 * The seam between the document and the circuit editor.
 *
 * Read: the host broadcasts text, we parse it into a circuit. Write: the editor
 * hands us a circuit, we regenerate QASM and ask the host to write it. The
 * document stays the source of truth throughout — we never hold a circuit the
 * text does not describe.
 *
 * The parse is memoised on the text rather than run per render, because it
 * happens on every keystroke in the text editor.
 */
export function useCircuitDocument() {
    const { snapshot, status, requestEdit } = useDocument();

    // Set while an edit we requested is still in flight, so the circuit shown is
    // the user's action rather than snapping back to the last parse.
    const [pending, setPending] = useState<CircuitResponse | undefined>();
    const pendingTextRef = useRef<string | undefined>(undefined);

    const parsed = useMemo(() => (snapshot ? toCircuit(snapshot.text) : undefined), [snapshot?.text]);

    // The document has caught up with what we asked for, so stop overriding.
    if (pendingTextRef.current !== undefined && snapshot?.text === pendingTextRef.current) {
        pendingTextRef.current = undefined;
    }

    const circuit: CircuitResponse | undefined = useMemo(() => {
        if (pendingTextRef.current !== undefined && pending) return pending;
        if (!parsed?.content) return undefined;

        // The circuit model wants an id; the document has no such thing, so it is
        // derived from the file rather than invented, keeping it stable per parse.
        return { id: 'document', registers: parsed.content.registers, layers: parsed.content.layers };
    }, [parsed, pending]);

    const readOnly = snapshot?.state === 'readOnly';

    const setCircuit: Dispatch<SetStateAction<CircuitResponse | undefined>> = useCallback(
        (update) => {
            if (readOnly || !parsed) return;

            const next = typeof update === 'function' ? update(circuit) : update;
            if (!next) return;

            // Show the user's edit immediately; the host's broadcast confirms it.
            setPending(next);

            const text = toQasm({ registers: next.registers, layers: next.layers }, parsed.preamble);
            pendingTextRef.current = text;
            requestEdit(text);
        },
        [circuit, parsed, readOnly, requestEdit],
    );

    return {
        circuit,
        setCircuit,
        status,
        readOnly,
        state: snapshot?.state,
        diagnostics: snapshot?.diagnostics ?? [],
        hasDocument: snapshot !== undefined,
    };
}
