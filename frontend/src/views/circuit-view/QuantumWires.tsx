import styles from "@/App.module.css";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import {horizontalListSortingStrategy, SortableContext, useSortable} from "@dnd-kit/sortable";
import {Gate} from "@/views/Gate.tsx"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Input} from "@/components/ui/input.tsx";
import {ChangeEvent, useState} from "react";

type QuantumWiresProps = {
    gates: QuantumGate[];
    qubitIndex: number;
    length: number;
};

export function QuantumWires({gates, qubitIndex, length}: QuantumWiresProps) {
    const {setNodeRef} = useSortable({
        id: qubitIndex,
    })

    const [qubitName, setQubitName] = useState<string>(`q${qubitIndex}`)
    const [tempName, setTempName] = useState<string>(qubitName)
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
                                <span className="text-red-500 text-xs">
                                    Name too long! Max {maxLength} characters.
                                </span>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="relative" style={{width: `${length}px`, height: "40px"}}>

                <div className={`${styles.lines} absolute top-1/2 w-full`}/>
                <div className="flex items-center h-full space-x-3 pl-3 relative z-10">
                    {/* Actual quantum Gates */}
                    <SortableContext items={gates} strategy={horizontalListSortingStrategy}>
                        {gates.map((gate, index) => (
                            <Gate key={`${gate.type}-${qubitIndex}-${index}`} id={gate.id} type={gate.type}/>
                        ))}
                    </SortableContext>
                </div>
            </div>
        </div>
    );
}
