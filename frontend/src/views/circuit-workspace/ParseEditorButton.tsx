import { Button } from '@/components/ui/button.tsx';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/api/api.ts';
import {
    CircuitResponse,
    isClassicRegister,
    isQuantumRegister,
    QuantumOperationDto,
    RegisterResponse,
    REGISTER_TYPE_CLASSIC,
    REGISTER_TYPE_QUANTUM,
} from '@/api/dto/circuit.ts';
import type { OperationIdentifier } from '@quak/circuit-editor';
import { useActiveCode } from '@/hooks/editor/useActiveCode.ts';

interface ParseEditorButtonProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
}

/**
 * Parses the active editor's code into the circuit, via the backend's
 * `/api/circuit/parse`. Web-IDE only: the shared circuit editor has no backend,
 * so this is injected into `CircuitToolbar`'s `start` slot. The extension does the
 * same job locally with `@quak/qasm-transform`.
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

// Content-only parse result: the backend returns registers and layers without any
// circuit identity. Ids are re-mapped onto the active circuit during normalization.
type ParserRegister = Partial<RegisterResponse> & {
    id?: string;
    name?: string;
    type?: RegisterResponse['type'];
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
    registers?: ParserRegister[];
    layers?: ParserLayer[];
};

const extractIdentifier = (operation: ParserOperation): OperationIdentifier => {
    const rawIdentifier = operation.identifier ?? operation.operationDefinition;

    if (typeof rawIdentifier === 'string') return rawIdentifier.toUpperCase() as OperationIdentifier;
    if (rawIdentifier && typeof rawIdentifier === 'object') {
        const definition = rawIdentifier as { name?: unknown; identifier?: unknown };
        if (typeof definition.name === 'string') return definition.name.toUpperCase() as OperationIdentifier;
        if (typeof definition.identifier === 'string')
            return definition.identifier.toUpperCase() as OperationIdentifier;
    }

    return 'DUMMY';
};

const normalizeParsedCircuit = (rawCircuit: unknown, currentCircuit: CircuitResponse | undefined): CircuitResponse => {
    const parsed = rawCircuit as ParserCircuit;
    const currentRegistersByType = new Map<RegisterResponse['type'], RegisterResponse[]>();
    for (const register of currentCircuit?.registers ?? []) {
        const list = currentRegistersByType.get(register.type) ?? [];
        list.push(register);
        currentRegistersByType.set(register.type, list);
    }

    const registerTypeIndexes = new Map<RegisterResponse['type'], number>();
    const registerIdMap = new Map<string, string>();

    const registers: RegisterResponse[] = (parsed.registers ?? []).map((register, index) => {
        const type =
            register.type ?? (register.numberOfBits !== undefined ? REGISTER_TYPE_CLASSIC : REGISTER_TYPE_QUANTUM);
        const typeIndex = registerTypeIndexes.get(type) ?? 0;
        registerTypeIndexes.set(type, typeIndex + 1);
        const currentRegister = currentRegistersByType.get(type)?.[typeIndex];
        const id = currentRegister?.id ?? register.id ?? crypto.randomUUID();

        if (register.id) {
            registerIdMap.set(register.id, id);
        }

        if (type === REGISTER_TYPE_CLASSIC) {
            return {
                id,
                name:
                    register.name ??
                    (currentRegister && isClassicRegister(currentRegister) ? currentRegister.name : `c${index}`),
                type: REGISTER_TYPE_CLASSIC,
                numberOfBits:
                    register.numberOfBits ??
                    (currentRegister && isClassicRegister(currentRegister) ? currentRegister.numberOfBits : 1),
            };
        }

        return {
            id,
            name:
                register.name ??
                (currentRegister && isQuantumRegister(currentRegister) ? currentRegister.name : `q${index}`),
            type: REGISTER_TYPE_QUANTUM,
            numberOfQubits:
                register.numberOfQubits ??
                (currentRegister && isQuantumRegister(currentRegister) ? currentRegister.numberOfQubits : 1),
        };
    });

    const fallbackRegister = registers.find(isQuantumRegister) ?? currentCircuit?.registers.find(isQuantumRegister);
    if (registers.length === 0 && fallbackRegister) {
        registers.push(fallbackRegister);
    }

    const normalizeSelector = (selector: { registerId?: string; index?: number }) => ({
        registerId:
            (selector.registerId ? registerIdMap.get(selector.registerId) : undefined) ??
            selector.registerId ??
            fallbackRegister?.id ??
            registers[0]?.id,
        index: selector.index ?? 0,
    });

    return {
        id: currentCircuit?.id ?? crypto.randomUUID(),
        registers,
        layers: (parsed.layers ?? []).map((layer) => ({
            quantumOperations: (layer.quantumOperations ?? []).map((operation) => {
                const type = operation.type ?? 'ELEMENTARY_QUANTUM_GATE';
                if (type === 'MEASUREMENT') {
                    return {
                        id: operation.id ?? crypto.randomUUID(),
                        type: 'MEASUREMENT',
                        identifier: extractIdentifier(operation),
                        inverseForm: false,
                        targetQubits: (operation.targetQubits ?? []).map(normalizeSelector),
                        controlQubits: [],
                        classicBits: ('classicBits' in operation && operation.classicBits
                            ? operation.classicBits
                            : []
                        ).map(normalizeSelector),
                    };
                }

                return {
                    id: operation.id ?? crypto.randomUUID(),
                    type: 'ELEMENTARY_QUANTUM_GATE',
                    identifier: extractIdentifier(operation),
                    inverseForm: operation.inverseForm ?? false,
                    targetQubits: (operation.targetQubits ?? []).map(normalizeSelector),
                    controlQubits: (operation.controlQubits ?? []).map(normalizeSelector),
                    rotationAngle: 'rotationAngle' in operation ? (operation.rotationAngle ?? 0) : 0,
                };
            }) as QuantumOperationDto[],
        })),
    };
};
