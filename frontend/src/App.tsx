import { useEffect, useMemo, useRef, useState } from 'react';
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview-react';

import 'dockview-core/dist/styles/dockview.css';

import { GateLibraryView } from '@/views/library-view/GateLibraryView';
import { CircuitView } from '@/views/circuit-view/CircuitView';
import { TextEditorView } from '@/views/text-editor-view/TextEditorView';
import { ProjectManagerView } from '@/views/project-manager-view/ProjectManagerView';
import { ResultsView } from '@/views/results-view/ResultsView';
import { InspectorView } from '@/views/inspector-view/InspectorView';
import { Toaster } from '@/components/ui/sonner';

import { File } from '@/views/project-manager-view/util/FileElement';
import { GateDefinitionResponse } from '@/api/dto/library';
import { CircuitResponse } from '@/api/dto/circuit';
import { useLayout } from '@/hooks/use-layout';

type CommonParams = {
    // we keep params minimal; actual rendering is via component functions
};

function App() {
    const [file, openFile] = useState(undefined as unknown as File);
    const [selectedGate, setSelectedGate] = useState<GateDefinitionResponse | undefined>(undefined);
    const [circuit, setCircuit] = useState<CircuitResponse | null>(null);

    const { visiblePanels, onTogglePanel, onSetMenubarVisibility } = useLayout();

    const apiRef = useRef<DockviewReadyEvent['api'] | null>(null);

    // ---- 1) Dockview component registry (reactive!) ----
    const components = useMemo(
        () => ({
            file: (_: IDockviewPanelProps<CommonParams>) => <ProjectManagerView onFileSelect={openFile} />,
            circuit: (_: IDockviewPanelProps<CommonParams>) => (
                <CircuitView circuit={circuit} setCircuit={setCircuit} />
            ),
            code: (_: IDockviewPanelProps<CommonParams>) => <TextEditorView file={file} />,
            library: (_: IDockviewPanelProps<CommonParams>) => <GateLibraryView onGateSelect={setSelectedGate} />,
            inspector: (_: IDockviewPanelProps<CommonParams>) => (
                <InspectorView gate={selectedGate} onClear={() => setSelectedGate(undefined)} />
            ),
            results: (_: IDockviewPanelProps<CommonParams>) => <ResultsView circuit={circuit} />,
        }),
        [file, circuit, selectedGate],
    );

    // ---- 2) Helper: ensure a panel exists or remove it ----
    const syncPanels = () => {
        const api = apiRef.current;
        if (!api) return;

        const ensure = (id: string, component: string, title: string, position?: any) => {
            if (api.getPanel(id)) return api.getPanel(id)!;
            return api.addPanel({ id, component, title, params: {}, position });
        };

        const remove = (id: string) => {
            const p = api.getPanel(id);
            if (p) api.removePanel(p);
        };

        // Create anchor panels in a deterministic order (for initial layout)
        // TOP ROW
        let pFile: any = null;
        let pCircuit: any = null;
        let pCode: any = null;

        if (visiblePanels.file) {
            pFile = ensure('file', 'file', 'Project');
        } else remove('file');

        if (visiblePanels.circuit) {
            pCircuit = ensure(
                'circuit',
                'circuit',
                'Circuit',
                pFile ? { referencePanel: pFile, direction: 'right' } : undefined,
            );
        } else remove('circuit');

        if (visiblePanels.code) {
            // position it to the right of circuit if possible, otherwise file
            const ref = pCircuit ?? pFile;
            pCode = ensure('code', 'code', 'Code', ref ? { referencePanel: ref, direction: 'right' } : undefined);
        } else remove('code');

        // BOTTOM ROW
        if (visiblePanels.library) {
            ensure('library', 'library', 'Library', pFile ? { referencePanel: pFile, direction: 'below' } : undefined);
        } else remove('library');

        if (visiblePanels.inspector) {
            const ref = pCircuit ?? pFile;
            ensure(
                'inspector',
                'inspector',
                'Inspector',
                ref ? { referencePanel: ref, direction: 'below' } : undefined,
            );
        } else remove('inspector');

        if (visiblePanels.results) {
            const ref = pCode ?? pCircuit ?? pFile;
            ensure('results', 'results', 'Results', ref ? { referencePanel: ref, direction: 'below' } : undefined);
        } else remove('results');
    };

    // ---- 3) Initial creation ----
    const onReady = (event: DockviewReadyEvent) => {
        apiRef.current = event.api;
        syncPanels();
    };

    // ---- 4) Keep Dockview in sync when your visibility changes ----
    useEffect(() => {
        if (!apiRef.current) return;
        syncPanels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visiblePanels]);

    // ---- 5) Your existing cleanup ----
    useEffect(() => {
        return () => onSetMenubarVisibility(false);
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-background text-foreground">
            <div className="flex-1 min-h-0 overflow-hidden">
                {/* pick one theme class; later you can map to your dark/light variables */}
                <DockviewReact
                    components={components}
                    onReady={onReady}
                    className="dockview-theme-abyss h-full w-full"
                    // When user closes a panel via Dockview UI -> sync to your hook state
                    onDidRemovePanel={(e) => {
                        const id = e.id as keyof typeof visiblePanels;
                        if (id && (visiblePanels as any)[id]) {
                            // update your app state
                            onTogglePanel(id as any);
                        }
                    }}
                />
            </div>
            <Toaster />
        </div>
    );
}

export default App;
