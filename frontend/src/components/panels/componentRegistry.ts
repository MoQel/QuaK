import {
    ProjectPanel,
    CircuitPanel,
    CodePanel,
    LibraryPanel,
    InspectorPanel,
    ResultsPanel,
} from '@/components/panels/PanelComponents';

export const componentRegistry = {
    file: ProjectPanel,
    circuit: CircuitPanel,
    code: CodePanel,
    library: LibraryPanel,
    inspector: InspectorPanel,
    results: ResultsPanel,
};
