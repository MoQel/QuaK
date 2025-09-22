import {Card, CardContent} from "@/components/ui/card.tsx";
import {QuantumWires} from "@/views/circuit-view/QuantumWires.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";
import {CircuitState} from "@/type/quantum.tsx";
import {useCallback, useState} from "react";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import React from "react";

type CircuitViewProps = {
    matrixState: QuantumGate[][];
    setMatrixState: (matrixState: QuantumGate[][]) => void;
    maxWireLength: number
}

export function CircuitView({matrixState, setMatrixState, maxWireLength}: CircuitViewProps) {
    const GATE_CAPACITY_VISIBLE = 40
    const INITIAL_QUBITS_VISIBLE = 3
    const WIRE_LENGTH = GATE_CAPACITY_VISIBLE * 25

    const [circuitState, setCircuitState] = useState<CircuitState>({
        qubits: INITIAL_QUBITS_VISIBLE,
        steps: GATE_CAPACITY_VISIBLE,
    });


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
        setMatrixState([] as QuantumGate[][])
    }, []);

    return (
        <Card className="h-full overflow-hidden">
            <CardContent className="flex flex-col h-full">

                {/* Buttons on top */}
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

                {/* Wires container scrollable */}
                <div className="flex-1 overflow-auto">
                    {Array.from({ length: circuitState.qubits }).map((_, qubitIndex) => (
                        <QuantumWires
                            key={qubitIndex}
                            gates={matrixState[qubitIndex] ?? []}
                            qubitIndex={qubitIndex}
                            length={WIRE_LENGTH}
                        />
                    ))}
                </div>

                {/* Index row at the bottom */}
                <div className="mt-2 font-mono text-sm flex justify-center flex-shrink-0">
                    {Array.from({ length: maxWireLength }, (_, i) => (
                        <React.Fragment key={i}>
                            <span>|</span>
                            <span
                                style={{ display: "inline-block", width: "80px", textAlign: "center" }}
                            >
            {i + 1}
          </span>
                        </React.Fragment>
                    ))}
                    <span>|</span>
                </div>
            </CardContent>
        </Card>

    )
}
