import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@quak/ui/popover';
import { Button } from '@quak/ui/button';
import { REGISTER_TYPE_QUANTUM } from '@quak/circuit-core';
import { FlatQubit } from '../util/types.ts';
import { useCircuitStore } from '#CircuitStoreContext.tsx';
import { createCircuitMutations } from '#circuitMutations.ts';
import { LABEL_WIDTH, QUBIT_HEIGHT } from '../util/layout.ts';

interface QubitLabelProps {
    qubit: FlatQubit;
}

export function QubitLabel({ qubit }: Readonly<QubitLabelProps>) {
    const { circuit, setCircuit } = useCircuitStore();
    const { deleteQubit, removeClassicBit } = createCircuitMutations(circuit, setCircuit);
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
        <div
            className="absolute z-40 flex items-center justify-center bg-bg-subtle"
            style={{ height: QUBIT_HEIGHT, width: LABEL_WIDTH }}
        >
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="w-full cursor-pointer select-none rounded-sm px-1 py-2 text-left font-mono text-[12px] hover:border hover:border-border">
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
