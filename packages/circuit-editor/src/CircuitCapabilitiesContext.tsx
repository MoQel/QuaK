import { createContext, useContext, useMemo, type ReactNode } from 'react';

/** What the host can persist. The editor hides the controls for anything the host would drop. */
export interface CircuitCapabilities {
    classicalRegisters: boolean;
    compositeGates: boolean;
    loops: boolean;
}

const FULLY_CAPABLE: CircuitCapabilities = { classicalRegisters: true, compositeGates: true, loops: true };

const CircuitCapabilitiesContext = createContext<CircuitCapabilities>(FULLY_CAPABLE);

export function CircuitCapabilitiesProvider({
    children,
    ...lacking
}: Readonly<Partial<CircuitCapabilities> & { children: ReactNode }>) {
    const { classicalRegisters, compositeGates, loops } = { ...FULLY_CAPABLE, ...lacking };
    const capabilities = useMemo(
        () => ({ classicalRegisters, compositeGates, loops }),
        [classicalRegisters, compositeGates, loops],
    );
    return <CircuitCapabilitiesContext.Provider value={capabilities}>{children}</CircuitCapabilitiesContext.Provider>;
}

/** Defaults to a fully capable host, so the web IDE needs no provider. */
export function useCircuitCapabilities(): CircuitCapabilities {
    return useContext(CircuitCapabilitiesContext);
}
