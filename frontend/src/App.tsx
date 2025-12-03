import {Dispatch, SetStateAction, useEffect, useState} from "react";

import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {GateLibraryView} from "@/views/library-view/GateLibraryView.tsx";
import {CircuitView} from "@/views/circuit-view/CircuitView.tsx";
import {TextEditorView} from "@/views/text-editor-view/TextEditorView.tsx";
import {ProjectManagerView} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {ResultsView} from "@/views/results-view/ResultsView.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import {File} from "@/views/project-manager-view/util/FileElement.tsx";
import {InspectorView} from "@/views/inspector-view/InspectorView.tsx";

function App() {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);
    const [file, openFile]: [File, Dispatch<SetStateAction<File>>] = useState(undefined as unknown as File);

    return (
        <>
            <div className="flex flex-col h-screen px-[10px]">
                <div className="flex flex-row h-2/3">
                    <div className="flex flex-grow-[2] w-full">
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel defaultSize={20}>
                                <ProjectManagerView onFileSelect={openFile}/>
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                            <ResizablePanel>
                                    <CircuitView />
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                            <ResizablePanel className="flex-col h-full">
                                <TextEditorView file={file}/>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>
                <div className="flex flex-grow-[1] flex-row w-full">
                    <GateLibraryView/>
                    <InspectorView/>
                    <ResultsView numberQubits={5}/>
                </div>
            </div>
            <Toaster/>
        </>
    );
}

export default App