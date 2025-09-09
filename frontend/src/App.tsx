import {useEffect, useState} from "react";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {GateLibraryView} from "@/views/library-view/GateLibraryView.tsx";
import {CircuitView} from "@/views/circuit-view/CircuitView.tsx";
import {TextEditorView} from "@/views/text-editor-view/TextEditorView.tsx";
import {ProjectManagerView} from "@/views/project-manager-view/ProjectManagerView.tsx";
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


function App() {

    const INITIAL_QUBITS = 20
    const GATE_CAPACITY = 60

    const [matrixState, setMatrixState] = useState<QuantumGate[][]>(
        initializeMatrix(INITIAL_QUBITS, GATE_CAPACITY, quantumGates)
    )
    const [activeQubit, setActiveQubit] = useState<number>()
    const [activeGate, setActiveGate] = useState<QuantumGate>()
    const [activeLibraryElement, setActiveLibraryElement] = useState<QuantumGate>()
    //Needed so that the gates are clickable and not immediately get into the drag state when clicked on
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 1
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

    const handleDragStart = (e: DragStartEvent) => {
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
        // highlight target row or save temporary state
        const overQubit = findQubit(over.id as string)
        if (overQubit !== -1) {
            console.log("THIS IS THE QUBIT INDEX: "+ overQubit)
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


        // Matrix update depending on whether it's a gate dragged from the library or within the circuit
        if (activeLibraryElement) {
            setMatrixState((prev) => {
                const overRow = activeQubit;
                if (overRow === undefined) return prev;

                const overCol = prev[overRow].findIndex(g => g.id === overGateId)
                if (overCol === -1) return prev;

                const newMatrix = prev.map(row => [...row])
                if (findGate(overGateId)?.type === "DUMMY") {
                    // index of last Gate + 1, because the library element should be placed at the end
                    newMatrix[overRow].splice(findLastGate(overRow) + 1, 0, activeLibraryElement)
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

                if (activeCol === -1 || overCol === -1) return prev; // same safeguard

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
                <div className="flex flex-col h-screen">
                    <div className="flex flex-row h-2/3">
                        <ProjectManagerView/>
                        <div className="flex flex-grow-[2] w-full">
                            <ResizablePanelGroup direction="horizontal">
                                <ResizablePanel>
                                    <CircuitView
                                        matrixState={matrixState}
                                        setMatrixState={setMatrixState}/>
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
                {createPortal(
                    <DragOverlay>
                        {activeGate && (
                            <Gate {...activeGate}></Gate>
                        )}
                        {activeLibraryElement && (
                            <Gate {...activeLibraryElement}></Gate>
                        )}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </>
    )
}


function initializeMatrix(
    qubits: number,
    steps: number,
    gates: QuantumGatesInit[]
): QuantumGate[][] {
    // Prepare empty matrix filled with dummy gates
    const matrix: QuantumGate[][] = Array.from({length: qubits}, (_, qubitIndex) =>
        Array.from({length: steps}, (_, stepIndex) => ({
            id: `dummy-${qubitIndex}-${stepIndex}`,
            type: 'DUMMY',
            qubit: qubitIndex,
        }))
    );

    // Keep track of next free step for each qubit
    const nextStepPerQubit = new Array(qubits).fill(0);

    // Loop through gates in order
    for (let i = 0; i < gates.length; i++) {
        const gate = gates[i];
        const qubit = gate.qubit;

        // Check qubit valid range
        if (qubit < 0 || qubit >= qubits) continue;

        const step = nextStepPerQubit[qubit];
        if (step >= steps) {
            // No more room in this qubit's timeline
            continue;
        }

        // Place gate at next free step on that qubit
        matrix[qubit][step] = {...gate, id: uuidv4()};

        // Increment next free step for that qubit
        nextStepPerQubit[qubit]++;
    }

    return matrix;
}

export default App
