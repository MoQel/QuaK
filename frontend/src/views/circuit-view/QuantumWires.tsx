import styles from "@/App.module.css";
import {Badge} from "@/components/ui/badge"
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import {horizontalListSortingStrategy, SortableContext, useSortable} from "@dnd-kit/sortable";
import {Gate} from "@/views/Gate.tsx"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Input} from "@/components/ui/input.tsx";
import {useState} from "react";

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
    const maxLength = 4;
    const isTooLong = qubitName.length > maxLength;
    return (
        <div ref={setNodeRef} className="flex items-center space-x-2 pb-5">
            <div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button className="w-12 h-8 font-mono text-sm font-bold select-none">
                            |{qubitName}&gt;
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <Input
                            id="qubitName"
                            value={qubitName}
                            onChange={(e) => setQubitName(e.target.value)}
                            className="font-mono"
                        />
                        {isTooLong && (
                            <span className="text-red-500 text-xs">
                                Name too long! Max {maxLength} characters.
                            </span>
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            <div className="relative" style={{width: `${length}px`, height: "40px"}}>

                <div className={`${styles.lines} absolute top-1/2 w-full`}/>
                <div className="flex items-center h-full space-x-3 pl-3 relative z-10">
                    {/* Buffer element */}
                    <Badge className={`${styles.gate} invisible`}/>
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
