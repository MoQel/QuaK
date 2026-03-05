import { useState, useEffect } from 'react';
import { useLoaderData, useParams } from 'react-router-dom';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { LibraryView } from '@/views/library-view/LibraryView.tsx';
import { CircuitView } from '@/views/circuit-view/CircuitView.tsx';
import { TextEditorView } from '@/views/text-editor-view/TextEditorView.tsx';
import { ProjectManagerView } from '@/views/project-manager-view/ProjectManagerView.tsx';
import { ResultsView } from '@/views/results-view/ResultsView.tsx';
import { InspectorView } from '@/views/inspector-view/InspectorView.tsx';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { useLayout } from '@/hooks/use-layout';
import { useFileSelect } from '@/hooks/useFileSelect.ts';
import { usePreventKeyboardActions } from '@/hooks/usePreventKeyboardActions.ts';

function App() {
    const { projectId } = useParams<{ projectId: string }>();
    const [selectedOperation, setSelectedOperation] = useState<OperationDefinitionResponse | undefined>(undefined);
    const [circuit, setCircuit] = useState<CircuitResponse | undefined>(useLoaderData());
    const handleFileSelect = useFileSelect();

    // prevent globally standard browser behavior
    usePreventKeyboardActions();

    // Use Hook
    const { visiblePanels, topLayout, onTogglePanel, onSetMenubarVisibility } = useLayout();

    const isTopVisible = visiblePanels.file || visiblePanels.circuit || visiblePanels.code;
    const isBottomVisible = visiblePanels.library || visiblePanels.inspector || visiblePanels.results;

    useEffect(() => {
        return () => {
            onSetMenubarVisibility(false);
        };
    }, [onSetMenubarVisibility]);

    const topContainerClass = isBottomVisible ? 'h-[50%]' : 'flex-1';
    const bottomContainerClass = isTopVisible ? 'h-[50%]' : 'flex-1';

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-background text-foreground">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className={`w-full ${isTopVisible ? topContainerClass : 'hidden'}`}>
                    <ResizablePanelGroup direction="horizontal">
                        {visiblePanels.file && (
                            <>
                                <ResizablePanel
                                    defaultSize={topLayout[0]}
                                    minSize={15}
                                    onClose={() => onTogglePanel('file')}
                                >
                                    <ProjectManagerView onFileSelect={handleFileSelect} projectId={projectId} />
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
                    className={`w-full flex min-h-0 border-t border-border divide-x divide-border bg-background ${isBottomVisible ? bottomContainerClass : 'hidden'}`}
                >
                    {visiblePanels.library && (
                        <div className="flex-1 overflow-hidden relative">
                            <LibraryView onOperationSelect={setSelectedOperation} />
                        </div>
                    )}

                    {visiblePanels.inspector && (
                        <div className="flex-1 overflow-hidden relative">
                            <InspectorView
                                operationDefinition={selectedOperation}
                                onClear={() => setSelectedOperation(undefined)}
                            />
                        </div>
                    )}

                    {visiblePanels.results && (
                        <div className="flex-1 overflow-hidden relative">
                            <ResultsView circuit={circuit} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
