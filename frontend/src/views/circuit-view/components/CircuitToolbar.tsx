import { Button } from '@/components/ui/button.tsx';
import { Minus, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { apiRequest } from '@/api/api.ts';
import { CircuitResponse, isQuantumRegister, QuantumOperationDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { useState } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useMonaco } from '@monaco-editor/react';
import { Uri } from 'monaco-editor';
import { toast } from 'sonner';

interface CircuitToolbarProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
}

export function CircuitToolbar({ circuit, setCircuit }: Readonly<CircuitToolbarProps>) {
    const { addQubit, deleteLastQubit, resetCircuit } = createCircuitService(circuit, setCircuit);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const monaco = useMonaco();
    const activeFileId = useAppSelector((state) => {
        const activeGroup = state.tabs.groups.find((group) => group.id === state.tabs.activeGroupId);
        return activeGroup?.activeTabId ?? null;
    });

    const parseActiveEditor = async () => {
        if (!monaco || !activeFileId) {
            toast.error('No active editor file');
            return;
        }

        const model = monaco.editor.getModel(Uri.file(activeFileId));
        if (!model || model.isDisposed()) {
            toast.error('No editor content available');
            return;
        }

        setIsParsing(true);
        try {
            const parsedCircuit = await apiRequest<unknown>('/qasm/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: model.getValue(),
            });

            setCircuit(normalizeParsedCircuit(parsedCircuit, circuit));
            toast.success('Circuit parsed from editor');
        } catch (error) {
            toast.error('Parsing failed', {
                description: error instanceof Error ? error.message : 'Could not parse the active editor content.',
            });
            console.error(error);
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="pb-5 flex justify-end space-x-3">
            <Button
                onClick={parseActiveEditor}
                size="icon"
                className="size-8"
                variant="secondary"
                title="Parse active editor"
                disabled={isParsing}
            >
                <RefreshCw className={isParsing ? 'animate-spin' : undefined} />
            </Button>
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
    );
}

type ParserRegister = Partial<RegisterResponse> & {
    id?: string;
    name?: string;
    numberOfQubits?: number;
    numberOfBits?: number;
};

type ParserOperation = Partial<QuantumOperationDto> & {
    operationDefinition?: unknown;
};

type ParserLayer = {
    quantumOperations?: ParserOperation[];
};

type ParserCircuit = {
    id?: string;
    projectId?: string;
    registers?: ParserRegister[];
    layers?: ParserLayer[];
};

const extractIdentifier = (operation: ParserOperation): string => {
    const rawIdentifier = operation.identifier ?? operation.operationDefinition;

    if (typeof rawIdentifier === 'string') return rawIdentifier.toUpperCase();
    if (rawIdentifier && typeof rawIdentifier === 'object') {
        const definition = rawIdentifier as { name?: unknown; identifier?: unknown };
        if (typeof definition.name === 'string') return definition.name.toUpperCase();
        if (typeof definition.identifier === 'string') return definition.identifier.toUpperCase();
    }

    return 'DUMMY';
};

const normalizeParsedCircuit = (rawCircuit: unknown, currentCircuit: CircuitResponse | undefined): CircuitResponse => {
    const parsed = rawCircuit as ParserCircuit;
    const currentQuantumRegisters = currentCircuit?.registers.filter(isQuantumRegister) ?? [];
    const registerIdMap = new Map<string, string>();

    const registers: RegisterResponse[] = (parsed.registers ?? []).map((register, index) => {
        const currentRegister = currentQuantumRegisters[index];
        const id = currentRegister?.id ?? register.id ?? crypto.randomUUID();

        if (register.id) {
            registerIdMap.set(register.id, id);
        }

        return {
            id,
            name: register.name ?? currentRegister?.name ?? `q${index}`,
            type: 'Quantum_Register',
            numberOfQubits: register.numberOfQubits ?? currentRegister?.numberOfQubits ?? 1,
        };
    });

    const fallbackRegister = currentQuantumRegisters[0];
    if (registers.length === 0 && fallbackRegister) {
        registers.push(fallbackRegister);
    }

    const normalizeSelector = (selector: { registerId?: string; index?: number }) => ({
        registerId:
            (selector.registerId ? registerIdMap.get(selector.registerId) : undefined) ??
            fallbackRegister?.id ??
            selector.registerId ??
            registers[0]?.id,
        index: selector.index ?? 0,
    });

    return {
        id: currentCircuit?.id ?? parsed.id ?? crypto.randomUUID(),
        registers,
        layers: (parsed.layers ?? []).map((layer) => ({
            quantumOperations: (layer.quantumOperations ?? []).map((operation) => ({
                id: operation.id ?? crypto.randomUUID(),
                type: operation.type ?? 'ELEMENTARY_QUANTUM_GATE',
                identifier: extractIdentifier(operation),
                inverseForm: operation.inverseForm ?? false,
                targetQubits: (operation.targetQubits ?? []).map(normalizeSelector),
                controlQubits: (operation.controlQubits ?? []).map(normalizeSelector),
                rotationAngle: 'rotationAngle' in operation ? operation.rotationAngle : 0,
            })) as QuantumOperationDto[],
        })),
    };
};
