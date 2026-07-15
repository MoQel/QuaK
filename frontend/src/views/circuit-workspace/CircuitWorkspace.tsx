import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { Button } from '@/components/ui/button.tsx';
import { usePanelData } from '@/contexts/panel/PanelDataContext.ts';
import { CircuitView } from '@/views/circuit-workspace/circuit/CircuitView.tsx';
import { LibraryView } from '@/views/circuit-workspace/library/LibraryView.tsx';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CircuitDragProvider } from '@/views/circuit-workspace/CircuitDragContext.tsx';
import { CircuitPortProvider } from '@/views/circuit-workspace/CircuitPortContext.tsx';
import { createCircuitService } from '@/views/circuit-workspace/circuit/util/circuitService.ts';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { api } from '@/api/api.ts';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

const LIBRARY_DEFAULT_SIZE = 30;
const LIBRARY_MIN_SIZE = 20;
const LIBRARY_MAX_SIZE = 40;
const LIBRARY_VISIBILITY_STORAGE_KEY = 'circuit-workspace-library-collapsed';

function CircuitWorkspaceContent() {
    const { setSelectedOperation } = usePanelData();
    const { circuit } = useProject();
    const [operations, setOperations] = useState<OperationDefinitionResponse[]>([]);
    const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(
        () => localStorage.getItem(LIBRARY_VISIBILITY_STORAGE_KEY) === 'true',
    );

    // Load the gate library once. The circuit editor itself takes these as data,
    // so it stays renderable without a backend.
    useEffect(() => {
        api.get<OperationDefinitionResponse[]>('/api/operations')
            .then(setOperations)
            .catch((e) => console.error('Failed to fetch quantum operations:', e));
    }, []);

    const toggleLibrary = () => {
        setIsLibraryCollapsed((currentValue) => {
            const nextValue = !currentValue;
            localStorage.setItem(LIBRARY_VISIBILITY_STORAGE_KEY, String(nextValue));
            return nextValue;
        });
    };

    if (isLibraryCollapsed) {
        return (
            <div className="flex h-full min-h-0 w-full bg-bg-subtle">
                <aside className="flex w-12 shrink-0 justify-center border-r border-border pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleLibrary}
                        className="h-9 w-9"
                        title="Expand library"
                        aria-label="Expand library"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                </aside>

                <div className="min-w-0 flex-1">
                    <CircuitView circuit={circuit} />
                </div>
            </div>
        );
    }

    return (
        <ResizablePanelGroup
            autoSaveId="circuit-workspace-layout"
            direction="horizontal"
            className="relative min-h-0 bg-bg-subtle"
        >
            <ResizablePanel
                id="circuit-library"
                order={0}
                defaultSize={LIBRARY_DEFAULT_SIZE}
                minSize={LIBRARY_MIN_SIZE}
                maxSize={LIBRARY_MAX_SIZE}
                className="min-w-[200px] overflow-hidden"
            >
                <LibraryView operations={operations} onOperationSelect={setSelectedOperation} />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel id="circuit-editor" order={1} minSize={40} className="min-w-0">
                <CircuitView circuit={circuit} />
            </ResizablePanel>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleLibrary}
                className="absolute left-2 top-1 z-20 h-9 w-9"
                title="Collapse library"
                aria-label="Collapse library"
            >
                <PanelLeftClose className="h-4 w-4" />
            </Button>
        </ResizablePanelGroup>
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
