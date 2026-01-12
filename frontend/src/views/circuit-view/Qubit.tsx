import styles from "@/App.module.css";
import {Gate} from "@/views/circuit-view/Gate.tsx"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Input} from "@/components/ui/input.tsx";
import {ChangeEvent, Fragment, useState} from "react";
import {AddGateRequest, GateResponse, MoveGateRequest} from "@/api/dto/circuit.ts";

type QuantumWiresProps = {
    name: string;
    gates: GateResponse[];
    qubitIndex: number;
    onDelete: () => void;
    onGateAdd: (payload: AddGateRequest) => void;
    onGateMove: (payload: MoveGateRequest) => void;
    onGateDelete: (id: string) => void;
};

export function Qubit({name, gates, qubitIndex, onDelete, onGateAdd, onGateMove, onGateDelete}: Readonly<QuantumWiresProps>) {
    const [qubitName, setQubitName] = useState<string>(name)
    const [tempName, setTempName] = useState<string>(qubitName)
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [draggingGateId, setDraggingGateId] = useState<string | null>(null);

    const visibleGates = gates.filter(g => g.id !== draggingGateId);

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

    const handleDrop = async (e: React.DragEvent, qubitIdx: number, positionIdx: number) => {
        e.preventDefault();
        setHoverIndex(null);
        setDraggingGateId(null);

        const gateJson = e.dataTransfer.getData("application/json");
        if (!gateJson) return;

        const gate = JSON.parse(gateJson);
        if (e.dataTransfer.effectAllowed == "copy") {
            const payload: AddGateRequest = {
                type: gate.type,
                toQubitIdx: qubitIdx,
                toPositionIdx: positionIdx
            }
            onGateAdd(payload);
        } else if (e.dataTransfer.effectAllowed == "move") {
            const payload: MoveGateRequest = {
                id: gate.id,
                toQubitIdx: qubitIdx,
                toPositionIdx: positionIdx
            }
            onGateMove(payload);
        }
    };

    const allowDrop = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="flex items-center py-3">
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
                                onClick={onDelete}
                                variant="destructive"
                                className="w-30 h-8 font-mono text-sm font-bold select-none"
                            >
                                Remove Wire
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className={`${styles.qubitWireSpacing} relative flex-grow self-stretch`}>

                <div className={`${styles.lines} absolute top-1/2 w-full`}/>
                <div className="flex items-center h-full w-full relative z-10">
                {/* Actual quantum Gates */}
                    {visibleGates.map((gate, index) => (
                        <Fragment key={`frag-${qubitIndex}-${index}`}>
                            {/* Dropzone before every Gate */}
                            <div
                                className={`self-stretch ${styles.dropzoneSpacing}`}
                                onDragOver={allowDrop}
                                onDragEnter={() => setHoverIndex(index)}
                                onDragLeave={(e) => {
                                    const rt = e.relatedTarget as Node | null;
                                    if (!rt || !e.currentTarget.contains(rt)) {
                                        setHoverIndex(null);
                                    }
                                }}
                                onDrop={(e) => handleDrop(e, qubitIndex, index)}
                            >
                                {hoverIndex === index && (
                                    <div className={styles.dropZonePlaceHolderMargin}>
                                        <Gate key="placeholder" id="placeholder" type="PLACEHOLDER" />
                                    </div>
                                )}
                            </div>

                            {/* Actual Gate */}
                            <Gate key={`${gate.type}-${qubitIndex}-${index}`}
                                  id={gate.id}
                                  type={gate.type}
                                  onDragStart={(id) => setDraggingGateId(id)}
                                  onDragEnd={() => setDraggingGateId(null)}
                                  onDelete={() => onGateDelete(gate.id)}/>
                        </Fragment>
                    ))}

                    {/* Dropzone after last Gate */}
                    <div
                        className="self-stretch grow flex justify-start"
                        onDragOver={allowDrop}
                        onDragEnter={() => setHoverIndex(gates.length)}
                        onDragLeave={(e) => {
                            const rt = e.relatedTarget as Node | null;
                            if (!rt || !e.currentTarget.contains(rt)) {
                                setHoverIndex(null);
                            }
                        }}
                        onDrop={(e) => handleDrop(e, qubitIndex, gates.length)}
                    >
                        {hoverIndex === gates.length && (
                            <div className={styles.dropZoneLastPlaceHolderMargin}>
                                <Gate key="placeholder" id="placeholder" type="PLACEHOLDER" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}