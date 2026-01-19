import {Card, CardContent} from "@/components/ui/card.tsx";
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
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
    MoveGateRequest, QubitResponse,
    RegisterResponse
} from "@/api/dto/circuit.ts";

export function CircuitView() {
    const [circuit, setCircuit] = useState<CircuitResponse | null>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const maxWireLength = Math.max(
        ...(circuit?.registers.map(reg => reg.qubits.at(0)?.gates.length ?? 0)) ?? [0]
    );

    useEffect(() => {
        api.post<CircuitResponse>('/circuit').then(setCircuit);
    }, [])

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
            const lastQubit: QubitResponse | undefined = circuit.registers.at(-1)?.qubits.at(0);
            if (lastQubit) {
                await deleteQubit(lastQubit.id);
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
                    <Button onClick={deleteLastQubit} size="icon" className="size-8" variant="destructive"><Minus/></Button>
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button size="icon" className="size-8" variant="destructive">
                                <Trash />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4">
                            <div className="flex flex-col space-y-3 text-center">
                                <p className="text-sm font-medium leading-none">
                                    Reset Circuit?
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    This will permanently delete all gates and wires.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={() => {
                                            resetCircuit();
                                            setIsPopoverOpen(false);
                                        }}
                                        variant="destructive"
                                        size="sm"
                                        className="w-full font-bold"
                                    >
                                        Yes, reset everything
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsPopoverOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
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
                                    className={`${styles.gateIndexSize} text-gray-500 shrink-0 justify-center border-r border-gray-500`}
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