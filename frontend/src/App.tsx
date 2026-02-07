import { useState, useEffect } from 'react';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
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
import { useLayout } from '@/hooks/use-layout';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { openTab } from '@/store/slices/tabsSlice.ts';

function App() {
    const [selectedGate, setSelectedGate] = useState<GateDefinitionResponse | undefined>(undefined);
    const [circuit, setCircuit] = useState<CircuitResponse | null>(null);
    const dispatch = useAppDispatch();

    const handleFileSelect = (file: File) => {
        dispatch(
            openTab({
                id: file.id,
                title: file.name,
            }),
        );
    };

    // prevent globally standard browser behavior of ctrl + s
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
            }
        };
        globalThis.addEventListener('keydown', handleGlobalKeyDown);
        return () => globalThis.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // Use Hook
    const { visiblePanels, topLayout, onTogglePanel, onSetMenubarVisibility } = useLayout();

    const isTopVisible = visiblePanels.file || visiblePanels.circuit || visiblePanels.code;
    const isBottomVisible = visiblePanels.library || visiblePanels.inspector || visiblePanels.results;

    useEffect(() => {
        return () => {
            onSetMenubarVisibility(false);
        };
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-background text-foreground">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className={`w-full ${!isTopVisible ? 'hidden' : isBottomVisible ? 'h-[30%]' : 'flex-1'}`}>
                    <ResizablePanelGroup direction="horizontal">
                        {visiblePanels.file && (
                            <>
                                <ResizablePanel
                                    defaultSize={topLayout[0]}
                                    minSize={15}
                                    onClose={() => onTogglePanel('file')}
                                >
                                    <ProjectManagerView onFileSelect={handleFileSelect} />
                                </ResizablePanel>
                                {(visiblePanels.circuit || visiblePanels.code) && <ResizableHandle withHandle />}
                            </>
                        )}

                        {visiblePanels.circuit && (
                            <>
                                <ResizablePanel defaultSize={topLayout[1]} onClose={() => onTogglePanel('circuit')}>
                                    <CircuitView circuit={circuit} setCircuit={setCircuit} />
                                </ResizablePanel>
                                {visiblePanels.code && <ResizableHandle withHandle />}
                            </>
                        )}

                        {visiblePanels.code && (
                            <ResizablePanel defaultSize={topLayout[2]} onClose={() => onTogglePanel('code')}>
                                <TextEditorView />
                            </ResizablePanel>
                        )}
                    </ResizablePanelGroup>
                </div>

                <div
                    className={`w-full flex min-h-0 border-t border-border divide-x divide-border bg-background ${!isBottomVisible ? 'hidden' : isTopVisible ? 'h-[70%]' : 'flex-1'}`}
                >
                    {visiblePanels.library && (
                        <div className="flex-1 overflow-hidden relative">
                            <GateLibraryView onGateSelect={setSelectedGate} />
                        </div>
                    )}

                    {visiblePanels.inspector && (
                        <div className="flex-1 overflow-hidden relative">
                            <InspectorView gate={selectedGate} onClear={() => setSelectedGate(undefined)} />
                        </div>
                    )}

                    {visiblePanels.results && (
                        <div className="flex-1 overflow-hidden relative">
                            <ResultsView circuit={circuit} />
                        </div>
                    )}
                </div>

                <Toaster />
            </div>
        </div>
    );
}

export default App;
