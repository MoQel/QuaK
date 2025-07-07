import {Card, CardContent} from "@/components/ui/card.tsx";
import {QuantumWires} from "@/views/circuit-view/QuantumWires.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";
import {CircuitState} from "@/type/quantum.tsx";
import {useCallback, useState} from "react";

export function CircuitView() {
    const WIRE_LENGTH = 1000

    const [circuitState, setCircuitState] = useState<CircuitState>({
        qubits: 3,
        steps: 20,
    });

    const removeQubit = useCallback(() => {
        console.log("Minus pressed")
        setCircuitState(prev => ({
            qubits: Math.max(prev.qubits - 1, 1),
            steps: prev.steps,
        }));
    }, []);

    const addQubit = useCallback(() => {
        console.log("Minus pressed")
        setCircuitState(prev => ({
            qubits: Math.min(prev.qubits + 1, 20),
            steps: prev.steps,
        }));
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
                        <Button size="icon" className="size-8">
                            <Trash/>
                        </Button>
                    </div>
                    <div>
                        {Array.from({length: circuitState.qubits}).map((_, qubitIndex) => (
                            <QuantumWires
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