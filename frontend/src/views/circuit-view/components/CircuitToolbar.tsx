import { Button } from '@/components/ui/button.tsx';
import { Minus, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { apiRequest } from '@/api/api.ts';
import {
    CircuitResponse,
    CompositeQuantumGateDto,
    SubcircuitOperationDto,
    isQuantumRegister,
    LoopBlockDto,
    QuantumOperationDto,
    RegisterResponse,
} from '@/api/dto/circuit.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { useState } from 'react';
import { useActiveCode } from '@/hooks/editor/useActiveCode.ts';
import { toast } from 'sonner';
import { QuantikzExportButton } from '@/views/circuit-view/components/QuantikzExportButton.tsx';

interface CircuitToolbarProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
}

export function CircuitToolbar({ circuit, setCircuit }: Readonly<CircuitToolbarProps>) {
    const { addQubit, deleteLastQubit, resetCircuit } = createCircuitService(circuit, setCircuit);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const { activeCodeTabId, getActiveCode } = useActiveCode();

    const parseActiveEditor = async () => {
        const code = getActiveCode();
        if (code === undefined) {
            toast.error('No active editor content');
            return;
        }

        setIsParsing(true);
        try {
            // The tab id is the file id; the backend needs it to resolve `include "..."`
            // against the project's other files. Without it only the standard libraries work.
            const url = activeCodeTabId
                ? `/api/circuit/parse?fileId=${encodeURIComponent(activeCodeTabId)}`
                : '/api/circuit/parse';
            const parsedCircuit = await apiRequest<unknown>(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: code,
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
        <div className="flex items-center justify-start gap-2">
            <QuantikzExportButton circuit={circuit ?? null} />
            <div className="flex space-x-3">
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

type ParserLoopBlock = Partial<LoopBlockDto>;

// Content-only parse result: the backend returns registers, layers and repetition frames without
// any circuit identity; ids are re-mapped onto the active circuit during normalization.
type ParserCircuit = {
    registers?: ParserRegister[];
    layers?: ParserLayer[];
    loopBlocks?: ParserLoopBlock[];
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

/** Exported for tests: this is the one path everything the parser produces has to survive. */
export const normalizeParsedCircuit = (
    rawCircuit: unknown,
    currentCircuit: CircuitResponse | undefined,
): CircuitResponse => {
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

    /**
     * A composite keeps its own name as identifier (not upper-cased, that is the gate as written)
     * plus the fields that make the box drawable: ports, which of them are actually used, and the
     * body. Dropping them here would turn every user-defined gate back into an unlabelled box.
     */
    const normalizeOperation = (operation: ParserOperation): QuantumOperationDto => {
        const base = {
            id: operation.id ?? crypto.randomUUID(),
            inverseForm: operation.inverseForm ?? false,
            targetQubits: (operation.targetQubits ?? []).map(normalizeSelector),
            controlQubits: (operation.controlQubits ?? []).map(normalizeSelector),
        };

        if (operation.type === 'COMPOSITE_QUANTUM_GATE') {
            const composite = operation as Partial<CompositeQuantumGateDto>;
            return {
                ...base,
                type: 'COMPOSITE_QUANTUM_GATE',
                identifier: composite.identifier ?? '?',
                portLabels: composite.portLabels ?? [],
                usedQubitPositions: composite.usedQubitPositions ?? [],
                body: (composite.body ?? []).map((part) => normalizeOperation(part as ParserOperation)),
            };
        }

        if (operation.type === 'SUBCIRCUIT_OPERATION') {
            // The reference is the whole operation: without definitionCircuitId a subcircuit keeps
            // its type but points nowhere, which every consumer that reads the id then trips over.
            const subcircuit = operation as Partial<SubcircuitOperationDto>;
            return {
                ...base,
                type: 'SUBCIRCUIT_OPERATION',
                identifier: subcircuit.identifier,
                definitionCircuitId: subcircuit.definitionCircuitId ?? '',
                definitionName: subcircuit.definitionName,
            } as QuantumOperationDto;
        }

        return {
            ...base,
            type: operation.type ?? 'ELEMENTARY_QUANTUM_GATE',
            identifier: extractIdentifier(operation),
            rotationAngle: 'rotationAngle' in operation ? operation.rotationAngle : 0,
        } as QuantumOperationDto;
    };

    const layers = (parsed.layers ?? []).map((layer) => ({
        quantumOperations: (layer.quantumOperations ?? []).map(normalizeOperation),
    }));

    return {
        id: currentCircuit?.id ?? crypto.randomUUID(),
        registers,
        layers,
        loopBlocks: normalizeLoopBlocks(parsed.loopBlocks, layers),
    };
};

/**
 * Carries the parsed repetition frames over, keeping only those whose members survived.
 *
 * A frame references operations by id, and `normalizeOperation` invents an id for an operation that
 * arrives without one — a frame pointing at a replaced id would be rejected by the backend on the
 * next save (422) with nothing the user could do about it. Dropping such a frame loses the box but
 * keeps the circuit; the gates themselves are all still there.
 */
const normalizeLoopBlocks = (
    parsedBlocks: ParserLoopBlock[] | undefined,
    layers: CircuitResponse['layers'],
): LoopBlockDto[] => {
    const present = new Set(layers.flatMap((layer) => layer.quantumOperations.map((op) => op.id)));

    return (parsedBlocks ?? [])
        .map((block) => ({
            id: block.id ?? crypto.randomUUID(),
            repeatCount: block.repeatCount ?? 0,
            operationIds: (block.operationIds ?? []).filter((id) => present.has(id)),
        }))
        .filter((block) => block.repeatCount >= 2 && block.operationIds.length > 0);
};
