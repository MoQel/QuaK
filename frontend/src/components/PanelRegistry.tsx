import { usePanelData } from '@/contexts/PanelContext';
import { GateLibraryView } from '@/views/library-view/GateLibraryView';
import { CircuitView } from '@/views/circuit-view/CircuitView';
import { TextEditorView } from '@/views/text-editor-view/TextEditorView';
import { ProjectManagerView } from '@/views/project-manager-view/ProjectManagerView';
import { ResultsView } from '@/views/results-view/ResultsView';
import { InspectorView } from '@/views/inspector-view/InspectorView';
import { useFileSelect } from '@/hooks/useFileSelect';

const ProjectPanel = () => {
    const handleFileSelect = useFileSelect();
    return <ProjectManagerView onFileSelect={handleFileSelect} />;
};

const CircuitPanel = () => {
    const { circuit, setCircuit } = usePanelData();
    return <CircuitView circuit={circuit} setCircuit={setCircuit} />;
};

const CodePanel = () => {
    return <TextEditorView />;
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

// --- Registry Export ---
export const componentRegistry = {
    file: ProjectPanel,
    circuit: CircuitPanel,
    code: CodePanel,
    library: LibraryPanel,
    inspector: InspectorPanel,
    results: ResultsPanel,
};
