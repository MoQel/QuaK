import {Dispatch, SetStateAction, useEffect, useMemo, useState} from "react";

import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {GateLibraryView} from "@/views/library-view/GateLibraryView.tsx";
import {CircuitView} from "@/views/circuit-view/CircuitView.tsx";
import {TextEditorView} from "@/views/text-editor-view/TextEditorView.tsx";
import {ProjectManagerView} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {ResultsView} from "@/views/results-view/ResultsView.tsx";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import {quantumGates, type QuantumGatesInit} from "@/views/circuit-view/InitCircuit.tsx";
import {v4 as uuidv4} from "uuid";
import {Gate} from "./views/Gate";
import {createPortal} from "react-dom";
import {LibraryElement} from "@/views/library-view/LibraryElement.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import {File} from "@/views/project-manager-view/util/FileElement.tsx";
import {InspectorView} from "@/views/inspector-view/InspectorView.tsx";


function App() {

    const INITIAL_QUBITS = 20

    const [matrixState, setMatrixState] = useState<QuantumGate[][]>(
        initializeMatrix(INITIAL_QUBITS, quantumGates)
    )
    const [activeQubit, setActiveQubit] = useState<number>()
    const [activeGate, setActiveGate] = useState<QuantumGate>()
    const [activeLibraryElement, setActiveLibraryElement] = useState<QuantumGate>()

    const maxWireLength = useMemo(() => {
        let max = 0;
        for (const wire of matrixState) {
            max = Math.max(max, wire.length);
        }
        return max;
    }, [matrixState]);

    //Needed so that the gates are clickable and not immediately get into the drag state when clicked on
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 0 // can be adjusted in the future
        }
    }))
    /* Returns the gate object belonging to the gateId */
    const findGate = (gateId: string): QuantumGate | undefined => {
        return matrixState.flat().find(gate => gate.id === gateId)
    }

    /* Returns the qubit ID on which the gate resides */
    const findQubit = (gateId: string) => {
        for (let i = 0; i < matrixState.length; i++) {
            if (matrixState[i].some(gate => gate.id === gateId)) {
                return i
            }
        }
        return -1
    }

    // Returns the last gate that is not a dummy gate
    // If there are no dummy gates, return 0 (first index in array)
    const findLastGate = (row: number) => {
        for (let i = 0; i < matrixState[row].length; i++) {
            if (matrixState[row][i].type === "DUMMY") return Math.max(i - 1, 0);
        }
        return 0
    }


    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);
    const [file, openFile]: [File, Dispatch<SetStateAction<File>>] = useState(undefined as unknown as File);

    const handleDragStart = (e: DragStartEvent) => {
        if (findGate(e.active.id as string)?.type === "DUMMY") {
            console.log("This is a dummy")
            return;
        }
        if (e.active.data.current?.source === "library" && e.active.data.current) {
            const gate: QuantumGate = {
                id: uuidv4(),
                type: e.active.data.current?.type
            }
            setActiveLibraryElement(gate)
        } else {
            setActiveGate(findGate(e.active.id as string))
        }
        return;
    }

    const handleDragOver = (event: DragOverEvent) => {
        const {over} = event
        if (!over) return;
        const overQubit = findQubit(over.id as string)
        if (overQubit !== -1) {
            console.log("THIS IS THE QUBIT INDEX: " + overQubit)
            setActiveQubit(overQubit);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over) return;

        const activeGateId = active.id as string;
        const overGateId = over.id as string;

        if (activeGateId === overGateId) return;
        if (!overGateId) return;
        if (findGate(activeGateId)?.type === "DUMMY") return;

        if (activeLibraryElement) {
            setMatrixState((prev) => {
                const overRow = activeQubit;
                if (overRow === undefined) return prev;

                const overCol = prev[overRow].findIndex(g => g.id === overGateId)
                if (overCol === -1) return prev;

                const newMatrix = prev.map(row => [...row])
                if (findGate(overGateId)?.type === "DUMMY") {
                    newMatrix[overRow].splice(findLastGate(overRow) + 1, 0, activeLibraryElement)
                    console.log("The placed index is: " + (findLastGate(overRow) + 1))
                    return newMatrix
                }

                newMatrix[overRow].splice(overCol, 0, activeLibraryElement)
                return newMatrix
            })
        } else {
            setMatrixState((prev) => {
                const activeRow = findQubit(activeGateId)
                const overRow = activeQubit;

                if (activeRow === -1 || overRow === undefined) {
                    return prev
                }

                const activeCol = prev[activeRow].findIndex(g => g.id === activeGateId)
                const overCol = prev[overRow].findIndex(g => g.id === overGateId)

                if (activeCol === -1 || overCol === -1) return prev;

                const newMatrix = prev.map(row => [...row])
                const [moved] = newMatrix[activeRow].splice(activeCol, 1)

                if (findGate(overGateId)?.type === "DUMMY") {
                    newMatrix[overRow].splice(findLastGate(overRow), 0, moved)
                    return newMatrix
                }

                newMatrix[overRow].splice(overCol, 0, moved)
                return newMatrix
            });
        }
        setActiveGate(undefined)
        setActiveLibraryElement(undefined)
    };

    return (
        <>
            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                collisionDetection={closestCenter}
            >
                <div className="flex flex-col h-screen px-[10px]">
                    <div className="flex flex-row h-2/3">
                        <div className="flex flex-grow-[2] w-full">
                            <ResizablePanelGroup direction="horizontal">
                                <ResizablePanel defaultSize={20}>
                                    <ProjectManagerView onFileSelect={openFile}/>
                                </ResizablePanel>
                                <ResizableHandle withHandle/>
                                <ResizablePanel>
                                    <CircuitView
                                        matrixState={matrixState}
                                        setMatrixState={setMatrixState}
                                        maxWireLength={maxWireLength}
                                    />
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
                        <ResultsView/>
                    </div>
                </div>
                {createPortal(
                    <DragOverlay>
                        {activeGate && <Gate {...activeGate}></Gate>}
                        {activeLibraryElement && <LibraryElement {...activeLibraryElement}></LibraryElement>}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
            <Toaster/>
        </>
    );
}


function initializeMatrix(
    numberOfWires: number,
    gates: QuantumGatesInit[]
): QuantumGate[][] {
    const quantumWires: QuantumGate[][] = []
    for (let i = 0; i < numberOfWires; i++) {
        quantumWires[i] = []
    }
    for (const gate of gates) {
        quantumWires[gate.qubit].push({type: gate.type, id: uuidv4()})
    }
    return quantumWires
}

export default App
