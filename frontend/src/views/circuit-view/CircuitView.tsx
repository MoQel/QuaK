import {Card, CardContent} from "@/components/ui/card.tsx";
import {QuantumWires} from "@/views/circuit-view/QuantumWires.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";
import {CircuitState} from "@/type/quantum.tsx";
import {useCallback, useState} from "react";
import {quantumGates} from "@/views/circuit-view/InitCircuit.tsx";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";

export function CircuitView() {
    const WIRE_LENGTH = 1000


    const [circuitState, setCircuitState] = useState<CircuitState>({
        qubits: 3,
        steps: 40,
    });

    const [matrixState, setMatrixState] = useState<QuantumGate[][]>(
        initializeMatrix(15, 60, quantumGates)
    )

    const removeQubit = useCallback(() => {
        setCircuitState(prev => ({
            qubits: Math.max(prev.qubits - 1, 1),
            steps: prev.steps,
        }));
    }, []);

    const addQubit = useCallback(() => {
        setCircuitState(prev => ({
            qubits: Math.min(prev.qubits + 1, 20),
            steps: prev.steps,
        }));
    }, []);

    const resetCircuit = useCallback(() => {
        setCircuitState(prev => ({
            qubits: 1,
            steps: prev.steps,
        }));
        setMatrixState(initializeMatrix(1, 0, []))
    }, []);

    return (
        <Card className="h-full overflow-scroll">
            <CardContent>
                <div className="">
                    <div className="pb-5 flex justify-end space-x-3">
                        <Button onClick={addQubit} size="icon" className="size-8">
                            <Plus/>
                        </Button>
                        <Button onClick={removeQubit} size="icon" className="size-8">
                            <Minus/>
                        </Button>
                        <Button onClick={resetCircuit} size="icon" className="size-8">
                            <Trash/>
                        </Button>
                    </div>
                    <div>
                        {Array.from({length: circuitState.qubits}).map((_, qubitIndex) => (
                            <QuantumWires
                                gates={matrixState[qubitIndex] ?? []}
                                qubitIndex={qubitIndex}
                                length={WIRE_LENGTH}
                            />
                        ))
                        }
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function initializeMatrix(
    qubits: number,
    steps: number,
    gates: QuantumGate[]
): QuantumGate[][] {
    // Prepare empty matrix filled with dummy gates
    const matrix: QuantumGate[][] = Array.from({ length: qubits }, (_, qubitIndex) =>
        Array.from({ length: steps }, (_, stepIndex) => ({
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
        matrix[qubit][step] = { ...gate, id: `${gate.type}-${qubit}-${step}` };

        // Increment next free step for that qubit
        nextStepPerQubit[qubit]++;
    }

    return matrix;
}