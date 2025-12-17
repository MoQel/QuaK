import {Card, CardContent} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {CircuitBoard, Minus, Plus, Trash} from "lucide-react";
import {Fragment, useCallback, useState} from "react";
import styles from "@/App.module.css";
import {Qubit} from "@/views/circuit-view/Qubit.tsx";
import {api} from "@/api/api.ts";
import {CircuitResponse, QubitResponse} from "@/api/dto/circuit.ts";

export function CircuitView() {
    const [circuit, setCircuit] = useState<CircuitResponse | null>(null);

    const maxWireLength = Math.max(
        ...(circuit?.qubits.map(qubit => qubit.gates.length)) ?? [0]
    );

    const fetchCircuit = useCallback(async () => {
        if (circuit == null) {
            setCircuit(await api.post<CircuitResponse>('/circuit/init'));
        } else {
            setCircuit(await api.get<CircuitResponse>(`/circuit/${circuit.id}`));
        }
    }, [circuit]);

    const addQubit = useCallback(async () => {
        if (circuit != null) {
            setCircuit(await api.post<CircuitResponse>(`/circuit/qubit/add/${circuit.id}`));
        }
    }, [circuit]);

    // TODO: Implement when API is ready
    const removeQubit = useCallback(async () => {}, [circuit]);

    const resetCircuit = useCallback(async () => {
        setCircuit(await api.post<CircuitResponse>('/circuit/init'));
    }, [circuit]);

    return (
        <Card className="h-full overflow-hidden">
            <CardContent className="flex flex-col h-full">

                {/* Buttons */}
                <div className="pb-5 flex justify-end space-x-3">
                    <Button onClick={fetchCircuit} size="icon" className="size-8"><CircuitBoard/></Button>
                    <Button onClick={addQubit} size="icon" className="size-8"><Plus/></Button>
                    <Button onClick={removeQubit} size="icon" className="size-8"><Minus/></Button>
                    <Button onClick={resetCircuit} size="icon" className="size-8"><Trash/></Button>
                </div>

                {/* Wires container */}
                <div className="flex-1 overflow-auto">
                    {
                        circuit?.qubits.map((qubit: QubitResponse, idx) => (
                            <Qubit
                                key={qubit.name}
                                name={qubit.name}
                                initGates={qubit.gates}
                                qubitIndex={idx}
                            />
                        ))
                    }
                    {/* Gate Indexing of form: | 1 | 2 | ... */}
                    <div className={`${styles.gateIndexSpacing} flex font-mono text-sm border-l border-gray-500`}>
                        {Array.from({length: maxWireLength}, (_, i) => (
                            <Fragment key={i}>
                                <span
                                    className={`${styles.gateIndexSize} text-gray-500 justify-center border-r border-gray-500`}
                                >
                                    {i + 1}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}