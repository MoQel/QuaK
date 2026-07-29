import { Button } from '@/components/ui/button.tsx';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/api/api.ts';
import { CircuitResponse, isQuantumRegister, QuantumOperationDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { useActiveCode } from '@/hooks/editor/useActiveCode.ts';

interface ParseEditorButtonProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
}

/**
 * Parses the active editor's code into the circuit, via the backend's
 * `/api/circuit/parse`. Web-IDE only: the shared circuit editor has no backend,
 * so this is injected into `CircuitToolbar`'s `start` slot. The extension will do
 * the same job locally once `packages/qasm-transform` exists.
 */
export function ParseEditorButton({ circuit, setCircuit }: Readonly<ParseEditorButtonProps>) {
    const [isParsing, setIsParsing] = useState(false);
    const { getActiveCode } = useActiveCode();

    const parseActiveEditor = async () => {
        const code = getActiveCode();
        if (code === undefined) {
            toast.error('No active editor content');
            return;
        }

        setIsParsing(true);
        try {
            const parsedCircuit = await apiRequest<unknown>('/api/circuit/parse', {
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

// Content-only parse result: the backend returns registers and layers without any
// circuit identity; ids are re-mapped onto the active circuit during normalization.
type ParserCircuit = {
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
        id: currentCircuit?.id ?? crypto.randomUUID(),
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
