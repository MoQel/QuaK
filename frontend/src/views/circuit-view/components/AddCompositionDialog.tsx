import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { api } from '@/api/api.ts';
import { DirectoryContentsResponse, FileElementDto, ProjectContentsResponse } from '@/api/dto/filesystem.ts';
import {
    CircuitResponse,
    CompositeQuantumOperationDto,
    ElementSelectorDto,
    isQuantumRegister,
} from '@/api/dto/circuit.ts';
import { toast } from 'sonner';

interface AddCompositionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    circuit: CircuitResponse | undefined;
    projectId: string | null;
    onAddOperation: (op: CompositeQuantumOperationDto, layerIdx: number) => void;
}

interface CircuitOption {
    id: string; // The circuit ID to store in definitionCircuitId
    label: string;
    qubitCount?: number;
}

async function collectProjectFiles(elements: FileElementDto[]): Promise<FileElementDto[]> {
    const files: FileElementDto[] = [];
    for (const el of elements) {
        if (el.type === 'file') {
            files.push(el);
        } else if (el.type === 'directory') {
            try {
                const dirRes = await api.get<DirectoryContentsResponse>(`/api/directory/${el.id}`);
                if (dirRes.contents) {
                    const subFiles = await collectProjectFiles(dirRes.contents);
                    files.push(...subFiles);
                }
            } catch (e) {
                console.error('Failed to load directory contents', e);
            }
        }
    }
    return files;
}

export function AddCompositionDialog({
    open,
    onOpenChange,
    circuit,
    projectId,
    onAddOperation,
}: Readonly<AddCompositionDialogProps>) {
    const [circuitOptions, setCircuitOptions] = useState<CircuitOption[]>([]);
    const [selectedCircuitId, setSelectedCircuitId] = useState<string>('');
    const [customCircuitId, setCustomCircuitId] = useState<string>('');
    const [targetWireIndices, setTargetWireIndices] = useState<number[]>([0, 1]);
    const [targetLayerIdx, setTargetLayerIdx] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Collect all available quantum wires in current circuit
    const quantumRegisters = circuit?.registers.filter(isQuantumRegister) ?? [];
    const totalQubits = quantumRegisters.reduce((sum, reg) => sum + reg.numberOfQubits, 0);
    const defaultRegisterId = quantumRegisters[0]?.id ?? 'default-reg';

    useEffect(() => {
        if (!open || !projectId) return;

        setIsLoading(true);
        api.get<ProjectContentsResponse>(`/api/project/${projectId}`)
            .then(async (projectRes) => {
                const options: CircuitOption[] = [];

                // 1. Fetch main project circuit
                try {
                    const mainCircuit = await api.get<CircuitResponse>(`/api/circuit/${projectId}`);
                    if (mainCircuit.id !== circuit?.id) {
                        options.push({
                            id: mainCircuit.id,
                            label: `Main Project Circuit (${mainCircuit.id.slice(0, 8)}...)`,
                        });
                    }
                } catch (e) {
                    console.debug('No main circuit or failed to load:', e);
                }

                // 2. Fetch all files and their circuits
                if (projectRes.contents) {
                    const files = await collectProjectFiles(projectRes.contents);
                    for (const file of files) {
                        try {
                            const fileCircuit = await api.get<CircuitResponse>(`/api/circuit/file/${file.id}`);
                            if (fileCircuit.id !== circuit?.id) {
                                options.push({
                                    id: fileCircuit.id,
                                    label: `File: ${file.name} (${fileCircuit.id.slice(0, 8)}...)`,
                                });
                            }
                        } catch (e) {
                            console.debug(`Could not load circuit for file ${file.name}:`, e);
                        }
                    }
                }

                options.push({ id: '__custom__', label: 'Manual Circuit ID entry...' });
                setCircuitOptions(options);

                if (options.length > 0) {
                    setSelectedCircuitId((prev) => (options.some((o) => o.id === prev) ? prev : options[0].id));
                }
            })
            .catch((err) => {
                console.error('Failed to load project circuits for composition:', err);
                setCircuitOptions([{ id: '__custom__', label: 'Manual Circuit ID entry...' }]);
                setSelectedCircuitId('__custom__');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [open, projectId, circuit?.id]);

    const handleToggleWire = (wireIdx: number) => {
        setTargetWireIndices((prev) => {
            if (prev.includes(wireIdx)) {
                if (prev.length === 1) return prev; // At least one wire required
                return prev.filter((idx) => idx !== wireIdx);
            }
            return [...prev, wireIdx].sort((a, b) => a - b);
        });
    };

    const handleAdd = () => {
        const finalCircuitId = selectedCircuitId === '__custom__' ? customCircuitId.trim() : selectedCircuitId;

        if (!finalCircuitId) {
            toast.error('Please select or enter a valid Sub-Circuit ID.');
            return;
        }

        if (targetWireIndices.length === 0) {
            toast.error('Please select at least one target wire.');
            return;
        }

        const targetQubits: ElementSelectorDto[] = targetWireIndices.map((wireIdx) => ({
            registerId: defaultRegisterId,
            index: wireIdx,
        }));

        const newOp: CompositeQuantumOperationDto = {
            id: crypto.randomUUID(),
            type: 'COMPOSITE_OPERATION',
            identifier: 'COMPOSITION',
            inverseForm: false,
            definitionCircuitId: finalCircuitId,
            targetQubits,
            controlQubits: [],
        };

        onAddOperation(newOp, targetLayerIdx);
        toast.success('Composition gate added to circuit!');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add Composition (Sub-Circuit)</DialogTitle>
                    <DialogDescription>
                        Reference another circuit as a modular composite gate and map its wires to this circuit.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-3">
                    {/* Subcircuit Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="subcircuit-select">Referenced Sub-Circuit</Label>
                        <Select value={selectedCircuitId} onValueChange={setSelectedCircuitId} disabled={isLoading}>
                            <SelectTrigger id="subcircuit-select">
                                <SelectValue
                                    placeholder={isLoading ? 'Loading project circuits...' : 'Select a circuit'}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {circuitOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCircuitId === '__custom__' && (
                        <div className="grid gap-2">
                            <Label htmlFor="custom-circuit-id">Custom Circuit ID</Label>
                            <Input
                                id="custom-circuit-id"
                                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                value={customCircuitId}
                                onChange={(e) => setCustomCircuitId(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Target Wires Mapping */}
                    <div className="grid gap-2">
                        <Label>Target Wires (Qubits in current circuit)</Label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {Array.from({ length: Math.max(totalQubits, 4) }, (_, idx) => {
                                const isSelected = targetWireIndices.includes(idx);
                                return (
                                    <Button
                                        key={`wire-${idx}`}
                                        type="button"
                                        size="sm"
                                        variant={isSelected ? 'default' : 'outline'}
                                        onClick={() => handleToggleWire(idx)}
                                        className="h-8 px-3 font-mono"
                                    >
                                        q[{idx}]
                                    </Button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Selected {targetWireIndices.length} wire(s):{' '}
                            {targetWireIndices.map((i) => `q[${i}]`).join(', ')}
                        </p>
                    </div>

                    {/* Layer Index */}
                    <div className="grid gap-2">
                        <Label htmlFor="layer-idx">Target Layer</Label>
                        <Select value={String(targetLayerIdx)} onValueChange={(val) => setTargetLayerIdx(Number(val))}>
                            <SelectTrigger id="layer-idx">
                                <SelectValue placeholder="Select layer" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: (circuit?.layers.length ?? 0) + 1 }, (_, idx) => (
                                    <SelectItem key={`layer-${idx}`} value={String(idx)}>
                                        Layer {idx + 1} {idx === (circuit?.layers.length ?? 0) ? '(New Layer)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd}>Insert Composition</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
