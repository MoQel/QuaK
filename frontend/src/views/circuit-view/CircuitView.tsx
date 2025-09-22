import {Card, CardContent} from "@/components/ui/card.tsx";
import {QuantumWires} from "@/views/circuit-view/QuantumWires.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";
import {CircuitState} from "@/type/quantum.tsx";
import {useCallback, useState} from "react";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";

type CircuitViewProps = {
    matrixState: QuantumGate[][];
    setMatrixState: (matrixState: QuantumGate[][]) => void;
    maxWireLength: number
}

export function CircuitView({matrixState, setMatrixState}: CircuitViewProps) {
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
                                key={qubitIndex}
                                gates={matrixState[qubitIndex] ?? []}
                                qubitIndex={qubitIndex}
                                length={WIRE_LENGTH}
                            />
                        ))
                        }
                    </div>
                </div>
                //TODO Indexing
            </CardContent>
        </Card>
    )
}
