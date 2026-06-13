import React, {
    createContext,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { api } from '@/api/api.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { saveCircuitContent } from '@/views/circuit-view/util/circuitPersistence.ts';
import { store } from '@/store/store.ts';

/** Dirty-tracking key for the project-level circuit (no file tab). */
const PROJECT_CIRCUIT_KEY = '__project__';

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
    const { circuit, setCircuit, projectId } = useProject();
    const activeCircuitTabId = useAppSelector((state) => {
        const activeGroup = state.tabs.groups.find((group) => group.id === state.tabs.activeGroupId);
        return activeGroup?.activeTabId ?? null;
    });
    const openTabIdsKey = useAppSelector((state) =>
        state.tabs.groups.flatMap((group) => group.openTabs.map((tab) => tab.id)).join('|'),
    );
    const [circuitsByTabId, setCircuitsByTabId] = useState<Record<string, CircuitResponse | undefined>>({});

    // Each file tab shows the circuit stored for that file in the database
    // (single source of truth); without a tab the project circuit is shown.
    const activeCircuit = activeCircuitTabId ? circuitsByTabId[activeCircuitTabId] : circuit;

    // Circuits whose local edits have not been written to the backend yet.
    const dirtyCircuitKeysRef = useRef<Set<string>>(new Set());

    // Latest rendered circuits, so teardown effects (tab close / project switch) can still flush
    // pending edits even though their state has already been reset.
    const latestCircuitsRef = useRef(circuitsByTabId);
    latestCircuitsRef.current = circuitsByTabId;
    const latestProjectCircuitRef = useRef(circuit);
    latestProjectCircuitRef.current = circuit;

    // Immediately persist the given dirty circuits (or all dirty ones) and clear their dirty flag.
    const flushDirtyCircuits = useCallback((keys?: string[]) => {
        const dirtyKeys = dirtyCircuitKeysRef.current;
        for (const key of keys ?? Array.from(dirtyKeys)) {
            if (!dirtyKeys.has(key)) continue;
            dirtyKeys.delete(key);

            const target =
                key === PROJECT_CIRCUIT_KEY ? latestProjectCircuitRef.current : latestCircuitsRef.current[key];
            if (target) {
                saveCircuitContent(target).catch((error) => console.error('Failed to save circuit', error));
            }
        }
    }, []);

    const setActiveCircuit = useCallback(
        (nextCircuit: SetStateAction<CircuitResponse | undefined>) => {
            dirtyCircuitKeysRef.current.add(activeCircuitTabId ?? PROJECT_CIRCUIT_KEY);

            if (!activeCircuitTabId) {
                setCircuit(nextCircuit);
                return;
            }

            setCircuitsByTabId((prev) => {
                const previousCircuit = prev[activeCircuitTabId];
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
        [activeCircuitTabId, setCircuit],
    );

    // Load the circuit linked to the active file tab from the backend (get-or-create).
    useEffect(() => {
        if (!activeCircuitTabId || circuitsByTabId[activeCircuitTabId]) return;

        let cancelled = false;
        api.get<CircuitResponse>(`/api/circuit/file/${activeCircuitTabId}`)
            .then((fetched) => {
                if (cancelled) return;
                // Keep local state if the user already started editing in the meantime.
                setCircuitsByTabId((prev) =>
                    prev[activeCircuitTabId] ? prev : { ...prev, [activeCircuitTabId]: fetched },
                );
            })
            .catch((error) => console.error('Failed to load circuit for file', error));

        return () => {
            cancelled = true;
        };
    }, [activeCircuitTabId, circuitsByTabId]);

    // Persist locally edited circuits to the backend (debounced full replace).
    useEffect(() => {
        const timer = setTimeout(() => flushDirtyCircuits(), 800);
        return () => clearTimeout(timer);
    }, [circuitsByTabId, circuit, flushDirtyCircuits]);

    // When a tab is closed, immediately persist its unsaved edits (save on close).
    // The cached circuit is intentionally KEPT: reopening the tab then shows it
    // instantly from cache instead of refetching, which avoids a flash where the
    // freshly loaded circuit briefly appears and is then dropped by a racing update.
    // The whole cache is cleared on project switch (see the reset effect below).
    useEffect(() => {
        const openIds = new Set(store.getState().tabs.groups.flatMap((group) => group.openTabs.map((tab) => tab.id)));
        const closingDirtyKeys = Array.from(dirtyCircuitKeysRef.current).filter(
            (key) => key !== PROJECT_CIRCUIT_KEY && !openIds.has(key),
        );
        flushDirtyCircuits(closingDirtyKeys);
    }, [openTabIdsKey, flushDirtyCircuits]);

    // Reset the per-tab circuits when switching projects, but flush pending edits
    // of the project being left first (the cleanup runs before the reset takes effect).
    useEffect(() => {
        dirtyCircuitKeysRef.current.clear();
        setCircuitsByTabId({});

        return () => {
            flushDirtyCircuits();
        };
    }, [projectId, flushDirtyCircuits]);

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
