import { Button } from '@quak/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@quak/ui/popover';
import { useState, type ReactNode } from 'react';
import { useCircuitStore } from '#CircuitStoreContext.tsx';
import { createCircuitMutations } from '#circuitMutations.ts';
import { RegisterManager } from './RegisterManager.tsx';

interface CircuitToolbarProps {
    /**
     * Slot on the left of the toolbar, for actions only the host has: the web IDE
     * puts the quantikz export and "parse active editor" here, the extension its
     * own export button.
     */
    start?: ReactNode;
}

/** The circuit controls that need nothing but the circuit itself. */
export function CircuitToolbar({ start }: Readonly<CircuitToolbarProps>) {
    const { circuit, setCircuit } = useCircuitStore();
    const { addQubit, deleteLastQubit, resetCircuit } = createCircuitMutations(circuit, setCircuit);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    return (
        <div className="flex items-center justify-start gap-2">
            {start}
            <RegisterManager />
            <div className="flex space-x-3">
                <Button onClick={() => addQubit()} size="icon" className="size-8" variant="secondary" title="Add Qubit">
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
