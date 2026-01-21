import styles from "@/App.module.css";
import {Gate} from "@/views/circuit-view/Gate.tsx"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Input} from "@/components/ui/input.tsx";
import React, {Fragment, useState} from "react";
import {
    AddGateRequest,
    ChangeQubitNameRequest,
    MoveGateRequest,
    QubitResponse
} from "@/api/dto/circuit.ts";

interface QubitProps extends QubitResponse {
    name: string;
    qubitIndex: number;
    onNameChange: (payload: ChangeQubitNameRequest) => void;
    onDelete: () => void;
    onGateAdd: (payload: AddGateRequest) => void;
    onGateMove: (payload: MoveGateRequest) => void;
    onGateDelete: (id: string) => void;
}

export function Qubit({id, name, gates, qubitIndex, onNameChange, onDelete, onGateAdd, onGateMove, onGateDelete}: Readonly<QubitProps>) {
    const [tempName, setTempName] = useState<string>(name);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [draggingGateId, setDraggingGateId] = useState<string | null>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const visibleGates = gates.filter(g => g.id !== draggingGateId);

    const maxQubitNameLength = 4;

    const onNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length <= maxQubitNameLength) {
            setTempName(e.target.value);
        }
    }

    const onSave = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: ChangeQubitNameRequest = {
            id: id,
            name: tempName
        }
        onNameChange(payload);
        setIsPopoverOpen(false);
    }

    const handleDrop = async (e: React.DragEvent, qubitIdx: number, positionIdx: number) => {
        e.preventDefault();
        setHoverIndex(null);
        setDraggingGateId(null);

        const rawData = e.dataTransfer.getData("text/plain");
        if (!rawData) return;

        const gate = JSON.parse(rawData);

        if (gate.origin === "library") {
            const payload: AddGateRequest = {
                definitionId: gate.id,
                toQubitIdx: qubitIdx,
                toPositionIdx: positionIdx
            };
            onGateAdd(payload);
        } else if (gate.origin === "circuit") {
            const payload: MoveGateRequest = {
                id: gate.id,
                toQubitIdx: qubitIdx,
                toPositionIdx: positionIdx
            };
            onGateMove(payload);
        } else {
            throw new Error("Invalid gate origin: " + gate.origin);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="flex items-center py-3">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        className={`${styles.qubit} font-mono text-sm font-bold select-none focus-visible:ring-0 focus-visible:ring-offset-0`}
                    >
                        |{name}&gt;
                    </Button>
                </PopoverTrigger>
                <PopoverContent>
                    <form onSubmit={onSave} className="flex flex-col space-y-2">
                        <div className="flex flex-row space-x-2">
                            <Input
                                id="qubitName"
                                value={tempName}
                                onChange={onNameInputChange}
                                className="font-mono"
                            />
                            <Button
                                type="submit"
                                className="w-16 h-8 font-mono text-sm font-bold select-none bg-special text-white hover:bg-special-hover"
                            >
                                Save
                            </Button>
                        </div>
                        <Button
                            type="button"
                            onClick={onDelete}
                            variant="destructive"
                            className="w-30 h-8 font-mono text-sm font-bold select-none"
                        >
                            Remove Wire
                        </Button>
                    </form>
                </PopoverContent>
            </Popover>

            <div className={`${styles.qubitWireSpacing}  relative flex-grow self-stretch`}>
                <div className={`${styles.lines}  absolute top-1/2 w-full`}/>
                <div className="flex items-center h-full w-full relative z-10">
                {/* Actual quantum Gates */}
                    {visibleGates.map((gate, index) => (
                        <Fragment key={`frag-${qubitIndex}-${index}`}>
                            {/* Dropzone before every Gate */}
                            <div
                                className={`self-stretch ${styles.dropzoneSpacing}`}
                                onDragOver={handleDragOver}
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
                                    <div className={styles.dropZonePlaceHolderMargin} style={{ pointerEvents: "none" }}>
                                        <Gate key="placeholder" id="placeholder" definitionId="PLACEHOLDER" />
                                    </div>
                                )}
                            </div>

                            {/* Actual Gate */}
                            <Gate key={`${gate.definitionId}-${qubitIndex}-${index}`}
                                  id={gate.id}
                                  definitionId={gate.definitionId}
                                  onDragStart={(id) => setDraggingGateId(id)}
                                  onDragEnd={() => setDraggingGateId(null)}
                                  onDelete={() => onGateDelete(gate.id)}/>
                        </Fragment>
                    ))}

                    {/* Dropzone after last Gate */}
                    <div
                        className={`${styles.dropzoneSpacing} self-stretch grow flex justify-start`}
                        onDragOver={handleDragOver}
                        onDragEnter={() => {
                            setHoverIndex(visibleGates.length);
                        }}
                        onDragLeave={(e) => {
                            const rt = e.relatedTarget as Node | null;
                            if (!rt || !e.currentTarget.contains(rt)) {
                                setHoverIndex(null);
                            }
                        }}
                        onDrop={(e) => handleDrop(e, qubitIndex, visibleGates.length)}
                    >
                        {hoverIndex === visibleGates.length && (
                            <div className={styles.dropZoneLastPlaceHolderMargin} style={{ pointerEvents: "none" }}>
                                <Gate key="placeholder" id="placeholder" definitionId="PLACEHOLDER" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}