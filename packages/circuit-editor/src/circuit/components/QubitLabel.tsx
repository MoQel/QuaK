import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@quak/ui/popover';
import { Button } from '@quak/ui/button';
import { FlatQubit } from '../../circuit/util/types.ts';
import { useCircuitStore } from '../../CircuitStoreContext.tsx';
import { createCircuitMutations } from '../../circuitMutations.ts';
import { LABEL_WIDTH, QUBIT_HEIGHT } from '../../circuit/util/layout.ts';

interface QubitLabelProps {
    qubit: FlatQubit;
}

export function QubitLabel({ qubit }: Readonly<QubitLabelProps>) {
    const { circuit, setCircuit } = useCircuitStore();
    const { deleteQubit } = createCircuitMutations(circuit, setCircuit);
    const [open, setOpen] = useState(false);

    const onDelete = () => {
        deleteQubit(qubit.regId, qubit.relQubitIdx);
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
                        Remove Qubit
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
    );
}
