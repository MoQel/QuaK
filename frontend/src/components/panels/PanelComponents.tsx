import { usePanelData } from '@/contexts/panel/PanelDataContext';
import { LibraryView } from '@/views/library-view/LibraryView.tsx';
import { CircuitView } from '@/views/circuit-view/CircuitView';
import { TextEditorView } from '@/views/text-editor-view/TextEditorView';
import { ProjectManagerView } from '@/views/project-manager-view/ProjectManagerView';
import { ResultsView } from '@/views/results-view/ResultsView';
import { InspectorView } from '@/views/inspector-view/InspectorView';
import { useFileSelect } from '@/hooks/useFileSelect';
import { useParams } from 'react-router-dom';

const PanelWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="h-full w-full overflow-hidden relative">{children}</div>
);

export const ProjectPanel = () => {
    const handleFileSelect = useFileSelect();
    const { projectId } = useParams<{ projectId: string }>();
    return <ProjectManagerView onFileSelect={handleFileSelect} projectId={projectId} />;
};

export const CircuitPanel = () => {
    const { circuit, setCircuit } = usePanelData();
    return <CircuitView circuit={circuit} setCircuit={setCircuit} />;
};

export const CodePanel = () => {
    return <TextEditorView />;
};

export const LibraryPanel = () => {
    const { setSelectedOperation } = usePanelData();
    return <LibraryView onOperationSelect={setSelectedOperation} />;
};

export const InspectorPanel = () => {
    const { selectedOperation, setSelectedOperation } = usePanelData();
    return (
        <PanelWrapper>
            <InspectorView operationDefinition={selectedOperation} onClear={() => setSelectedOperation(undefined)} />
        </PanelWrapper>
    );
};

export const ResultsPanel = () => {
    const { circuit } = usePanelData();
    return <ResultsView circuit={circuit} />;
};
