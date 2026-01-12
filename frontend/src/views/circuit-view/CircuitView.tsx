import {Card, CardContent} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";
import {Fragment, useEffect, useState} from "react";
import styles from "@/App.module.css";
import {Qubit} from "@/views/circuit-view/Qubit.tsx";
import {api} from "@/api/api.ts";
import {
    AddGateRequest,
    ChangeQubitNameRequest,
    CircuitResponse,
    MoveGateRequest,
    RegisterResponse
} from "@/api/dto/circuit.ts";

export function CircuitView() {
    const [circuit, setCircuit] = useState<CircuitResponse | null>(null);

    const maxWireLength = Math.max(
        ...(circuit?.registers.map(reg => reg.qubits.at(0)?.gates.length ?? 0)) ?? [0]
    );

    useEffect(() => {
        fetchCircuit().then(setCircuit);
    }, [])

    async function fetchCircuit() {
        if (circuit == null) {
            return await api.post<CircuitResponse>('/circuit')
        } else {
            return await api.get<CircuitResponse>(`/circuit/${circuit.id}`)
        }
    }

    const addQubit = async () => {
        if (circuit != null) {
            setCircuit(await api.post<CircuitResponse>(`/circuit/${circuit.id}/qubit`));
        }
    }

    const changeQubitName = async (payload: ChangeQubitNameRequest) => {
        if (circuit != null) {
            setCircuit(await api.patch<CircuitResponse>(`/circuit/${circuit.id}/qubit`, payload));
        }
    }

    const deleteQubit = async (qubitId: string) => {
        if (circuit != null) {
            setCircuit(await api.delete<CircuitResponse>(`/circuit/${circuit.id}/qubit/${qubitId}`));
        }
    }

    const deleteLastQubit = async () => {
        if (circuit != null) {
            const registerOfLastQubit: RegisterResponse | undefined = circuit.registers.at(-1);
            if (registerOfLastQubit) {
                await deleteQubit(registerOfLastQubit.id);
            }
        }
    }

    const resetCircuit = async () => {
        if (circuit != null) {
            await api.delete<CircuitResponse>(`/circuit/${circuit.id}`);
            setCircuit(await api.post<CircuitResponse>('/circuit'));
        }
    }

    const addGate = async (payload: AddGateRequest) => {
        if (circuit != null) {
            setCircuit(await api.post<CircuitResponse>(`/circuit/${circuit.id}/gate`, payload));
        }
    }

    const moveGate = async (payload: MoveGateRequest) => {
        if (circuit != null) {
            setCircuit(await api.patch<CircuitResponse>(`/circuit/${circuit.id}/gate`, payload));
        }
    }

    const deleteGate = async (gateId: string) => {
        if (circuit != null) {
            setCircuit(await api.delete<CircuitResponse>(`/circuit/${circuit.id}/gate/${gateId}`));
        }
    }

    return (
        <Card className="h-full overflow-hidden">
            <CardContent className="flex flex-col h-full">

                {/* Buttons */}
                <div className="pb-5 flex justify-end space-x-3">
                    <Button onClick={addQubit} size="icon" className="size-8"><Plus/></Button>
                    <Button onClick={deleteLastQubit} size="icon" className="size-8"><Minus/></Button>
                    <Button onClick={resetCircuit} size="icon" className="size-8"><Trash/></Button>
                </div>

                {/* Wires container */}
                <div className="flex-1 overflow-auto">
                    {
                        circuit?.registers.map((reg: RegisterResponse, idx) => (
                            <Qubit
                                key={reg.qubits.at(0)?.id}
                                id={reg.qubits.at(0)?.id ?? ""}
                                name={reg.name}
                                gates={reg.qubits.at(0)?.gates ?? []}
                                qubitIndex={idx}
                                onNameChange={changeQubitName}
                                onDelete={() => deleteQubit(reg.qubits.at(0)?.id ?? "")}
                                onGateAdd={addGate}
                                onGateMove={moveGate}
                                onGateDelete={deleteGate}
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