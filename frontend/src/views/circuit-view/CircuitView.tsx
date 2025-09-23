import {Card, CardContent} from "@/components/ui/card.tsx";
import {QuantumWires} from "@/views/circuit-view/QuantumWires.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";
import {CircuitState} from "@/type/quantum.tsx";
import {Fragment, useCallback, useState} from "react";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import styles from "@/App.module.css";


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
                {/* Buttons for adding, removing and resetting the circuit */}
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

                {/* Wires container */}
                <div className="flex-1 overflow-auto">
                    {Array.from({length: circuitState.qubits}).map((_, qubitIndex) => (
                        <QuantumWires
                            key={qubitIndex}
                            gates={matrixState[qubitIndex] ?? []}
                            qubitIndex={qubitIndex}
                            length={WIRE_LENGTH}
                        />
                    ))}
                    {/* Gate Indexing of form: | 1 | 2 | ... */}
                    <div className={`${styles.gateIndexSpacing} font-mono text-sm flex justify-start flex-shrink-0`}>
                        {Array.from({length: maxWireLength}, (_, i) => (
                            <Fragment key={i}>
                                <span className="text-gray-500 w-3 shrink-0">|</span>
                                <span
                                    className={`${styles.gateIndexSize} text-gray-500 inline-block center shrink-0`}
                                >
                                {i + 1}
                            </span>
                            </Fragment>
                        ))}
                        <span className="text-gray-500">|</span>
                    </div>
                </div>


            </CardContent>
        </Card>
    )
}
