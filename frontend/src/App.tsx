import { useEffect, useRef, useState, useMemo, useCallback } from 'react'; // Add useRef
import { createContext, useContext } from 'react';
import { DockviewReact, DockviewReadyEvent, DockviewApi } from 'dockview-react'; // Add DockviewApi
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
    // We track the last handled reset version to avoid double-resets on mount
    const lastResetVersionRef = useRef(layoutResetVersion);

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

    const apiRef = useRef<DockviewApi | null>(null);

    // -- Helper: Default Layout (The Grid) --
    // We wrap this in useCallback so we can use it in onReady and potentially pass it to buttons
    const loadDefaultLayout = useCallback((api: DockviewApi) => {
        api.clear();
        // --- TOP ROW ---

        // A. Add the "Anchor" panel (Project Manager)
        const pFile = api.addPanel({
            id: 'file', // Unique ID
            component: 'file', // Must match the key in 'componentRegistry'
            title: 'Project',
        });

        // B. Add Circuit to the RIGHT of File
        const pCircuit = api.addPanel({
            id: 'circuit',
            component: 'circuit',
            title: 'Circuit',
            position: { referencePanel: pFile, direction: 'right' },
        });

        // C. Add Code to the RIGHT of Circuit
        const pCode = api.addPanel({
            id: 'code',
            component: 'code',
            title: 'Code Editor',
            position: { referencePanel: pCircuit, direction: 'right' },
        });

        // --- BOTTOM ROW ---

        // D. Add Library BELOW the File panel
        // This creates the vertical split between Top and Bottom rows
        const pLibrary = api.addPanel({
            id: 'library',
            component: 'library',
            title: 'Library',
            position: { referencePanel: pFile, direction: 'below' },
        });

        // E. Add Inspector to the RIGHT of Library
        const pInspector = api.addPanel({
            id: 'inspector',
            component: 'inspector',
            title: 'Inspector',
            position: { referencePanel: pCircuit, direction: 'below' },
        });

        // F. Add Results to the RIGHT of Inspector
        const pResults = api.addPanel({
            id: 'results',
            component: 'results',
            title: 'Results',
            position: { referencePanel: pCode, direction: 'below' },
        });

        // Optional: Attempt to set relative sizes (approximate 70/30 split)
        // Note: Dockview layout is dynamic, but we can nudge it.
        // Usually, users resize themselves, but we start 50/50 by default.
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

    // -- Persistence Logic --
    const onReady = (event: DockviewReadyEvent) => {
        const api = event.api;
        apiRef.current = api;

        // A. Try to load from LocalStorage
        const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
        let success = false;

        if (savedLayout) {
            try {
                // Dockview restores the window positions
                api.fromJSON(JSON.parse(savedLayout));
                success = true;
            } catch (err) {
                console.error('Failed to load layout:', err);
                // If corrupted, clear it so next refresh is clean
                localStorage.removeItem(LAYOUT_STORAGE_KEY);
            }
        }

        // B. If no save found (or load failed), use Default
        if (!success) {
            loadDefaultLayout(api);
        }

        // C. Setup Auto-Save
        // We debounce the save to avoid writing to disk on every pixel of resize
        let debounceTimer: ReturnType<typeof setTimeout>;

        const saveFn = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const json = api.toJSON();
                localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(json));
            }, 500); // Wait 500ms after last change to save
        };

        // Listen to layout changes (resize, move, close, open)
        api.onDidLayoutChange(saveFn);
    };

    useEffect(() => {
        const api = apiRef.current;
        if (!api) return;

        // Iterate over your visiblePanels state
        (Object.keys(visiblePanels) as PanelKey[]).forEach((key) => {
            const shouldBeVisible = visiblePanels[key];
            const panel = api.getPanel(key);

            if (shouldBeVisible && !panel) {
                // REDUX says SHOW, but Dockview missing -> Add it
                // We need basic fallback positioning logic here if the layout is empty
                // (Simple approach: Try to place right of 'file', or default)
                const reference = api.panels[0];

                api.addPanel({
                    id: key,
                    component: key,
                    title: key.charAt(0).toUpperCase() + key.slice(1), // "file" -> "File"
                    position: reference ? { referencePanel: reference, direction: 'right' } : undefined,
                });
            } else if (!shouldBeVisible && panel) {
                // REDUX says HIDE, but Dockview has it -> Remove it
                api.removePanel(panel);
            }
        });
    }, [visiblePanels]); // Run whenever Redux state changes

    return (
        <PanelDataContext.Provider value={contextValue}>
            {/* NO NAVBAR HERE - It's in Layout.tsx */}
            <div className="flex flex-col h-full w-full bg-background text-foreground overflow-hidden">
                <div className="flex-1 h-full w-full relative">
                    <DockviewReact
                        components={componentRegistry}
                        onReady={onReady}
                        className="dockview-theme-abyss h-full w-full"
                        // Sync: User closed tab -> Update Redux
                        onDidRemovePanel={(e) => {
                            const id = e.id as PanelKey;
                            if (visiblePanels[id]) {
                                onTogglePanel(id);
                            }
                        }}
                    />
                </div>
                <Toaster />
            </div>
        </PanelDataContext.Provider>
    );
}

export default App;
