import { useState, useEffect } from 'react';
import { Layers, Plus, Minus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    CircuitResponse,
    isQuantumRegister,
    RegisterType,
    RegisterRequest,
    REGISTER_TYPE_QUANTUM,
    REGISTER_TYPE_CLASSIC,
} from '@/api/dto/circuit';
import { createCircuitService } from '@/views/circuit-view/util/circuitService';

interface RegisterManagerProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
}

export function RegisterManager({ circuit, setCircuit }: Readonly<RegisterManagerProps>) {
    const { addRegister, deleteRegister, addQubit, deleteQubit, addClassicBit, removeClassicBit } =
        createCircuitService(circuit, setCircuit);

    const [newRegName, setNewRegName] = useState('');
    const [newRegType, setNewRegType] = useState<RegisterType>(REGISTER_TYPE_QUANTUM);
    const [newRegSize, setNewRegSize] = useState(2);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = () => setOpen(true);
        globalThis.addEventListener('open-register-manager', handler as EventListener);
        return () => globalThis.removeEventListener('open-register-manager', handler as EventListener);
    }, []);

    const handleAddRegister = () => {
        if (!newRegName.trim()) return;
        const payload: RegisterRequest = {
            name: newRegName.trim(),
            type: newRegType,
            size: newRegSize,
        };
        addRegister(payload);
        setNewRegName('');
        setNewRegSize(2);
    };

    const handleDeleteRegister = (registerId: string) => {
        deleteRegister(registerId);
    };

    if (!circuit) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="size-8" variant="secondary" title="Manage Registers">
                    <Layers />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layers className="size-5" />
                        Register Manager
                    </DialogTitle>
                    <DialogDescription>Create, resize, and delete quantum and classical registers.</DialogDescription>
                </DialogHeader>

                {/* --- Existing Registers --- */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {circuit.registers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No registers defined.</p>
                    )}
                    {circuit.registers.map((reg) => (
                        <div
                            key={reg.id}
                            className="flex items-center justify-between rounded-md border border-border bg-bg-subtle px-3 py-2"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <Badge variant={isQuantumRegister(reg) ? 'default' : 'secondary'}>
                                    {isQuantumRegister(reg) ? 'Quantum' : 'Classic'}
                                </Badge>
                                <span className="font-mono text-sm font-medium truncate">{reg.name}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {isQuantumRegister(reg)
                                        ? `${reg.numberOfQubits} qubit${reg.numberOfQubits !== 1 ? 's' : ''}`
                                        : `${reg.numberOfBits} bit${reg.numberOfBits !== 1 ? 's' : ''}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {isQuantumRegister(reg) ? (
                                    <>
                                        <Button
                                            size="icon"
                                            className="size-7"
                                            variant="ghost"
                                            title="Add Qubit"
                                            onClick={() => addQubit(reg.id)}
                                        >
                                            <Plus className="size-3.5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            className="size-7"
                                            variant="ghost"
                                            disabled={reg.numberOfQubits <= 1}
                                            title="Remove Last Qubit"
                                            onClick={() => deleteQubit(reg.id, reg.numberOfQubits - 1)}
                                        >
                                            <Minus className="size-3.5" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            size="icon"
                                            className="size-7"
                                            variant="ghost"
                                            title="Add Bit"
                                            onClick={() => addClassicBit(reg.id)}
                                        >
                                            <Plus className="size-3.5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            className="size-7"
                                            variant="ghost"
                                            disabled={reg.numberOfBits <= 1}
                                            title="Remove Last Bit"
                                            onClick={() => removeClassicBit(reg.id, reg.numberOfBits - 1)}
                                        >
                                            <Minus className="size-3.5" />
                                        </Button>
                                    </>
                                )}
                                <Button
                                    size="icon"
                                    className="size-7"
                                    variant="ghost"
                                    title="Delete Register"
                                    onClick={() => handleDeleteRegister(reg.id)}
                                >
                                    <Trash2 className="size-3.5 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Separator />

                {/* --- Add New Register --- */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Add Register</h4>
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="reg-name" className="text-xs">
                                Name
                            </Label>
                            <Input
                                id="reg-name"
                                value={newRegName}
                                onChange={(e) => setNewRegName(e.target.value)}
                                placeholder="e.g. q, a, c"
                                className="h-8 font-mono text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRegister()}
                            />
                        </div>
                        <div className="w-28 space-y-1.5">
                            <Label className="text-xs">Type</Label>
                            <Select value={newRegType} onValueChange={(v) => setNewRegType(v as RegisterType)}>
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={REGISTER_TYPE_QUANTUM}>Quantum</SelectItem>
                                    <SelectItem value={REGISTER_TYPE_CLASSIC}>Classic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-16 space-y-1.5">
                            <Label htmlFor="reg-size" className="text-xs">
                                Size
                            </Label>
                            <Input
                                id="reg-size"
                                type="number"
                                min={1}
                                max={32}
                                value={newRegSize}
                                onChange={(e) => setNewRegSize(Number(e.target.value))}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                    <Button onClick={handleAddRegister} className="w-full" size="sm" disabled={!newRegName.trim()}>
                        <Plus className="size-4 mr-1" />
                        Add Register
                    </Button>
                </div>

                <DialogClose asChild>
                    <Button variant="outline" className="w-full" size="sm">
                        <X className="size-4 mr-1" />
                        Close
                    </Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
