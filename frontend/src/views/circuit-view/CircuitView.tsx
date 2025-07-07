import {Card, CardContent} from "@/components/ui/card.tsx";
import styles from "@/App.module.css";
import {QuantumWires} from "@/views/circuit-view/QuantumWires.tsx";

export function CircuitView() {
    let length = 1000
    let qubits = 3
    return (
        <Card className="h-full overflow-scroll">
            <CardContent>
                <div className="">
                    <div>
                        {Array.from({length: qubits}).map((_, qubitIndex) => (
                            <QuantumWires
                                qubitIndex={qubitIndex}
                                length={length}
                            />
                        ))
                        }
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}