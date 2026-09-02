import {
    CircuitResponse,
    ElementSelectorDto,
    ElementaryQuantumGateDto,
    MeasurementDto,
    QuantumOperationDto,
    RegisterResponse,
    isClassicRegister,
    isCompositeGate,
    isQuantumRegister,
    isSubcircuit,
} from '@/api/dto/circuit.ts';
import { MeasurementMapping } from '@/simulation/simulation.types.ts';
import { throwSimulationError } from '@/simulation/simulation.errors.ts';

export type RegisterOffsets = Record<string, number>;

export interface CircuitContext {
    quantumOffsets: RegisterOffsets;
    classicOffsets: RegisterOffsets;
    quantumRegisters: Map<string, RegisterResponse>;
    classicRegisters: Map<string, RegisterResponse>;
    measurementMappings: MeasurementMapping[];
}

export function createCircuitContext(circuitData: CircuitResponse): CircuitContext {
    const quantumRegisters = new Map<string, RegisterResponse>();
    const classicRegisters = new Map<string, RegisterResponse>();
    const registerNames = new Set<string>();

    for (const register of circuitData.registers) {
        if (quantumRegisters.has(register.id) || classicRegisters.has(register.id)) {
            throwSimulationError({
                code: 'DUPLICATE_REGISTER_ID',
                message: `Register id '${register.id}' is declared more than once.`,
                registerId: register.id,
            });
        }

        if (registerNames.has(register.name)) {
            throwSimulationError({
                code: 'DUPLICATE_REGISTER_NAME',
                message: `Register name '${register.name}' is declared more than once.`,
                registerName: register.name,
            });
        }

        registerNames.add(register.name);

        if (isQuantumRegister(register)) {
            if (register.numberOfQubits < 1) {
                throwSimulationError({
                    code: 'INVALID_REGISTER_SIZE',
                    message: `Quantum register '${register.name}' must contain at least one qubit.`,
                    registerId: register.id,
                    registerName: register.name,
                });
            }
            quantumRegisters.set(register.id, register);
        }

        if (isClassicRegister(register)) {
            if (register.numberOfBits < 1) {
                throwSimulationError({
                    code: 'INVALID_REGISTER_SIZE',
                    message: `Classical register '${register.name}' must contain at least one bit.`,
                    registerId: register.id,
                    registerName: register.name,
                });
            }
            classicRegisters.set(register.id, register);
        }
    }

    const context: CircuitContext = {
        quantumOffsets: calculateQuantumRegisterOffsets(circuitData.registers),
        classicOffsets: calculateClassicRegisterOffsets(circuitData.registers),
        quantumRegisters,
        classicRegisters,
        measurementMappings: [],
    };

    context.measurementMappings = collectMeasurementMappings(circuitData, context);

    return context;
}

export function validateOperations(circuitData: CircuitResponse, context: CircuitContext): void {
    for (const layer of circuitData.layers) {
        for (const op of layer.quantumOperations) {
            validateOperation(op, context);
        }
    }
}

/**
 * A user-defined gate is validated through its body rather than rejected: it carries the gates it
 * is made of, already bound to the qubits of its call, so the simulator can expand it. A subcircuit
 * cannot be expanded — its body lives in another circuit that is not loaded here — and is reported
 * as unsupported instead, which is what keeps it from being silently skipped.
 */
function validateOperation(op: QuantumOperationDto, context: CircuitContext): void {
    if (op.type === 'ELEMENTARY_QUANTUM_GATE') {
        validateGate(op, context);
    } else if (op.type === 'MEASUREMENT') {
        validateMeasurement(op, context);
    } else if (isCompositeGate(op)) {
        for (const part of op.body ?? []) {
            validateOperation(part, context);
        }
    } else if (isSubcircuit(op)) {
        throwSimulationError({
            code: 'UNSUPPORTED_OPERATION',
            message: `Subcircuit '${op.definitionName ?? op.identifier}' references another circuit, whose contents are not loaded for simulation.`,
            operationId: op.id,
        });
    } else {
        throwSimulationError({
            code: 'UNSUPPORTED_OPERATION',
            message: `Operation '${op.identifier}' is not supported by the simulator.`,
            operationId: op.id,
        });
    }
}

export function resolveQuantumSelector(
    selector: ElementSelectorDto | undefined,
    context: CircuitContext,
    operationId?: string,
): number {
    const register = selector ? context.quantumRegisters.get(selector.registerId) : undefined;
    if (!selector || !register || !isQuantumRegister(register)) {
        throwSimulationError({
            code: 'QUANTUM_REGISTER_NOT_FOUND',
            message: `Quantum register '${selector?.registerId ?? 'unknown'}' was not found.`,
            operationId,
            registerId: selector?.registerId,
        });
    }

    if (!Number.isInteger(selector.index) || selector.index < 0 || selector.index >= register.numberOfQubits) {
        throwSimulationError({
            code: 'QUBIT_INDEX_OUT_OF_RANGE',
            message: `Qubit index ${selector.index} is outside quantum register '${register.name}'.`,
            operationId,
            registerId: register.id,
            registerName: register.name,
            bitIndex: selector.index,
        });
    }

    return context.quantumOffsets[selector.registerId] + selector.index;
}

export function resolveClassicSelector(
    selector: ElementSelectorDto | undefined,
    context: CircuitContext,
    operationId?: string,
): number {
    const register = selector ? context.classicRegisters.get(selector.registerId) : undefined;
    if (!selector || !register || !isClassicRegister(register)) {
        throwSimulationError({
            code: 'CLASSICAL_REGISTER_NOT_FOUND',
            message: `Classical register '${selector?.registerId ?? 'unknown'}' was not found.`,
            operationId,
            registerId: selector?.registerId,
        });
    }

    if (!Number.isInteger(selector.index) || selector.index < 0 || selector.index >= register.numberOfBits) {
        throwSimulationError({
            code: 'CLASSICAL_BIT_INDEX_OUT_OF_RANGE',
            message: `Classical bit index ${selector.index} is outside classical register '${register.name}'.`,
            operationId,
            registerId: register.id,
            registerName: register.name,
            bitIndex: selector.index,
        });
    }

    return context.classicOffsets[selector.registerId] + selector.index;
}

function calculateQuantumRegisterOffsets(registers: RegisterResponse[]): RegisterOffsets {
    const offsets: RegisterOffsets = {};
    let offsetCount = 0;

    for (const reg of registers) {
        if (isQuantumRegister(reg)) {
            offsets[reg.id] = offsetCount;
            offsetCount += reg.numberOfQubits;
        }
    }

    return offsets;
}

function calculateClassicRegisterOffsets(registers: RegisterResponse[]): RegisterOffsets {
    const offsets: RegisterOffsets = {};
    let offsetCount = 0;

    for (const reg of registers) {
        if (isClassicRegister(reg)) {
            offsets[reg.id] = offsetCount;
            offsetCount += reg.numberOfBits;
        }
    }

    return offsets;
}

function validateGate(op: ElementaryQuantumGateDto, context: CircuitContext): void {
    for (const target of op.targetQubits) {
        resolveQuantumSelector(target, context, op.id);
    }

    for (const control of op.controlQubits) {
        resolveQuantumSelector(control, context, op.id);
    }

    const requireShape = (targets: number, controls: number) => {
        if (op.targetQubits.length !== targets || op.controlQubits.length !== controls) {
            throwSimulationError({
                code: 'UNSUPPORTED_GATE',
                message: `Gate '${op.identifier}' expects ${targets} target qubit(s) and ${controls} control qubit(s).`,
                operationId: op.id,
            });
        }
    };

    switch (op.identifier) {
        case 'H':
        case 'X':
        case 'Y':
        case 'Z':
        case 'S':
        case 'T':
        case 'RX':
        case 'RY':
        case 'RZ':
            requireShape(1, 0);
            break;
        case 'CX':
        case 'CZ':
            requireShape(1, 1);
            break;
        case 'SWAP':
            requireShape(2, 0);
            break;
        case 'CCX':
            requireShape(1, 2);
            break;
        default:
            throwSimulationError({
                code: 'UNSUPPORTED_GATE',
                message: `Gate '${op.identifier}' is not supported by the simulator.`,
                operationId: op.id,
            });
    }
}

function validateMeasurement(measurement: MeasurementDto, context: CircuitContext): void {
    if (measurement.targetQubits.length === 0 || measurement.classicBits.length === 0) {
        throwSimulationError({
            code: 'MEASUREMENT_TARGET_MISSING',
            message: 'A measurement must have at least one quantum source and one classical destination.',
            operationId: measurement.id,
        });
    }

    if (measurement.targetQubits.length !== measurement.classicBits.length) {
        const firstSource = measurement.targetQubits[0];
        const firstTarget = measurement.classicBits[0];
        const quantumRegister = firstSource ? context.quantumRegisters.get(firstSource.registerId) : undefined;
        const classicRegister = firstTarget ? context.classicRegisters.get(firstTarget.registerId) : undefined;

        throwSimulationError({
            code: 'MEASUREMENT_REGISTER_SIZE_MISMATCH',
            message:
                quantumRegister && classicRegister
                    ? `Cannot measure quantum register '${quantumRegister.name}' into classical register '${classicRegister.name}' because the selected bit counts differ.`
                    : 'Cannot execute a measurement with a different number of quantum sources and classical destinations.',
            operationId: measurement.id,
            registerId: classicRegister?.id ?? quantumRegister?.id,
            registerName: classicRegister?.name ?? quantumRegister?.name,
        });
    }

    measurement.targetQubits.forEach((targetQubit, index) => {
        resolveQuantumSelector(targetQubit, context, measurement.id);
        resolveClassicSelector(measurement.classicBits[index], context, measurement.id);
    });
}

function collectMeasurementMappings(circuitData: CircuitResponse, context: CircuitContext): MeasurementMapping[] {
    const mappings: MeasurementMapping[] = [];
    let executionOrder = 0;

    for (const layer of circuitData.layers) {
        for (const op of layer.quantumOperations) {
            if (op.type !== 'MEASUREMENT') continue;

            op.targetQubits.forEach((targetQubit, index) => {
                const classicBit = op.classicBits[index];
                if (!classicBit) return;

                const quantumRegister = context.quantumRegisters.get(targetQubit.registerId);
                const classicRegister = context.classicRegisters.get(classicBit.registerId);
                if (!quantumRegister || !classicRegister) return;

                mappings.push({
                    operationId: op.id,
                    executionOrder: executionOrder++,
                    source: {
                        registerId: targetQubit.registerId,
                        registerName: quantumRegister.name,
                        bitIndex: targetQubit.index,
                        globalQubitIndex: (context.quantumOffsets[targetQubit.registerId] ?? 0) + targetQubit.index,
                    },
                    target: {
                        registerId: classicBit.registerId,
                        registerName: classicRegister.name,
                        bitIndex: classicBit.index,
                        classicalAddress: (context.classicOffsets[classicBit.registerId] ?? 0) + classicBit.index,
                    },
                });
            });
        }
    }

    return mappings;
}
