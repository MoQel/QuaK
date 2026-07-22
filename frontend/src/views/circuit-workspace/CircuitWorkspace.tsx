import {
    CircuitDragProvider,
    CircuitPortProvider,
    CircuitView,
    CircuitWorkspaceShell,
    LibraryView,
} from '@quak/circuit-editor';
import { usePanelData } from '@/contexts/panel/PanelDataContext.ts';

import { useEffect, useMemo, useState } from 'react';

import { QuantikzExportButton } from '@/views/circuit-workspace/notation/QuantikzExportButton.tsx';
import { createCircuitService } from '@/views/circuit-workspace/circuitService.ts';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { api } from '@/api/api.ts';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

const LIBRARY_VISIBILITY_STORAGE_KEY = 'circuit-workspace-library-collapsed';

function CircuitWorkspaceContent() {
    const { setSelectedOperation } = usePanelData();
    const { circuit } = useProject();
    const [operations, setOperations] = useState<OperationDefinitionResponse[]>([]);
    const [initialCollapsed] = useState(() => localStorage.getItem(LIBRARY_VISIBILITY_STORAGE_KEY) === 'true');

    // Load the gate library once. The circuit editor itself takes these as data,
    // so it stays renderable without a backend.
    useEffect(() => {
        api.get<OperationDefinitionResponse[]>('/api/operations')
            .then(setOperations)
            .catch((e) => console.error('Failed to fetch quantum operations:', e));
    }, []);

    return (
        <CircuitWorkspaceShell
            defaultCollapsed={initialCollapsed}
            onCollapsedChange={(collapsed) => localStorage.setItem(LIBRARY_VISIBILITY_STORAGE_KEY, String(collapsed))}
            library={<LibraryView operations={operations} onOperationSelect={setSelectedOperation} />}
            editor={<CircuitView circuit={circuit} toolbarStart={<QuantikzExportButton circuit={circuit ?? null} />} />}
        />
    );
}

export function CircuitWorkspace() {
    const { circuit, setCircuit } = useProject();

    // This is where the web IDE decides how circuit edits are persisted: through
    // the backend. The port closes over the current circuit, so it is rebuilt
    // whenever that changes. The VSCode extension injects a different adapter here.
    const port = useMemo(() => createCircuitService(circuit, setCircuit), [circuit, setCircuit]);

    return (
        <CircuitPortProvider port={port}>
            <CircuitDragProvider>
                <CircuitWorkspaceContent />
            </CircuitDragProvider>
        </CircuitPortProvider>
    );
}
