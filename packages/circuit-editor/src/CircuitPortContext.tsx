import { createContext, useContext, type ReactNode } from 'react';
import type { CircuitPort } from '@quak/circuit-core';

/**
 * Supplies the editor with a way to change the circuit, without it knowing where
 * the circuit lives. The web IDE injects a REST adapter; the VSCode extension
 * will inject one backed by the .qasm file.
 */
const CircuitPortContext = createContext<CircuitPort | null>(null);

export function CircuitPortProvider({ port, children }: Readonly<{ port: CircuitPort; children: ReactNode }>) {
    return <CircuitPortContext.Provider value={port}>{children}</CircuitPortContext.Provider>;
}

export function useCircuitPort(): CircuitPort {
    const port = useContext(CircuitPortContext);
    if (!port) throw new Error('useCircuitPort must be used within CircuitPortProvider');
    return port;
}
