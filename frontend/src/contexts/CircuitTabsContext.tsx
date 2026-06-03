import React, { createContext, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useProject } from '@/contexts/ProjectContext.tsx';

interface CircuitTabsContextType {
    activeCircuit: CircuitResponse | undefined;
    activeCircuitTabId: string | null;
    setActiveCircuit: React.Dispatch<SetStateAction<CircuitResponse | undefined>>;
}

const CircuitTabsContext = createContext<CircuitTabsContextType>({
    activeCircuit: undefined,
    activeCircuitTabId: null,
    setActiveCircuit: () => {},
});

export const useCircuitTabs = () => useContext(CircuitTabsContext);

export const CircuitTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { circuit, setCircuit } = useProject();
    const activeCircuitTabId = useAppSelector((state) => {
        const activeGroup = state.tabs.groups.find((group) => group.id === state.tabs.activeGroupId);
        return activeGroup?.activeTabId ?? null;
    });
    const openTabIdsKey = useAppSelector((state) =>
        state.tabs.groups.flatMap((group) => group.openTabs.map((tab) => tab.id)).join('\u001f'),
    );
    const [circuitsByTabId, setCircuitsByTabId] = useState<Record<string, CircuitResponse | undefined>>({});

    const activeCircuit = activeCircuitTabId ? (circuitsByTabId[activeCircuitTabId] ?? circuit) : circuit;

    const setActiveCircuit = useCallback(
        (nextCircuit: SetStateAction<CircuitResponse | undefined>) => {
            if (!activeCircuitTabId) {
                setCircuit(nextCircuit);
                return;
            }

            setCircuitsByTabId((prev) => {
                const previousCircuit = prev[activeCircuitTabId] ?? circuit;
                const resolvedCircuit =
                    typeof nextCircuit === 'function'
                        ? (nextCircuit as (prevState: CircuitResponse | undefined) => CircuitResponse | undefined)(
                              previousCircuit,
                          )
                        : nextCircuit;

                return {
                    ...prev,
                    [activeCircuitTabId]: resolvedCircuit,
                };
            });
        },
        [activeCircuitTabId, circuit, setCircuit],
    );

    useEffect(() => {
        const openIds = new Set(openTabIdsKey.split('\u001f').filter(Boolean));
        setCircuitsByTabId((prev) => {
            const entries = Object.entries(prev);
            const filteredEntries = entries.filter(([tabId]) => openIds.has(tabId));

            if (filteredEntries.length === entries.length) return prev;
            return Object.fromEntries(filteredEntries);
        });
    }, [openTabIdsKey]);

    const contextValue = useMemo(
        () => ({
            activeCircuit,
            activeCircuitTabId,
            setActiveCircuit,
        }),
        [activeCircuit, activeCircuitTabId, setActiveCircuit],
    );

    return <CircuitTabsContext.Provider value={contextValue}>{children}</CircuitTabsContext.Provider>;
};
