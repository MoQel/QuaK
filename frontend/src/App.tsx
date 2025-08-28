import {useEffect, useState} from "react";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {GateLibraryView} from "@/views/library-view/GateLibraryView.tsx";
import {CircuitView} from "@/views/circuit-view/CircuitView.tsx";
import {TextEditorView} from "@/views/text-editor-view/TextEditorView.tsx";
import {ProjectManagerView} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {closestCorners, DndContext, DragEndEvent} from "@dnd-kit/core";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import {quantumGates, type QuantumGatesInit} from "@/views/circuit-view/InitCircuit.tsx";
import {arrayMove} from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";


function App() {

    const INITIAL_QUBITS = 20
    const GATE_CAPACITY = 60

    const [matrixState, setMatrixState] = useState<QuantumGate[][]>(
        initializeMatrix(INITIAL_QUBITS, GATE_CAPACITY, quantumGates)
    )

    const findGate = (gateId: string) => {
        return matrixState.flat().find(gate => gate.id === gateId)
    }



    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;

        if (!over) return;
        const activeGateId = active.id as string
        const overGateId = over.id as string;

        console.log(`Dropped item ${activeGateId} on wire ${overGateId}`);

        if (!(findGate(overGateId)?.type == 'DUMMY') && activeGateId !== overGateId) {
            setMatrixState((prev) => {
                // Find which row (wire) the active gate is in
                const rowIndex = prev.findIndex((row) =>
                    row.some((g) => g.id === activeGateId)
                );
                if (rowIndex === -1) return prev;

                const row = prev[rowIndex];
                const oldIndex = row.findIndex((g) => g.id === activeGateId);
                const newIndex = row.findIndex((g) => g.id === overGateId);

                // Apply arrayMove only within that row
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
            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
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
