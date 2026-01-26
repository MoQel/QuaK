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
import {IdeMenubar} from "@/components/MenuBar.tsx";

function App() {
    const [file, openFile] = useState(undefined as unknown as File);
    const [selectedGate, setSelectedGate] = useState<GateDefinitionResponse | undefined>(undefined);

    const togglePanel = (key: keyof typeof visiblePanels) => {
        setVisiblePanels(prev => ({ ...prev, [key]: !prev[key] }));
    };
    const [visiblePanels, setVisiblePanels] = useState({
        file: true,
        circuit: true,
        code: true,
        results: true,
        inspector: true,
        library: true,
    });

    const resetLayout = () => {
        setVisiblePanels({
            file: true,
            circuit: true,
            code: true,
            results: true,
            inspector: true,
            library: true,
        });
    };
    const isTopVisible = visiblePanels.file || visiblePanels.circuit || visiblePanels.code;
    const isBottomVisible = visiblePanels.library || visiblePanels.inspector || visiblePanels.results;



    return (
        <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-background text-foreground">
            <IdeMenubar visiblePanels={visiblePanels} togglePanel={togglePanel} resetLayout={resetLayout} />
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            <div className={`w-full ${!isTopVisible ? "hidden" : (isBottomVisible ? "h-[30%]" : "flex-1")}`}>
                <ResizablePanelGroup direction="horizontal">

                    {visiblePanels.file && (
                        <>
                            <ResizablePanel defaultSize={20} minSize={15}>
                                <ProjectManagerView onFileSelect={openFile} />
                            </ResizablePanel>
                            {(visiblePanels.circuit || visiblePanels.code) && <ResizableHandle withHandle />}
                        </>
                    )}

                    {visiblePanels.circuit && (
                        <>
                            <ResizablePanel defaultSize={50}>
                                <CircuitView />
                            </ResizablePanel>
                            {visiblePanels.code && <ResizableHandle withHandle />}
                        </>
                    )}

                    {visiblePanels.code && (
                        <ResizablePanel defaultSize={30}>
                            <TextEditorView file={file} />
                        </ResizablePanel>
                    )}
                </ResizablePanelGroup>
            </div>


                <div className={`w-full flex min-h-0 border-t border-border divide-x divide-border bg-background ${!isBottomVisible ? "hidden" : (isTopVisible ? "h-[70%]" : "flex-1")}`}>                {visiblePanels.library && (
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
                        <ResultsView numberQubits={5} />
                    </div>
                )}
            </div>

            <Toaster />
            </div>
        </div>
    );
}


export default App