import { usePanelData } from '@/contexts/PanelContext';
import { GateLibraryView } from '@/views/library-view/GateLibraryView';
import { CircuitView } from '@/views/circuit-view/CircuitView';
import { TextEditorView } from '@/views/text-editor-view/TextEditorView';
import { ProjectManagerView } from '@/views/project-manager-view/ProjectManagerView';
import { ResultsView } from '@/views/results-view/ResultsView';
import { InspectorView } from '@/views/inspector-view/InspectorView';

// --- Wrapper Components ---

// HELPER: Ensures the panel never triggers an outer scrollbar
const PanelWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="h-full w-full overflow-hidden relative">{children}</div>
);

const ProjectPanel = () => {
    const { openFile } = usePanelData();
    return (
        <PanelWrapper>
            <ProjectManagerView onFileSelect={openFile} />
        </PanelWrapper>
    );
};

const CircuitPanel = () => {
    const { circuit, setCircuit } = usePanelData();
    return (
        <PanelWrapper>
            <CircuitView circuit={circuit} setCircuit={setCircuit} />
        </PanelWrapper>
    );
};

const CodePanel = () => {
    const { file } = usePanelData();
    return (
        <PanelWrapper>
            <TextEditorView file={file} />
        </PanelWrapper>
    );
};

const LibraryPanel = () => {
    const { setSelectedGate } = usePanelData();
    return (
        <PanelWrapper>
            <GateLibraryView onGateSelect={setSelectedGate} />
        </PanelWrapper>
    );
};

const InspectorPanel = () => {
    const { selectedGate, setSelectedGate } = usePanelData();
    return (
        <PanelWrapper>
            {/* The wrapper clips any 1px border leaks from InspectorView */}
            <InspectorView gate={selectedGate} onClear={() => setSelectedGate(undefined)} />
        </PanelWrapper>
    );
};

const ResultsPanel = () => {
    const { circuit } = usePanelData();
    return (
        <PanelWrapper>
            <ResultsView circuit={circuit} />
        </PanelWrapper>
    );
};

// --- Registry Export ---
export const componentRegistry = {
    file: ProjectPanel,
    circuit: CircuitPanel,
    code: CodePanel,
    library: LibraryPanel,
    inspector: InspectorPanel,
    results: ResultsPanel,
};
