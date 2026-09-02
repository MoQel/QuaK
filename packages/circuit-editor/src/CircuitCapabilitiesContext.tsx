import { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface CircuitCapabilities {
    /**
     * Whether the host can persist classical registers and measurements.
     *
     * The web IDE can: the backend circuit model carries both. The VSCode
     * extension cannot yet, because `@quak/qasm-transform` neither parses
     * `creg`/`measure` nor writes them back, so a measurement added here would
     * be silently dropped on the next write and would make the document
     * read-only on the next read. Hosts that cannot store them must not offer
     * them.
     */
    classicalRegisters: boolean;
}

const DEFAULT_CAPABILITIES: CircuitCapabilities = { classicalRegisters: true };

const CircuitCapabilitiesContext = createContext<CircuitCapabilities>(DEFAULT_CAPABILITIES);

export function CircuitCapabilitiesProvider({
    classicalRegisters,
    children,
}: Readonly<CircuitCapabilities & { children: ReactNode }>) {
    const capabilities = useMemo(() => ({ classicalRegisters }), [classicalRegisters]);
    return <CircuitCapabilitiesContext.Provider value={capabilities}>{children}</CircuitCapabilitiesContext.Provider>;
}

/** Defaults to a fully capable host, so the web IDE needs no provider. */
export function useCircuitCapabilities(): CircuitCapabilities {
    return useContext(CircuitCapabilitiesContext);
}
