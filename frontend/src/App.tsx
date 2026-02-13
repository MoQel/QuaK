import {useState} from "react";

import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {GateLibraryView} from "@/views/library-view/GateLibraryView.tsx";
import {CircuitView} from "@/views/circuit-view/CircuitView.tsx";
import {TextEditorView} from "@/views/text-editor-view/TextEditorView.tsx";
import {ProjectManagerView} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {ResultsView} from "@/views/results-view/ResultsView.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import {File} from "@/views/project-manager-view/util/FileElement.tsx";
import {InspectorView} from "@/views/inspector-view/InspectorView.tsx";
import {GateDefinitionResponse} from "@/api/dto/library.ts";

function App() {
    const [file, openFile] = useState(undefined as unknown as File);
    const [selectedGate, setSelectedGate] = useState<GateDefinitionResponse | undefined>(undefined);
    const [isGateDragging, setIsGateDragging] = useState(false);
    const [draggingGateSize, setDraggingGateSize] = useState<number>(1);

    return (
        <>
        <div className="h-full min-h-0 overflow-hidden px-[10px] flex flex-col">
            <div className="flex-3 min-h-0 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={20} className="h-full overflow-hidden">
                        <ProjectManagerView onFileSelect={openFile} />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel className="h-full overflow-hidden">
                        <CircuitView
                            isGateDragging={isGateDragging}
                            setIsGateDragging={setIsGateDragging}
                            draggingGateSize={draggingGateSize}
                            setDraggingGateSize={setDraggingGateSize}
                        />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel className="flex-col h-full overflow-hidden">
                        <TextEditorView file={file} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            <div className="flex-4 min-h-0 overflow-hidden flex w-full">
                <GateLibraryView
                    onGateSelect={setSelectedGate}
                    setIsGateDragging={setIsGateDragging}
                    setDraggingGateSize={setDraggingGateSize}
                />
                <InspectorView gate={selectedGate} onClear={() => setSelectedGate(undefined)} />
                <ResultsView numberQubits={5} />
            </div>
        </div>
            <Toaster />
        </>
    );
}


export default App