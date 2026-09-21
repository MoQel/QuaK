import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ElementSelectorDto } from '@/api/dto/circuit';
import { FlatQubit } from '@/views/circuit-view/util/types';

export interface QubitMappingItem {
    subcircuitIndex: number;
    targetQubit: ElementSelectorDto;
}

interface SubcircuitQubitMappingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subcircuitName: string;
    subcircuitQubitCount: number;
    flatQubits: FlatQubit[];
    initialMapping?: QubitMappingItem[];
    onSubmit: (mapping: QubitMappingItem[]) => void;
}

const NONE_VALUE = '__none__';

export function SubcircuitQubitMappingDialog({
    open,
    onOpenChange,
    subcircuitName,
    subcircuitQubitCount,
    flatQubits,
    initialMapping,
    onSubmit,
}: Readonly<SubcircuitQubitMappingDialogProps>) {
    // State: maps subcircuit qubit index (0 .. subcircuitQubitCount-1) to target string `${regId}:${regIdx}` or NONE_VALUE
    const [mapping, setMapping] = useState<Record<number, string>>({});

    useEffect(() => {
        if (!open) return;
        const initial: Record<number, string> = {};
        for (let i = 0; i < subcircuitQubitCount; i++) {
            initial[i] = NONE_VALUE;
        }
        if (initialMapping && initialMapping.length > 0) {
            for (const item of initialMapping) {
                if (item.subcircuitIndex >= 0 && item.subcircuitIndex < subcircuitQubitCount) {
                    initial[item.subcircuitIndex] = `${item.targetQubit.registerId}:${item.targetQubit.index}`;
                }
            }
        }
        setMapping(initial);
    }, [open, subcircuitQubitCount, initialMapping]);

    const handleSelectChange = (subcircuitIndex: number, value: string) => {
        setMapping((prev) => ({
            ...prev,
            [subcircuitIndex]: value,
        }));
    };

    // Calculate which target qubits are already selected by OTHER subcircuit qubits
    const getSelectedTargetsExcluding = (subcircuitIndex: number): Set<string> => {
        const selected = new Set<string>();
        for (const [idxStr, val] of Object.entries(mapping)) {
            const idx = Number(idxStr);
            if (idx !== subcircuitIndex && val !== NONE_VALUE) {
                selected.add(val);
            }
        }
        return selected;
    };

    const hasAtLeastOneMapping = Object.values(mapping).some((val) => val !== NONE_VALUE);

    // Named rather than counted: the label is stable per row and doubles as the row's key.
    const subcircuitQubitLabels = Array.from({ length: subcircuitQubitCount }, (_, index) => `q${index}`);

    const handleConfirm = () => {
        const result: QubitMappingItem[] = [];
        for (let i = 0; i < subcircuitQubitCount; i++) {
            const val = mapping[i];
            if (val && val !== NONE_VALUE) {
                const [regId, regIdxStr] = val.split(':');
                result.push({
                    subcircuitIndex: i,
                    targetQubit: {
                        registerId: regId,
                        index: Number(regIdxStr),
                    },
                });
            }
        }
        onSubmit(result);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Subcircuit Qubit Mapping</DialogTitle>
                    <DialogDescription>
                        Pick which qubits of <strong>{subcircuitName}</strong> map onto which qubits of your circuit.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-72 overflow-y-auto my-2 pr-1">
                    {subcircuitQubitLabels.map((qubitLabel, subIndex) => {
                        const otherSelected = getSelectedTargetsExcluding(subIndex);
                        const currentValue = mapping[subIndex] ?? NONE_VALUE;

                        return (
                            <div
                                key={qubitLabel}
                                className="flex items-center justify-between gap-4 p-2.5 rounded-md border bg-card text-card-foreground shadow-xs"
                            >
                                <span className="font-mono text-sm font-medium">{qubitLabel}</span>
                                <span className="text-muted-foreground text-xs">➔</span>
                                <div className="w-56">
                                    <Select
                                        value={currentValue}
                                        onValueChange={(val) => handleSelectChange(subIndex, val)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-bg border-border text-text shadow-xl z-[100]">
                                            <SelectItem
                                                value={NONE_VALUE}
                                                className="text-muted-foreground font-medium"
                                            >
                                                ✕ Do not import
                                            </SelectItem>
                                            {flatQubits.map((q) => {
                                                const key = `${q.regId}:${q.relQubitIdx}`;
                                                const isTaken = otherSelected.has(key);
                                                return (
                                                    <SelectItem
                                                        key={key}
                                                        value={key}
                                                        disabled={isTaken}
                                                        className={isTaken ? 'opacity-40' : ''}
                                                    >
                                                        {q.regName}[{q.relQubitIdx}]
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="mt-4 flex gap-2">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!hasAtLeastOneMapping}>
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
