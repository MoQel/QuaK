import {
    ProjectPanel,
    CircuitPanel,
    CodePanel,
    InspectorPanel,
    ResultsPanel,
} from '@/components/panels/PanelComponents';

export const componentRegistry = {
    file: ProjectPanel,
    circuit: CircuitPanel,
    code: CodePanel,
    inspector: InspectorPanel,
    results: ResultsPanel,
};
