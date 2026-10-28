import { createContext, useContext, useMemo, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { CircuitResponse } from '@quak/circuit-core';

export interface CircuitStore {
    circuit: CircuitResponse | undefined;
    setCircuit: Dispatch<SetStateAction<CircuitResponse | undefined>>;
}

/**
 * The circuit the editor works on and the only way to change it. What `setCircuit` does (a backend save, a .qasm
 * rewrite) is up to the host.
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
