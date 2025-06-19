import {useEffect} from "react";
import styles from './App.module.css'
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import QLPEditor from "./components/ui/QLPEditor";
import GateLibrary from "./components/GateLibrary";
import {Card, CardContent} from "@/components/ui/card.tsx";

function App() {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);
    return (
        <>
            <div className="flex flex-col h-screen px-[10px]">
                <div className="flex flex-row h-2/3">
                    <div className="border-2 border-amber-200 w-1/4">project manager</div>
                    <div className="flex flex-grow-[2] w-full">
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel>
                                <Card className="h-full">
                                    <CardContent>
                                <span className={styles.lines}>
                                    <span className={styles.gate}>
                                        X
                                    </span>
                                </span>
                                    </CardContent>
                                </Card>
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                            <ResizablePanel>
                                <Card className="h-full">
                                    <CardContent>
                                        <QLPEditor/>
                                    </CardContent>
                                </Card>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>
                <div className="flex flex-grow-[1] flex-row w-full">
                    <Card className="w-full">
                        <CardContent>
                            <div className={styles.availableGateContainer}>
                                <GateLibrary/>
                            </div>
                        </CardContent>
                    </Card>
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
        </>
    )
}

export default App
