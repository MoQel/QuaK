import { Gauge, Plus, X as LucideX } from 'lucide-react';
import { ComponentType } from 'react';
import { QuantumOperationType } from '@/api/dto/circuit.ts';

export type OperationIdentifier =
    | 'H'
    | 'X'
    | 'Y'
    | 'Z'
    | 'CX'
    | 'CCX'
    | 'CZ'
    | 'SWAP'
    | 'S'
    | 'T'
    | 'RX'
    | 'RY'
    | 'RZ'
    | 'MEASURE'
    | 'DUMMY';

export type ShapeClass = 'rounded-none' | 'rounded-full';

export type Color = `var(--${string})` | 'transparent';

export type OperationDefinition = {
    type: QuantumOperationType;
    targetSize: number;
    controlSize: number;
    totalSize: number;
    icon: { type: 'component'; component: ComponentType<any> } | { type: 'text'; text: string };
    label?: string;
    formClass: ShapeClass;
    color: Color;
};

const H: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: 'H' },
    formClass: 'rounded-none',
    color: 'var(--hadamard)',
};

const X: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'component', component: Plus },
    formClass: 'rounded-full',
    color: 'var(--classical)',
};

const Y: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: 'Y' },
    formClass: 'rounded-none',
    color: 'var(--quantum)',
};

const Z: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: 'Z' },
    formClass: 'rounded-none',
    color: 'var(--phase)',
};

const CX: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 1,
    totalSize: 2,
    icon: { type: 'component', component: Plus },
    formClass: 'rounded-full',
    color: 'var(--classical)',
};

const CCX: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 2,
    totalSize: 3,
    icon: { type: 'component', component: Plus },
    formClass: 'rounded-full',
    color: 'var(--classical)',
};

const CZ: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 1,
    totalSize: 2,
    icon: { type: 'text', text: 'Z' },
    formClass: 'rounded-none',
    color: 'var(--phase)',
};

const SWAP: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 2,
    controlSize: 0,
    totalSize: 2,
    icon: { type: 'component', component: LucideX },
    formClass: 'rounded-none',
    color: 'var(--classical)',
};

const S: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: 'S' },
    formClass: 'rounded-none',
    color: 'var(--phase)',
};

const T: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: 'T' },
    formClass: 'rounded-none',
    color: 'var(--phase)',
};

const RX: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: 'RX' },
    formClass: 'rounded-none',
    color: 'var(--quantum)',
};

const RY: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: 'RY' },
    formClass: 'rounded-none',
    color: 'var(--quantum)',
};

const RZ: OperationDefinition = {
    type: 'ELEMENTARY_QUANTUM_GATE',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: 'RZ' },
    formClass: 'rounded-none',
    color: 'var(--quantum)',
};

const MEASURE: OperationDefinition = {
    type: 'MEASUREMENT',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'component', component: Gauge },
    formClass: 'rounded-none',
    color: 'var(--non-unitary-and-modifiers)',
};

const DUMMY: OperationDefinition = {
    type: 'DUMMY',
    targetSize: 1,
    controlSize: 0,
    totalSize: 1,
    icon: { type: 'text', text: '' },
    formClass: 'rounded-none',
    color: 'var(--non-unitary-and-modifiers)',
};

const OPERATION_DEFINITIONS: Record<OperationIdentifier, OperationDefinition> = {
    H,
    X,
    Y,
    Z,
    CX,
    CCX,
    CZ,
    SWAP,
    S,
    T,
    RX,
    RY,
    RZ,
    MEASURE,
    DUMMY,
};

export const getOperationDefinition = (identifier: OperationIdentifier): OperationDefinition => {
    return OPERATION_DEFINITIONS[identifier];
};
