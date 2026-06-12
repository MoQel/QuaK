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
        const timer = setTimeout(() => {
            const dirtyKeys = Array.from(dirtyCircuitKeysRef.current);
            dirtyCircuitKeysRef.current.clear();

            for (const key of dirtyKeys) {
                const target = key === PROJECT_CIRCUIT_KEY ? circuit : circuitsByTabId[key];
                if (target) {
                    saveCircuitContent(target).catch((error) => console.error('Failed to save circuit', error));
                }
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [circuitsByTabId, circuit]);

    // Drop cached circuits whose tabs were closed; they are reloaded from the
    // backend the next time the file is opened.
    useEffect(() => {
        // Read the tab ids fresh from the store: during startup this effect can run
        // with a stale (empty) openTabIdsKey while the tabs were already restored.
        const openIds = new Set(store.getState().tabs.groups.flatMap((group) => group.openTabs.map((tab) => tab.id)));
        setCircuitsByTabId((prev) => {
            const entries = Object.entries(prev);
            const filteredEntries = entries.filter(([tabId]) => openIds.has(tabId));

            if (filteredEntries.length === entries.length) return prev;
            return Object.fromEntries(filteredEntries);
        });
    }, [openTabIdsKey]);

    // Reset the per-tab circuits when switching projects.
    useEffect(() => {
        dirtyCircuitKeysRef.current.clear();
        setCircuitsByTabId({});
    }, [projectId]);

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
