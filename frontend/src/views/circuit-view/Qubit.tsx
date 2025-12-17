import styles from "@/App.module.css";
import {Gate} from "@/views/circuit-view/Gate.tsx"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Input} from "@/components/ui/input.tsx";
import {ChangeEvent, useState} from "react";
import React from "react";
import {GateResponse} from "@/api/dto/circuit.ts";

type QuantumWiresProps = {
    name: string;
    initGates: GateResponse[];
    qubitIndex: number;
};

export function Qubit({name, initGates, qubitIndex}: Readonly<QuantumWiresProps>) {
    const [qubitName, setQubitName] = useState<string>(name)
    const [tempName, setTempName] = useState<string>(qubitName)
    const gates = initGates //TODO: Add setGates Method

    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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
        setHoverIndex(null);

        const gateJson = e.dataTransfer.getData("application/json");
        if (!gateJson) return;

        const gate = JSON.parse(gateJson);

        const payload = {
            ...gate,
            qubitIndex,
            position,
        };
        console.log(payload);
        try {
            //TODO: Adapt to correct API point, when backend API is ready

            //TODO: Also recalculate maxWireLength in CircuitView
        } catch (err) {
            console.error("Drop failed:", err);
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

            <div className={`${styles.qubitWireSpacing} relative h-full w-full`}>

                <div className={`${styles.lines} absolute top-1/2 w-full`}/>
                <div className="flex items-center h-full w-full relative z-10">
                {/* Actual quantum Gates */}
                    {gates.map((gate, index) => (
                        <React.Fragment key={`frag-${qubitIndex}-${index}`}>
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
                            <Gate key={`${gate.type}-${qubitIndex}-${index}`} id={gate.id} type={gate.type} />
                        </React.Fragment>
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