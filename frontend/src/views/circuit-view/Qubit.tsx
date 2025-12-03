import styles from "@/App.module.css";
import {QuantumGate} from "@/views/QuantumGate.tsx";
import {horizontalListSortingStrategy, SortableContext, useSortable} from "@dnd-kit/sortable";
import {Gate} from "@/views/circuit-view/Gate.tsx"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Input} from "@/components/ui/input.tsx";
import {ChangeEvent, useState} from "react";
import {API_ENDPOINT} from "@/views/project-manager-view/ProjectManagerView.tsx";

type QuantumWiresProps = {
    name: string;
    initGates: QuantumGate[];
    qubitIndex: number;
};

export function Qubit({name, initGates, qubitIndex}: Readonly<QuantumWiresProps>) {
    const {setNodeRef} = useSortable({
        id: qubitIndex,
    })

    const [qubitName, setQubitName] = useState<string>(name)
    const [tempName, setTempName] = useState<string>(qubitName)
    const [gates, setGates] = useState<QuantumGate[]>(initGates)
    const maxLength = 4;
    const isTooLong = tempName.length > maxLength;
    const onNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTempName(e.target.value)
    }
    const onSave = () => {
        if (tempName.length <= maxLength) {
            setQubitName(tempName)
        }
    }
    // TODO: Implement when backend API is ready
    const deleteQubit = () => {}

    const handleDrop = async (e: React.DragEvent, qubitIndex: number, position: number) => {
        e.preventDefault();
        const gateJson = e.dataTransfer.getData("application/json");
        if (!gateJson) return;

        const gate = JSON.parse(gateJson);

        const payload = {
            ...gate,
            qubitIndex,
            position,
        };
        try {
            //TODO: Adapt to correct API point, when backend API is ready
            const res = await fetch(`${API_ENDPOINT}/circuit/gate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            const filteredGates:QuantumGate[] = json
                .filter((g: any) => g.qubit === name)
                .map(({ qubit, ...gate }: { qubit: string } & QuantumGate) => gate);

            setGates(filteredGates);
            //TODO: Also recalculate maxWireLength in CircuitView
        } catch (err) {
            console.error("Drop failed:", err);
        }
    };

    const allowDrop = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div ref={setNodeRef} className="flex items-center space-x-2 pb-5">
            <div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            className={`${styles.qubit} font-mono text-sm font-bold select-none`}
                        >
                            |{qubitName}&gt;
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <div className="flex flex-col space-y-2">
                            <div className="flex flex-row space-x-2">
                                <Input
                                    id="qubitName"
                                    value={tempName}
                                    onChange={onNameChange}
                                    className="font-mono"
                                />
                                <Button
                                    onClick={onSave}
                                    className="w-16 h-8 font-mono text-sm font-bold select-none"
                                >
                                    Save
                                </Button>
                            </div>
                            {isTooLong && (
                                <span className="self-start text-red-500 text-xs">
                                    Name too long! Max {maxLength} characters.
                                </span>
                            )}
                            <Button
                                onClick={deleteQubit}
                                variant="destructive"
                                className="w-30 h-8 font-mono text-sm font-bold select-none"
                            >
                                Remove Wire
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="relative w-full" style={{height: "40px"}}>

                <div className={`${styles.lines} absolute top-1/2 w-full`}/>
                <div className="flex items-center h-full space-x-3 pl-3 relative z-10">
                    {/* Actual quantum Gates */}
                    <SortableContext items={gates} strategy={horizontalListSortingStrategy}>
                        {gates.map((gate, index) => (
                            <div
                                key={`${gate.type}-${qubitIndex}-${index}-div`}
                                onDragOver={allowDrop}
                                onDrop={(e) => handleDrop(e, qubitIndex, index)}
                            >
                                <Gate key={`${gate.type}-${qubitIndex}-${index}`} id={gate.id} type={gate.type}/>
                            </div>
                        ))}
                        <div
                            key={`dummy-${qubitIndex}-div`}
                            onDragOver={allowDrop}
                            onDrop={(e) => handleDrop(e, qubitIndex, gates.length)}
                        >
                            <Gate key={`dummy-${qubitIndex}`} id={`dummy-${qubitIndex}-id`} type={'DUMMY'}/>
                        </div>
                    </SortableContext>
                </div>
            </div>
        </div>
    );
}
