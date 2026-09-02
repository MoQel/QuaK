import {
    CircuitDragProvider,
    CircuitStoreProvider,
    CircuitView,
    CircuitWorkspaceShell,
    LibraryView,
} from '@quak/circuit-editor';
import { usePanelData } from '@/contexts/panel/PanelDataContext.ts';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CircuitTabBar } from '@/views/circuit-workspace/CircuitTabBar.tsx';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';
import { api } from '@/api/api.ts';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

const LIBRARY_VISIBILITY_STORAGE_KEY = 'circuit-workspace-library-collapsed';

function CircuitWorkspaceContent() {
    const { setSelectedOperation } = usePanelData();
    const { activeCircuitTabId, activeCircuit, activeCircuitError, activeCircuitLoading, reloadActiveCircuit } =
        useCircuitTabs();
    const [operations, setOperations] = useState<OperationDefinitionResponse[]>([]);
    const [initialCollapsed] = useState(() => localStorage.getItem(LIBRARY_VISIBILITY_STORAGE_KEY) === 'true');

    // Load the gate library once. The circuit editor itself takes these as data,
    // so it stays renderable without a backend.
    useEffect(() => {
        api.get<OperationDefinitionResponse[]>('/api/operations')
            .then(setOperations)
            .catch((e) => console.error('Failed to fetch quantum operations:', e));
    }, []);

    // A file can be open while its circuit is still being fetched, or after the
    // fetch failed. Both are web-IDE states (the extension parses the open
    // document synchronously), so they are decided here, not in the shared editor.
    const renderEditor = () => {
        if (!activeCircuitTabId) return <NoFileOpen />;
        if (!activeCircuit) {
            return (
                <CircuitUnavailable
                    error={activeCircuitError}
                    loading={activeCircuitLoading}
                    onRetry={reloadActiveCircuit}
                />
            );
        }
        return <CircuitView header={<CircuitTabBar />} />;
    };

    return (
        <CircuitWorkspaceShell
            defaultCollapsed={initialCollapsed}
            onCollapsedChange={(collapsed) => localStorage.setItem(LIBRARY_VISIBILITY_STORAGE_KEY, String(collapsed))}
            library={<LibraryView operations={operations} onOperationSelect={setSelectedOperation} />}
            editor={renderEditor()}
        />
    );
}

// Circuits exist per file only, so without an active file tab there is nothing to
// show. Mirrors the Code Editor's "No file open" state. This is a web-IDE concept,
// which is why it lives here and not in the shared editor.
function NoFileOpen() {
    return (
        <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
            <CardContent className="flex h-full items-center justify-center p-0 text-gray-500">
                No file open
            </CardContent>
        </Card>
    );
}

function CircuitUnavailable({
    error,
    loading,
    onRetry,
}: Readonly<{ error: string | null; loading: boolean; onRetry: () => void }>) {
    return (
        <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
            <CardContent className="flex flex-col h-full p-0">
                <CircuitTabBar />
                <div className="flex flex-1 items-center justify-center p-6 text-center">
                    <div className="max-w-sm rounded-xl border border-dashed border-border bg-background/80 p-6 shadow-sm">
                        <div className="text-sm font-semibold text-text">
                            {error ? 'Circuit could not be loaded' : 'Loading circuit'}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {error ??
                                (loading
                                    ? 'The circuit for this file is being prepared.'
                                    : 'The circuit is not available yet.')}
                        </p>
                        {error && (
                            <Button className="mt-4" size="sm" onClick={onRetry}>
                                Retry
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function CircuitWorkspace() {
    const { activeCircuit, setActiveCircuit } = useCircuitTabs();

    // This is where the web IDE decides what an edit means: a local change plus the
    // debounced full-circuit save in CircuitTabsContext. The extension provides the
    // same two values backed by the .qasm document instead.
    return (
        <CircuitStoreProvider circuit={activeCircuit} setCircuit={setActiveCircuit}>
            <CircuitDragProvider>
                <CircuitWorkspaceContent />
            </CircuitDragProvider>
        </CircuitStoreProvider>
    );
}
