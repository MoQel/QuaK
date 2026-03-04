import { Button } from '@/components/ui/button.tsx';
import { Minus, Plus, Trash } from 'lucide-react';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { useState } from 'react';

interface CircuitToolbarProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
}

export function CircuitToolbar({ circuit, setCircuit }: Readonly<CircuitToolbarProps>) {
    const { addQubit, deleteLastQubit, resetCircuit } = createCircuitService(circuit, setCircuit);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    return (
        <div className="pb-5 flex justify-end space-x-3">
            <Button onClick={addQubit} size="icon" className="size-8" title="Add Qubit">
                <Plus />
            </Button>
            <Button
                onClick={deleteLastQubit}
                size="icon"
                className="size-8"
                variant="destructive"
                title="Delete Last Qubit"
            >
                <Minus />
            </Button>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button size="icon" className="size-8" variant="destructive" title="Reset Circuit">
                        <Trash />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                    <div className="flex flex-col space-y-3 text-center">
                        <p className="text-sm font-medium leading-none">Reset Circuit?</p>
                        <p className="text-xs text-muted-foreground">
                            You are about to delete the entire circuit. This action cannot be undone.
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
                                Yes, reset circuit
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setIsPopoverOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
