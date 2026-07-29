import { createContext, useContext, useMemo, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { CircuitResponse } from '@quak/circuit-core';

export interface CircuitStore {
    circuit: CircuitResponse | undefined;
    setCircuit: Dispatch<SetStateAction<CircuitResponse | undefined>>;
}

/**
 * The circuit the editor works on, plus the only way to change it.
 *
 * Edits are pure and local: components compute the next `CircuitResponse` and
 * hand it to `setCircuit`. What that means is the host's business — the web IDE
 * debounces a full-circuit save to the backend, the VSCode extension regenerates
 * QASM and writes it back to the document. Neither is visible from here.
 */
const CircuitStoreContext = createContext<CircuitStore | null>(null);

export function CircuitStoreProvider({
    circuit,
    setCircuit,
    children,
}: Readonly<CircuitStore & { children: ReactNode }>) {
    const store = useMemo(() => ({ circuit, setCircuit }), [circuit, setCircuit]);
    return <CircuitStoreContext.Provider value={store}>{children}</CircuitStoreContext.Provider>;
}

export function useCircuitStore(): CircuitStore {
    const store = useContext(CircuitStoreContext);
    if (!store) throw new Error('useCircuitStore must be used within CircuitStoreProvider');
    return store;
}
