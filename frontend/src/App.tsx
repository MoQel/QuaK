import { useEffect, useState } from 'react';

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
                console.log('Global Save prevented');
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    return (
        <>
            <div className="h-full min-h-0 overflow-hidden px-[10px] flex flex-col">
                <div className="flex-3 min-h-0 overflow-hidden">
                    <ResizablePanelGroup direction="horizontal" className="h-full">
                        <ResizablePanel defaultSize={20} className="h-full overflow-hidden">
                            <ProjectManagerView onFileSelect={handleFileSelect} />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel className="h-full overflow-hidden">
                            <CircuitView circuit={circuit} setCircuit={setCircuit} />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel className="flex-col h-full overflow-hidden">
                            <TextEditorView />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>

                <div className="flex-4 min-h-0 overflow-hidden flex w-full">
                    <GateLibraryView onGateSelect={setSelectedGate} />
                    <InspectorView gate={selectedGate} onClear={() => setSelectedGate(undefined)} />
                    <ResultsView circuit={circuit} />
                </div>
            </div>
            <Toaster />
        </>
    );
}

export default App;
