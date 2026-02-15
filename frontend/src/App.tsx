import { useEffect, useRef, useState, useMemo, useCallback } from 'react'; // Add useRef
import { createContext, useContext } from 'react';
import { DockviewReact, DockviewReadyEvent, DockviewApi } from 'dockview-react';
import { GateLibraryView } from '@/views/library-view/GateLibraryView.tsx';
import { CircuitView } from '@/views/circuit-view/CircuitView.tsx';
import { TextEditorView } from '@/views/text-editor-view/TextEditorView.tsx';
import { ProjectManagerView } from '@/views/project-manager-view/ProjectManagerView.tsx';
import { ResultsView } from '@/views/results-view/ResultsView.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { File } from '@/views/project-manager-view/util/FileElement.tsx';
import { InspectorView } from '@/views/inspector-view/InspectorView.tsx';
import { GateDefinitionResponse } from '@/api/dto/library.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import 'dockview-core/dist/styles/dockview.css';
import { useLayout, PanelKey } from '@/hooks/use-layout';

const LAYOUT_STORAGE_KEY = 'ide-dockview-layout-v1';

// 1. Create a Context to hold the state you need inside the panels
type PanelContextType = {
    file: File;
    openFile: (file: File) => void;
    circuit: CircuitResponse | null;
    setCircuit: (c: CircuitResponse | null) => void;
    selectedGate: GateDefinitionResponse | undefined;
    setSelectedGate: (g: GateDefinitionResponse | undefined) => void;
};

const PanelDataContext = createContext<PanelContextType | null>(null);

// Helper hook to use the context safely
const usePanelData = () => {
    const context = useContext(PanelDataContext);
    if (!context) throw new Error('Panel components must be used within PanelDataContext');
    return context;
};

// 2. Define components OUTSIDE the App function
// These wrappers pull data from the Context, not from props.

const ProjectPanel = () => {
    const { openFile } = usePanelData();
    return <ProjectManagerView onFileSelect={openFile} />;
};

const CircuitPanel = () => {
    const { circuit, setCircuit } = usePanelData();
    return <CircuitView circuit={circuit} setCircuit={setCircuit} />;
};

const CodePanel = () => {
    const { file } = usePanelData();
    return <TextEditorView file={file} />;
};

const LibraryPanel = () => {
    const { setSelectedGate } = usePanelData();
    return <GateLibraryView onGateSelect={setSelectedGate} />;
};

const InspectorPanel = () => {
    const { selectedGate, setSelectedGate } = usePanelData();
    return <InspectorView gate={selectedGate} onClear={() => setSelectedGate(undefined)} />;
};

const ResultsPanel = () => {
    const { circuit } = usePanelData();
    return <ResultsView circuit={circuit} />;
};

// The Registry map used by Dockview
const componentRegistry = {
    file: ProjectPanel,
    circuit: CircuitPanel,
    code: CodePanel,
    library: LibraryPanel,
    inspector: InspectorPanel,
    results: ResultsPanel,
};

function App() {
    const [file, openFile] = useState(undefined as unknown as File);
    const [selectedGate, setSelectedGate] = useState<GateDefinitionResponse | undefined>(undefined);
    const [circuit, setCircuit] = useState<CircuitResponse | null>(null);
    // 2. Redux State (We pull the Reset Version now)
    const { visiblePanels, onTogglePanel, layoutResetVersion } = useLayout();
    // --- REFS FOR STABILITY (The Fix for Desync) ---
    // We use Refs to ensure the event listeners always see the LATEST data/functions
    // without needing to remove/add the listener constantly.
    const visiblePanelsRef = useRef(visiblePanels);
    const onTogglePanelRef = useRef(onTogglePanel);
    const apiRef = useRef<DockviewApi | null>(null);
    const isResettingRef = useRef(false);
    const lastResetVersionRef = useRef(layoutResetVersion);

    // Keep Refs synced
    useEffect(() => {
        visiblePanelsRef.current = visiblePanels;
    }, [visiblePanels]);
    useEffect(() => {
        onTogglePanelRef.current = onTogglePanel;
    }, [onTogglePanel]);

    // -- Context Value --
    // We wrap this in useMemo so the object reference is stable
    // (prevents unnecessary context updates if state hasn't actually changed)
    const contextValue = useMemo(
        () => ({
            file,
            openFile,
            circuit,
            setCircuit,
            selectedGate,
            setSelectedGate,
        }),
        [file, circuit, selectedGate],
    );

    // --- SMART PLACEMENT LOGIC ---
    // This function decides where a panel should go based on who else is currently open.
    const getOptimalPosition = (panelId: PanelKey, api: DockviewApi) => {
        const exists = (id: string) => !!api.getPanel(id);

        const tryPos = (neighborId: string, direction: 'above' | 'below' | 'left' | 'right') => {
            if (exists(neighborId)) {
                return { referencePanel: api.getPanel(neighborId)!, direction };
            }
            return null;
        };

        // PRIORITIES:
        // 1. Vertical Neighbor (Restore the Column)
        // 2. Left Neighbor (Attach to left side)
        // 3. Right Neighbor (Attach to right side)

        switch (panelId) {
            case 'file': // Top Left
                return (
                    tryPos('library', 'above') ||
                    tryPos('circuit', 'left') ||
                    tryPos('inspector', 'left') ||
                    tryPos('code', 'left')
                );

            case 'library': // Bottom Left
                return tryPos('file', 'below') || tryPos('inspector', 'left') || tryPos('circuit', 'left');

            case 'circuit': // Top Middle
                return (
                    tryPos('inspector', 'above') || // Best: Rejoin Inspector
                    tryPos('file', 'right') || // Next: Stick to File
                    tryPos('library', 'right') ||
                    tryPos('code', 'left') || // Next: Stick to Code
                    tryPos('results', 'left')
                );

            case 'inspector': // Bottom Middle
                return (
                    tryPos('circuit', 'below') || // Best: Rejoin Circuit
                    tryPos('library', 'right') ||
                    tryPos('file', 'right') ||
                    tryPos('results', 'left') ||
                    tryPos('code', 'left')
                );

            case 'code': // Top Right
                return (
                    tryPos('results', 'above') ||
                    tryPos('circuit', 'right') ||
                    tryPos('inspector', 'right') ||
                    tryPos('file', 'right')
                );

            case 'results': // Bottom Right
                return tryPos('code', 'below') || tryPos('inspector', 'right') || tryPos('circuit', 'right');

            default:
                return null;
        }
    };

    const loadDefaultLayout = useCallback((api: DockviewApi) => {
        // 1. Lock the system
        isResettingRef.current = true;

        // 2. Clear the grid AND Storage
        api.clear();
        localStorage.removeItem(LAYOUT_STORAGE_KEY);

        // 3. THE FIX: Wait 1 tick (50ms) before rebuilding.
        // This allows Dockview to flush the old JSON-loaded IDs
        // before we try to reuse them.
        setTimeout(() => {
            if (!api) return; // Safety check

            // --- REBUILD LAYOUT (Same logic as before) ---

            // 1. Top Row Anchors
            const circuit = api.addPanel({
                id: 'circuit',
                component: 'circuit',
                title: 'Circuit',
            });

            const file = api.addPanel({
                id: 'file',
                component: 'file',
                title: 'Project',
                position: { referencePanel: circuit, direction: 'left' },
            });

            const code = api.addPanel({
                id: 'code',
                component: 'code',
                title: 'Code Editor',
                position: { referencePanel: circuit, direction: 'right' },
            });

            // 2. Bottom Row Splits
            api.addPanel({
                id: 'library',
                component: 'library',
                title: 'Library',
                position: { referencePanel: file, direction: 'below' },
            });

            api.addPanel({
                id: 'inspector',
                component: 'inspector',
                title: 'Inspector',
                position: { referencePanel: circuit, direction: 'below' },
            });

            api.addPanel({
                id: 'results',
                component: 'results',
                title: 'Results',
                position: { referencePanel: code, direction: 'below' },
            });

            // 4. Focus and Unlock
            const circuitPanel = api.getPanel('circuit');
            if (circuitPanel) circuitPanel.focus();

            // Unlock slightly after render
            setTimeout(() => {
                isResettingRef.current = false;
            }, 100);
        }, 50); // <--- The magic delay
    }, []);

    // --- EFFECT: Handle "Reset" from Navbar ---
    useEffect(() => {
        // If the version in Redux is higher than what we last handled...
        if (layoutResetVersion > lastResetVersionRef.current) {
            if (apiRef.current) {
                // 1. Force the layout to default
                loadDefaultLayout(apiRef.current);
                // 2. Clear persistence so it sticks
                localStorage.removeItem(LAYOUT_STORAGE_KEY);
            }
            // 3. Update tracker
            lastResetVersionRef.current = layoutResetVersion;
        }
    }, [layoutResetVersion, loadDefaultLayout]);

    // 2. Sync Redux -> Dockview (Using Smart Placement)
    useEffect(() => {
        const api = apiRef.current;

        // GUARD CLAUSE:
        // If api is missing, OR we are currently resetting,
        // OR a reset is pending (Redux version > local version),
        // DO NOT attempt to manually place panels. Let loadDefaultLayout handle it.
        if (!api || isResettingRef.current || layoutResetVersion > lastResetVersionRef.current) return;

        (Object.keys(visiblePanels) as PanelKey[]).forEach((key) => {
            const shouldBeVisible = visiblePanels[key];
            const panel = api.getPanel(key);

            if (shouldBeVisible && !panel) {
                // ... existing logic to add panel ...
                let position = getOptimalPosition(key, api);

                if (!position && api.panels.length > 0) {
                    position = { referencePanel: api.panels[0], direction: 'right' };
                }

                api.addPanel({
                    id: key,
                    component: key,
                    title: key.charAt(0).toUpperCase() + key.slice(1),
                    position: position || undefined,
                });
            } else if (!shouldBeVisible && panel) {
                api.removePanel(panel);
            }
        });
    }, [visiblePanels, layoutResetVersion]); // Add layoutResetVersion to dependencies

    // --- ON READY ---
    const onReady = (event: DockviewReadyEvent) => {
        const api = event.api;
        apiRef.current = api;

        // 1. Attach Event Listener Manually (FIX FOR CHECKMARK ISSUE)
        // We do this here so we can use the Refs inside the callback safely
        api.onDidRemovePanel((e) => {
            // If we are programmatically resetting, ignore this event
            if (isResettingRef.current) return;

            const id = e.id as PanelKey;

            // Check the REF (Live State) not the stale closure state
            if (visiblePanelsRef.current[id]) {
                // Call the REF (Live Function)
                onTogglePanelRef.current(id);
            }
        });

        // 2. Load Layout
        const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
        let success = false;

        if (savedLayout) {
            try {
                isResettingRef.current = true;
                api.fromJSON(JSON.parse(savedLayout));
                success = true;
                setTimeout(() => {
                    isResettingRef.current = false;
                }, 200);
            } catch (err) {
                console.error('Layout error', err);
                localStorage.removeItem(LAYOUT_STORAGE_KEY);
                isResettingRef.current = false;
            }
        }

        if (!success) {
            loadDefaultLayout(api);
        }

        // 3. Auto-save
        let debounceTimer: ReturnType<typeof setTimeout>;
        api.onDidLayoutChange(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (isResettingRef.current) return;
                localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(api.toJSON()));
            }, 500);
        });
    };

    return (
        <PanelDataContext.Provider value={contextValue}>
            <div className="flex flex-col h-full w-full bg-background text-foreground overflow-hidden">
                <div className="flex-1 h-full w-full relative">
                    <DockviewReact
                        components={componentRegistry}
                        onReady={onReady}
                        className="dockview-theme-custom h-full w-full"
                    />
                </div>
                <Toaster />
            </div>
        </PanelDataContext.Provider>
    );
}

export default App;
