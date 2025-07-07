import {Card, CardContent} from "@/components/ui/card.tsx";
import {QuantumWires} from "@/views/circuit-view/QuantumWires.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";

export function CircuitView() {
    let length = 1000
    let qubits = 3
    return (
        <Card className="h-full overflow-scroll">
            <CardContent>
                <div className="">
                    <div className="pb-5 flex justify-end space-x-3">
                        <Button size="icon" className="size-8">
                            <Plus/>
                        </Button>
                        <Button size="icon" className="size-8">
                            <Minus/>
                        </Button>
                        <Button size="icon" className="size-8">
                            <Trash/>
                        </Button>
                    </div>
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