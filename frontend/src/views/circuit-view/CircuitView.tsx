import {Card, CardContent} from "@/components/ui/card.tsx";
import {Qubit} from "@/views/circuit-view/Qubit.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";
import {CircuitState} from "@/type/quantum.tsx";
import {Fragment, useCallback, useState} from "react";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import styles from "@/App.module.css";
import {matrixContext} from "@/Context.tsx";
import {useContext} from "react";

type CircuitViewProps = {
    maxWireLength: number
}

export function CircuitView({maxWireLength}: CircuitViewProps) {
    //TODO These are not needed anymore, safely remove them
    const GATE_CAPACITY_VISIBLE = 40
    const INITIAL_QUBITS_VISIBLE = 5
    const WIRE_LENGTH = GATE_CAPACITY_VISIBLE * 25

    const [circuitState, setCircuitState] = useState<CircuitState>({
        qubits: INITIAL_QUBITS_VISIBLE,
        steps: GATE_CAPACITY_VISIBLE,
    });
    const matrix = useContext(matrixContext)


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
        if (!matrix) return;
        matrix.setMatrixState((prev: QuantumGate[][]): QuantumGate[][] => {
            return [...prev, [] as QuantumGate[]];  // new wire (empty array) appended
        });
    }, []);

    const resetCircuit = useCallback(() => {
        setCircuitState(prev => ({
            qubits: 1,
            steps: prev.steps,
        }));
        if (!matrix) return;
        matrix.setMatrixState([] as QuantumGate[][])
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
                        <Qubit
                            key={qubitIndex}
                            gates={matrix?.matrixState[qubitIndex] ?? []}
                            qubitIndex={qubitIndex}
                            length={WIRE_LENGTH}
                        />
                    ))}
                    {/* Gate Indexing of form: | 1 | 2 | ... */}
                    <div className={`${styles.gateIndexSpacing} font-mono text-sm flex justify-start flex-shrink-0`}>
                        {Array.from({length: maxWireLength - 1}, (_, i) => (
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
