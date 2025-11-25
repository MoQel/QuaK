import { Dispatch, SetStateAction, useMemo, useState } from "react";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable.tsx";
import { GateLibraryView } from "@/views/library-view/GateLibraryView.tsx";
import { CircuitView } from "@/views/circuit-view/CircuitView.tsx";
import { TextEditorView } from "@/views/text-editor-view/TextEditorView.tsx";
import { ProjectManagerView } from "@/views/project-manager-view/ProjectManagerView.tsx";
import { ResultsView } from "@/views/results-view/ResultsView.tsx";
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
import { QuantumGate } from "@/views/QuantumGate.tsx";
import { quantumGates, type QuantumGatesInit } from "@/views/circuit-view/InitCircuit.tsx";
import { v4 as uuidv4 } from "uuid";
import { Gate } from "./views/circuit-view/Gate.tsx";
import { createPortal } from "react-dom";
import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { File } from "@/views/project-manager-view/util/FileElement.tsx";
import { InspectorView } from "@/views/inspector-view/InspectorView.tsx";
import { matrixContext } from "./Context"


function App() {
    const INITIAL_QUBITS = 20

    const [matrixState, setMatrixState] = useState<QuantumGate[][]>(
        initializeMatrix(INITIAL_QUBITS, quantumGates)
    )
    const [activeQubit, setActiveQubit] = useState<number>()
    const [activeGate, setActiveGate] = useState<QuantumGate>()
    const [activeLibraryElement, setActiveLibraryElement] = useState<QuantumGate>()

    //returns the number of gates of the qubit with the most gates
    const maxQubitLength = useMemo(() => {
        let max = 0;
        for (const wire of matrixState) {
            max = Math.max(max, wire.length);
        }
        return max;
    }, [matrixState]);

    //Needed so that the gates are clickable and not immediately get into the drag state when clicked on
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 3 // can be adjusted in the future
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


    const [file, openFile]: [File, Dispatch<SetStateAction<File>>] = useState(undefined as unknown as File);

    //Creates new gate based on the type of the library element
    function createNewGate(e: DragStartEvent) {
        const gate: QuantumGate = {
            id: uuidv4(),
            type: e.active.data.current?.type
        }
        return gate;
    }

    const handleDragStart = (e: DragStartEvent) => {
        if (findGate(e.active.id as string)?.type === "DUMMY") {
            console.log("This is a dummy")
            return;
        }
        if (e.active.data.current?.source === "library" && e.active.data.current) {
            const gate = createNewGate(e);
            setActiveLibraryElement(gate)
        } else {
            setActiveGate(findGate(e.active.id as string))
        }
        return;
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event
        if (!over) return;
        const overQubit = findQubit(over.id as string)
        if (overQubit !== -1) {
            setActiveQubit(overQubit);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeGateId = active.id as string;
        const overGateId = over.id as string;

        if (activeGateId === overGateId) return;
        if (!overGateId) return;
        if (findGate(activeGateId)?.type === "DUMMY") return;

        if (activeLibraryElement) {
            moveLibraryGate(setMatrixState, activeQubit, overGateId, findGate, findLastGate, activeLibraryElement);
        } else {
            moveCircuitGate(setMatrixState, findQubit, activeGateId, activeQubit, overGateId, findGate, findLastGate);
        }
        setActiveGate(undefined)
        setActiveLibraryElement(undefined)
    };

    const removeGate = (gateId: string) => {
        console.log("Remove gate")
        setMatrixState((prev) =>
            prev.map((row) =>
                row.filter((gate) => gate.id !== gateId) // new array for each row
            )
        );
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
                <div className="flex flex-col h-full px-[10px]">
                    <div className="flex flex-row h-2/3">
                        <div className="flex flex-grow-[2] w-full">
                            <ResizablePanelGroup direction="horizontal">
                                <ResizablePanel defaultSize={20}>
                                    <ProjectManagerView onFileSelect={openFile} />
                                </ResizablePanel>
                                <ResizableHandle withHandle />
                                <ResizablePanel>
                                    {/*
                                        To avoid prop drilling,
                                        use context provider that shares arguments to its children, without passing them
                                    */}
                                    <matrixContext.Provider value={{ matrixState, setMatrixState, removeGate }}>
                                        <CircuitView
                                            maxWireLength={maxQubitLength}
                                        />
                                    </matrixContext.Provider>
                                </ResizablePanel>
                                <ResizableHandle withHandle />
                                <ResizablePanel className="flex-col h-full">
                                    <TextEditorView file={file} />
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        </div>
                    </div>
                    <div className="flex flex-grow-[1] flex-row w-full">
                        <GateLibraryView />
                        <InspectorView />
                        <ResultsView numberQubits={5} />
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
            <Toaster />
        </>
    );
}


function initializeMatrix(
    numberOfQubits: number,
    gates: QuantumGatesInit[]
): QuantumGate[][] {
    const quantumWires: QuantumGate[][] = []
    for (let i = 0; i < numberOfQubits; i++) {
        quantumWires[i] = []
    }
    for (const gate of gates) {
        quantumWires[gate.qubit].push({ type: gate.type, id: uuidv4() })
    }

    for (let i = 0; i < numberOfQubits; i++) {
        quantumWires[i].push({ type: "DUMMY", id: uuidv4() })
    }
    return quantumWires
}

function moveLibraryGate(setMatrixState: (value: (((prevState: QuantumGate[][]) => QuantumGate[][]) | QuantumGate[][])) => void, activeQubit: number | undefined, overGateId: string, findGate: (gateId: string) => (QuantumGate | undefined), findLastGate: (row: number) => (number), activeLibraryElement: QuantumGate) {
    setMatrixState((prev) => {
        const overRow = activeQubit;
        if (overRow === undefined) return prev;

        const overCol = prev[overRow].findIndex(g => g.id === overGateId)
        if (overCol === -1) return prev;

        const newMatrix = prev.map(row => [...row])
        if (findGate(overGateId)?.type === "DUMMY") {
            newMatrix[overRow].splice(findLastGate(overRow), 0, activeLibraryElement)
            console.log("The placed index is: " + (findLastGate(overRow) + 1))
            return newMatrix
        }

        newMatrix[overRow].splice(overCol, 0, activeLibraryElement)
        return newMatrix
    })
}

function moveCircuitGate(setMatrixState: (value: (((prevState: QuantumGate[][]) => QuantumGate[][]) | QuantumGate[][])) => void, findQubit: (gateId: string) => (number | number), activeGateId: string, activeQubit: number | undefined, overGateId: string, findGate: (gateId: string) => (QuantumGate | undefined), findLastGate: (row: number) => (number | number)) {
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


export default App
