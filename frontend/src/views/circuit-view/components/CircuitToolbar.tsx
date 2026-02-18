import { Button } from '@/components/ui/button.tsx';
import { Minus, Plus, Trash } from 'lucide-react';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';

interface CircuitToolbarProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
}

export function CircuitToolbar({ circuit, setCircuit }: Readonly<CircuitToolbarProps>) {
    const { addQubit, deleteLastQubit, resetCircuit } = createCircuitService(circuit, setCircuit);

    return (
        /* Toolbar */
        <div className="pb-5 flex justify-end space-x-3">
            <Button onClick={addQubit} size="icon" className="size-8">
                <Plus />
            </Button>
            <Button onClick={deleteLastQubit} size="icon" className="size-8" variant="destructive">
                <Minus />
            </Button>
            <Button onClick={resetCircuit} size="icon" className="size-8" variant="destructive">
                <Trash />
            </Button>
        </div>
    );
}
