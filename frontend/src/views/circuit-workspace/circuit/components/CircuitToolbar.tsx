import { Button } from '@/components/ui/button.tsx';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { useCircuitPort } from '@/views/circuit-workspace/CircuitPortContext.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { useState } from 'react';
import { QuantikzExportButton } from '@/views/circuit-workspace/circuit/components/QuantikzExportButton.tsx';

interface CircuitToolbarProps {
    circuit: CircuitResponse | undefined;
}

export function CircuitToolbar({ circuit }: Readonly<CircuitToolbarProps>) {
    const { addQubit, deleteLastQubit, resetCircuit } = useCircuitPort();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    return (
        <div className="flex items-center justify-between pb-1">
            <QuantikzExportButton circuit={circuit ?? null} />
            <div className="flex space-x-3">
                <Button onClick={addQubit} size="icon" className="size-8" variant="secondary" title="Add Qubit">
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
                            <Trash2 />
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
        </div>
    );
}
