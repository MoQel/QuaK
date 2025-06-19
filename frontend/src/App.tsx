import {useEffect} from "react";
import styles from './App.module.css'
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import QLPEditor from "./components/ui/QLPEditor";
import GateLibrary from "./components/GateLibrary";

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
                                <span className={styles.lines}>
                                    <span className={styles.gate}>
                                        X
                                    </span>
                                </span>
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                            <ResizablePanel>
                                <QLPEditor/>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>
                <div className="flex flex-grow-[1] flex-row w-full">
                    <div className="border-2 border-amber-200 w-full">
                        <div className={styles.availableGateContainer}>
                            <GateLibrary/>
                        </div>
                    </div>
                    <div className="border-2 border-amber-200 w-full">inspector</div>
                    <div className="border-2 border-amber-200 w-full">results</div>
                </div>
            </div>
        </>
    )
}

export default App
