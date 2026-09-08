import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { CircuitResponse, ElementSelectorDto, isClassicRegister } from '@/api/dto/circuit';

interface MeasurementTargetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    circuit: CircuitResponse | undefined;
    onSubmit: (classicBits: ElementSelectorDto[]) => void;
    onOpenRegisterManager: () => void;
}

export function MeasurementTargetDialog({
    open,
    onOpenChange,
    circuit,
    onSubmit,
    onOpenRegisterManager,
}: Readonly<MeasurementTargetDialogProps>) {
    const [selected, setSelected] = useState<ElementSelectorDto | null>(null);

    if (!circuit) return null;

    const classicRegs = circuit.registers.filter(isClassicRegister);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) setSelected(null);
        onOpenChange(nextOpen);
    };

    const handleConfirm = () => {
        if (!selected) return;
        onSubmit([selected]);
        handleOpenChange(false);
    };

    const handleOpenRegisterManager = () => {
        handleOpenChange(false);
        onOpenRegisterManager();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Select Classic Bit</DialogTitle>
                    <DialogDescription>
                        Select a classical register bit to store the measurement result.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-64 overflow-y-auto mt-3">
                    {classicRegs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Create a classical register before placing a measurement gate.
                        </p>
                    )}

                    {classicRegs.map((reg) => (
                        <div key={reg.id} className="p-2 border rounded-md">
                            <div className="text-sm font-medium mb-2">{reg.name}</div>
                            <div className="flex gap-2 flex-wrap">
                                {Array.from({ length: reg.numberOfBits }).map((_, idx) => (
                                    <Button
                                        key={`${reg.id}-${idx}`}
                                        size="sm"
                                        variant={
                                            selected?.registerId === reg.id && selected.index === idx
                                                ? 'outline'
                                                : 'ghost'
                                        }
                                        onClick={() => setSelected({ registerId: reg.id, index: idx })}
                                    >
                                        {idx}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex gap-2">
                    <Button variant="secondary" onClick={() => handleOpenChange(false)} className="flex-1">
                        Cancel
                    </Button>
                    <Button onClick={handleOpenRegisterManager} variant="ghost">
                        Manage Registers
                    </Button>
                    <DialogClose asChild>
                        <Button onClick={handleConfirm} disabled={!selected} className="ml-auto">
                            Confirm
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
