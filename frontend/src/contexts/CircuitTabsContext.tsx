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
import { saveCircuitContent } from '@/views/circuit-workspace/circuitPersistence.ts';
import { store } from '@/store/store.ts';

interface CircuitTabsContextType {
    activeCircuit: CircuitResponse | undefined;
    activeCircuitTabId: string | null;
    activeCircuitLoading: boolean;
    activeCircuitError: string | null;
    reloadActiveCircuit: () => void;
    setActiveCircuit: React.Dispatch<SetStateAction<CircuitResponse | undefined>>;
}

const CircuitTabsContext = createContext<CircuitTabsContextType>({
    activeCircuit: undefined,
    activeCircuitTabId: null,
    activeCircuitLoading: false,
    activeCircuitError: null,
    reloadActiveCircuit: () => {},
    setActiveCircuit: () => {},
});

export const useCircuitTabs = () => useContext(CircuitTabsContext);

export const CircuitTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { projectId } = useProject();
    const activeCircuitTabId = useAppSelector((state) => {
        const activeGroup = state.tabs.groups.find((group) => group.id === state.tabs.activeGroupId);
        const activeTabId = activeGroup?.activeTabId ?? null;
        // Only treat a tab as active if it is actually open. This guards against a dangling
        // activeTabId (e.g. left over after closing all tabs) keeping the circuit editable even
        // though no tab is shown — the panel then correctly falls back to "No file open".
        return activeTabId && activeGroup?.openTabs.some((tab) => tab.id === activeTabId) ? activeTabId : null;
    });
    const openTabIdsKey = useAppSelector((state) =>
        state.tabs.groups.flatMap((group) => group.openTabs.map((tab) => tab.id)).join('|'),
    );
    const [circuitsByTabId, setCircuitsByTabId] = useState<Record<string, CircuitResponse | undefined>>({});
    const [circuitLoadErrorsByTabId, setCircuitLoadErrorsByTabId] = useState<Record<string, string | undefined>>({});
    const [reloadRequestCount, setReloadRequestCount] = useState(0);

    // Each file tab shows the circuit stored for that file in the database
    // (single source of truth); without a tab there is no circuit to show.
    const activeCircuit = activeCircuitTabId ? circuitsByTabId[activeCircuitTabId] : undefined;
    const activeCircuitError = activeCircuitTabId ? (circuitLoadErrorsByTabId[activeCircuitTabId] ?? null) : null;
    const activeCircuitLoading = Boolean(activeCircuitTabId && !activeCircuit && !activeCircuitError);

    // Circuits whose local edits have not been written to the backend yet.
    const dirtyCircuitKeysRef = useRef<Set<string>>(new Set());

    // Latest rendered circuits, so teardown effects (tab close / project switch) can still flush
    // pending edits even though their state has already been reset.
    const latestCircuitsRef = useRef(circuitsByTabId);
    latestCircuitsRef.current = circuitsByTabId;

    // Immediately persist the given dirty circuits (or all dirty ones) and clear their dirty flag.
    const flushDirtyCircuits = useCallback((keys?: string[]) => {
        const dirtyKeys = dirtyCircuitKeysRef.current;
        for (const key of keys ?? Array.from(dirtyKeys)) {
            if (!dirtyKeys.has(key)) continue;
            dirtyKeys.delete(key);

            const target = latestCircuitsRef.current[key];
            if (target) {
                saveCircuitContent(target).catch((error) => console.error('Failed to save circuit', error));
            }
        }
    }, []);

    const setActiveCircuit = useCallback(
        (nextCircuit: SetStateAction<CircuitResponse | undefined>) => {
            // Circuit edits are only possible while a file tab is active.
            if (!activeCircuitTabId) return;
            dirtyCircuitKeysRef.current.add(activeCircuitTabId);

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
        [activeCircuitTabId],
    );

    const reloadActiveCircuit = useCallback(() => {
        if (!activeCircuitTabId) return;
        setCircuitLoadErrorsByTabId((prev) => ({ ...prev, [activeCircuitTabId]: undefined }));
        setCircuitsByTabId((prev) => ({ ...prev, [activeCircuitTabId]: undefined }));
        setReloadRequestCount((count) => count + 1);
    }, [activeCircuitTabId]);

    // Load the circuit linked to the active file tab from the backend (get-or-create).
    useEffect(() => {
        if (!activeCircuitTabId || circuitsByTabId[activeCircuitTabId]) return;

        let cancelled = false;
        setCircuitLoadErrorsByTabId((prev) => ({ ...prev, [activeCircuitTabId]: undefined }));
        api.get<CircuitResponse>(`/api/circuit/file/${activeCircuitTabId}`)
            .then((fetched) => {
                if (cancelled) return;
                // Keep local state if the user already started editing in the meantime.
                setCircuitsByTabId((prev) =>
                    prev[activeCircuitTabId] ? prev : { ...prev, [activeCircuitTabId]: fetched },
                );
            })
            .catch((error) => {
                console.error('Failed to load circuit for file', error);
                if (cancelled) return;
                setCircuitLoadErrorsByTabId((prev) => ({
                    ...prev,
                    [activeCircuitTabId]:
                        error instanceof Error ? error.message : 'Could not load the circuit for this file.',
                }));
            });

        return () => {
            cancelled = true;
        };
    }, [activeCircuitTabId, circuitsByTabId, reloadRequestCount]);

    // Persist locally edited circuits to the backend (debounced full replace).
    useEffect(() => {
        const timer = setTimeout(() => flushDirtyCircuits(), 800);
        return () => clearTimeout(timer);
    }, [circuitsByTabId, flushDirtyCircuits]);

    // When a tab is closed, immediately persist its unsaved edits (save on close).
    // The cached circuit is intentionally KEPT: reopening the tab then shows it
    // instantly from cache instead of refetching, which avoids a flash where the
    // freshly loaded circuit briefly appears and is then dropped by a racing update.
    // The whole cache is cleared on project switch (see the reset effect below).
    useEffect(() => {
        const openIds = new Set(store.getState().tabs.groups.flatMap((group) => group.openTabs.map((tab) => tab.id)));
        const closingDirtyKeys = Array.from(dirtyCircuitKeysRef.current).filter((key) => !openIds.has(key));
        flushDirtyCircuits(closingDirtyKeys);
    }, [openTabIdsKey, flushDirtyCircuits]);

    // Reset the per-tab circuits when switching projects, but flush pending edits
    // of the project being left first (the cleanup runs before the reset takes effect).
    useEffect(() => {
        dirtyCircuitKeysRef.current.clear();
        setCircuitsByTabId({});
        setCircuitLoadErrorsByTabId({});

        return () => {
            flushDirtyCircuits();
        };
    }, [projectId, flushDirtyCircuits]);

    const contextValue = useMemo(
        () => ({
            activeCircuit,
            activeCircuitError,
            activeCircuitLoading,
            activeCircuitTabId,
            reloadActiveCircuit,
            setActiveCircuit,
        }),
        [
            activeCircuit,
            activeCircuitError,
            activeCircuitLoading,
            activeCircuitTabId,
            reloadActiveCircuit,
            setActiveCircuit,
        ],
    );

    return <CircuitTabsContext.Provider value={contextValue}>{children}</CircuitTabsContext.Provider>;
};
