import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { FlatQubit } from '@/views/circuit-view/util/types.ts';
import { CircuitResponse, REGISTER_TYPE_QUANTUM } from '@/api/dto/circuit.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';
import { LABEL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';

interface QubitLabelProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
    qubit: FlatQubit;
}

export function QubitLabel({ circuit, setCircuit, qubit }: Readonly<QubitLabelProps>) {
    const { deleteQubit, removeClassicBit } = createCircuitService(circuit, setCircuit);
    const [open, setOpen] = useState(false);

    const isQuantum = qubit.regType === REGISTER_TYPE_QUANTUM;

    const onDelete = () => {
        if (isQuantum) {
            deleteQubit(qubit.regId, qubit.relQubitIdx);
        } else {
            removeClassicBit(qubit.regId, qubit.relQubitIdx);
        }
        setOpen(false);
    };

    return (
        <div className="absolute flex items-center justify-center" style={{ height: QUBIT_HEIGHT, width: LABEL_WIDTH }}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="font-mono text-[12px] cursor-pointer w-full py-2 hover:border hover:border-border select-none">
                        {qubit.regName}[{qubit.relQubitIdx}]
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-36 p-2">
                    <Button
                        variant="destructive"
                        className="w-full h-7 font-mono text-xs font-bold select-none"
                        onClick={onDelete}
                    >
                        Remove {isQuantum ? 'Qubit' : 'Bit'}
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
    );
}
