import { useState, useEffect } from 'react';
import { Layers, Plus, Minus, Trash2, X } from 'lucide-react';
import { Button } from '@quak/ui/button';
import { Input } from '@quak/ui/input';
import { Label } from '@quak/ui/label';
import { Badge } from '@quak/ui/badge';
import { Separator } from '@quak/ui/separator';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@quak/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@quak/ui/select';
import {
    checkRegisterName,
    describeRegisterNameProblem,
    isQuantumRegister,
    RegisterResponse,
    RegisterType,
    RegisterRequest,
    REGISTER_TYPE_QUANTUM,
    REGISTER_TYPE_CLASSIC,
} from '@quak/circuit-core';
import { useCircuitStore } from '#CircuitStoreContext.tsx';
import { useCircuitCapabilities } from '#CircuitCapabilitiesContext.tsx';
import { createCircuitMutations } from '#circuitMutations.ts';

/**
 * The register manager lives in the toolbar, but the canvas needs to open it too
 * ("no registers yet", "measure into which bit?"). A window event keeps those
 * call sites from having to thread a handler through the whole tree.
 */
const OPEN_REGISTER_MANAGER_EVENT = 'open-register-manager';

export function openRegisterManager(): void {
    globalThis.dispatchEvent(new CustomEvent(OPEN_REGISTER_MANAGER_EVENT));
}

function getRegisterSizeLabel(reg: RegisterResponse): string {
    if (isQuantumRegister(reg)) {
        return `${reg.numberOfQubits} qubit${reg.numberOfQubits === 1 ? '' : 's'}`;
    }
    return `${reg.numberOfBits} bit${reg.numberOfBits === 1 ? '' : 's'}`;
}

export function RegisterManager() {
    const { circuit, setCircuit } = useCircuitStore();
    const { classicalRegisters: canUseClassicalRegisters } = useCircuitCapabilities();
    const { addRegister, deleteRegister, addQubit, deleteQubit, addClassicBit, removeClassicBit } =
        createCircuitMutations(circuit, setCircuit);

    const [newRegName, setNewRegName] = useState('');
    const [newRegType, setNewRegType] = useState<RegisterType>(REGISTER_TYPE_QUANTUM);
    const [newRegSize, setNewRegSize] = useState(2);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = () => setOpen(true);
        globalThis.addEventListener(OPEN_REGISTER_MANAGER_EVENT, handler as EventListener);
        return () => globalThis.removeEventListener(OPEN_REGISTER_MANAGER_EVENT, handler as EventListener);
    }, []);

    // The name is written into generated OpenQASM verbatim, so it has to be an
    // identifier there before it may be created here.
    const nameProblem = checkRegisterName(newRegName);

    const handleAddRegister = () => {
        if (nameProblem) return;
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
                                    {getRegisterSizeLabel(reg)}
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
                                aria-invalid={newRegName.trim() !== '' && nameProblem !== null}
                                aria-describedby="reg-name-problem"
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
                                    {canUseClassicalRegisters && (
                                        <SelectItem value={REGISTER_TYPE_CLASSIC}>Classic</SelectItem>
                                    )}
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
                    {newRegName.trim() !== '' && nameProblem && (
                        <p id="reg-name-problem" className="text-xs text-destructive">
                            {describeRegisterNameProblem(nameProblem)}
                        </p>
                    )}
                    <Button onClick={handleAddRegister} className="w-full" size="sm" disabled={nameProblem !== null}>
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
