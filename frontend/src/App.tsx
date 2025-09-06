import {useEffect, useState} from "react";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {GateLibraryView} from "@/views/library-view/GateLibraryView.tsx";
import {CircuitView} from "@/views/circuit-view/CircuitView.tsx";
import {TextEditorView} from "@/views/text-editor-view/TextEditorView.tsx";
import {ProjectManagerView} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {closestCorners, DndContext, DragEndEvent, DragOverEvent} from "@dnd-kit/core";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import {quantumGates, type QuantumGatesInit} from "@/views/circuit-view/InitCircuit.tsx";
import {arrayMove} from "@dnd-kit/sortable";
import {v4 as uuidv4} from "uuid";


function App() {

    const INITIAL_QUBITS = 20
    const GATE_CAPACITY = 60

    const [matrixState, setMatrixState] = useState<QuantumGate[][]>(
        initializeMatrix(INITIAL_QUBITS, GATE_CAPACITY, quantumGates)
    )

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

    const findLastGate = (row: number) => {
        for (let i = 0; i < matrixState[row].length; i++) {
            if (matrixState[row][i].type === "DUMMY") return i - 1;
        }
        return -1
    }


    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeGateId = active.id as string;
        const overGateId = over.id as string;

        const activeGate = findGate(activeGateId);

        const activeQubitId = findQubit(activeGateId);
        const overQubitId = findQubit(overGateId);

        //Guard: IDs ungültig
        if (!activeQubitId || !overQubitId) return;

        if (activeQubitId === overQubitId && activeGateId !== overGateId) return;

        //Wenn gleiche Qubit → nichts tun (innerhalb macht DragEnd)
        if (activeQubitId === overQubitId) return;

        if (!activeGate || activeGate.type === "DUMMY") return;

        setMatrixState((prev) => {
            // Find source wire
            const sourceRowIndex = prev.findIndex((row) =>
                row.some((g) => g.id === activeGateId)
            );
            // If source wire does not exist, leave state as is
            if (sourceRowIndex === -1) return prev;

            const sourceRow = [...prev[sourceRowIndex]];
            const gateIndex = sourceRow.findIndex((g) => g.id === activeGateId);
            if (gateIndex === -1) return prev;

            const [movedGate] = sourceRow.splice(gateIndex, 1);
            console.log(movedGate.type)

            // Ziel-Wire finden
            const targetRowIndex = prev.findIndex((row) =>
                row.some((g) => g.id === overGateId)
            );
            if (targetRowIndex === -1) return prev;

            const targetRow = [...prev[targetRowIndex]];
            const overIndex = targetRow.findIndex((g) => g.id === overGateId);

            // Gate einfügen (z.B. vor overGate)
            targetRow.splice(overIndex, 0, movedGate);

            // Neues State zurückgeben
            return prev.map((row, idx) => {
                if (idx === sourceRowIndex) return sourceRow;
                if (idx === targetRowIndex) return targetRow;
                return row;
            });
        });

        console.log(`Preview: ${findGate(activeGateId)?.type} von ${activeQubitId} zu ${overQubitId}`);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;

        if (!over) return;

        const activeGateId = active.id as string
        const overGateId = over.id as string

        const activeGate = findGate(activeGateId);
        const overGate = findGate(overGateId);

        if (!activeGate || !overGate) return;
        if (activeGate.type === "DUMMY") return;

        console.log(`Dropped item ${activeGateId} on wire ${overGateId}`);

        if (activeGateId !== overGateId) {
            setMatrixState((prev):QuantumGate[][] => {
                // Find which row (wire) the active gate is in
                const rowIndex = prev.findIndex((row) =>
                    row.some((g) => g.id === activeGateId)
                );
                if (rowIndex === -1) return prev;

                const row = prev[rowIndex];
                const oldIndex = row.findIndex((g) => g.id === activeGateId);

                if (overGate.type === "DUMMY") {
                    console.log("DROPPED OVER DUMMY")
                    const newRow =
                        [
                            ...row.slice(0, oldIndex - 1),
                            ...row.slice(oldIndex + 1, findLastGate(rowIndex)),
                            activeGate,
                            ...row.slice(findLastGate(rowIndex), row.length - 1)
                        ]
                    console.log(newRow);
                    return [
                        ...prev.slice(0 , rowIndex),
                        newRow,
                        ...prev.slice(rowIndex + 1),
                    ];
                }
                const newIndex = row.findIndex((g) => g.id === overGateId);

                const newRow = arrayMove(row, oldIndex, newIndex);

                // Return new state with updated row
                return [
                    ...prev.slice(0, rowIndex),
                    newRow,
                    ...prev.slice(rowIndex + 1),
                ];
            });
        }
    }
    return (
        <>
            <DndContext
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                collisionDetection={closestCorners}
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
            </DndContext>
        </>
    )
}

function findQubit(gateId: string): QuantumGate {
    return
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
