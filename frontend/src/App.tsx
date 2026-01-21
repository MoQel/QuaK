import {Dispatch, SetStateAction, useState} from "react";

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

    return (
        <>
            <div className="flex flex-col h-full overflow-hidden px-[10px]">
                <div className="flex flex-row h-2/3 overflow-hidden">
                    <div className="flex flex-grow-[2] w-full overflow-hidden">
                        <ResizablePanelGroup direction="horizontal" className="h-full">
                            <ResizablePanel defaultSize={20} className="h-full overflow-hidden">
                                <ProjectManagerView onFileSelect={openFile} />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel className="h-full overflow-hidden">
                                <CircuitView />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel className="flex-col h-full overflow-hidden">
                                <TextEditorView file={file} />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>

                <div className="flex flex-grow flex-row w-full overflow-hidden">
                    <GateLibraryView onGateSelect={setSelectedGate} />
                    <InspectorView gate={selectedGate} onClear={() => setSelectedGate(undefined)} />
                    <ResultsView numberQubits={5} />
                </div>
            </div>

            <Toaster />
        </>
    );
}


export default App