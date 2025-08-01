import {useEffect} from "react";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {GateLibraryView} from "@/views/library-view/GateLibraryView.tsx";
import {CircuitView} from "@/views/circuit-view/CircuitView.tsx";
import {TextEditorView} from "@/views/text-editor-view/TextEditorView.tsx";
import {ProjectManagerView} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";

function App() {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);
    return (
        <>
            <div className="flex flex-col h-screen px-[10px]">
                <div className="flex flex-row h-2/3">
                    <ProjectManagerView/>
                    <div className="flex flex-grow-[2] w-full">
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel>
                                <CircuitView/>
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                            <ResizablePanel className="flex-col h-full">
                                <TextEditorView/>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>
                <div className="flex flex-grow-[1] flex-row w-full">
                    <GateLibraryView/>
                    <Card className="w-full">
                        <CardContent>
                            inspector
                        </CardContent>
                    </Card>
                    <Card className="w-full">
                        <CardContent>
                            results
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Toaster/>
        </>
    )
}

export default App
