import { Gauge, Plus, X as LucideX } from 'lucide-react';
import { ComponentType } from 'react';
import { GATE_ARITY, type GateArity, type OperationIdentifier } from '@quak/circuit-core';

// Domain types live in circuit-core; re-exported here for existing importers.
// This file owns the presentation layer (icons, colors, shapes) and composes it
// onto the shared arity — which the QASM transform reads too, so the two cannot
// disagree about how many qubits a gate takes.
export type { OperationIdentifier };

export type ShapeClass = 'rounded-none' | 'rounded-full';

export type Color = `var(--${string})` | 'transparent';

export interface OperationPresentation {
    icon: { type: 'component'; component: ComponentType<{ className?: string }> } | { type: 'text'; text: string };
    label?: string;
    formClass: ShapeClass;
    color: Color;
}

export type OperationDefinition = GateArity & OperationPresentation;

const PRESENTATION: Record<OperationIdentifier, OperationPresentation> = {
    H: { icon: { type: 'text', text: 'H' }, formClass: 'rounded-none', color: 'var(--hadamard)' },
    X: { icon: { type: 'component', component: Plus }, formClass: 'rounded-full', color: 'var(--classical)' },
    Y: { icon: { type: 'text', text: 'Y' }, formClass: 'rounded-none', color: 'var(--quantum)' },
    Z: { icon: { type: 'text', text: 'Z' }, formClass: 'rounded-none', color: 'var(--phase)' },
    CX: { icon: { type: 'component', component: Plus }, formClass: 'rounded-full', color: 'var(--classical)' },
    CCX: { icon: { type: 'component', component: Plus }, formClass: 'rounded-full', color: 'var(--classical)' },
    CZ: { icon: { type: 'text', text: 'Z' }, formClass: 'rounded-none', color: 'var(--phase)' },
    SWAP: { icon: { type: 'component', component: LucideX }, formClass: 'rounded-none', color: 'var(--classical)' },
    S: { icon: { type: 'text', text: 'S' }, formClass: 'rounded-none', color: 'var(--phase)' },
    T: { icon: { type: 'text', text: 'T' }, formClass: 'rounded-none', color: 'var(--phase)' },
    RX: { icon: { type: 'text', text: 'RX' }, formClass: 'rounded-none', color: 'var(--quantum)' },
    RY: { icon: { type: 'text', text: 'RY' }, formClass: 'rounded-none', color: 'var(--quantum)' },
    RZ: { icon: { type: 'text', text: 'RZ' }, formClass: 'rounded-none', color: 'var(--quantum)' },
    MEASURE: {
        icon: { type: 'component', component: Gauge },
        formClass: 'rounded-none',
        color: 'var(--non-unitary-and-modifiers)',
    },
    DUMMY: { icon: { type: 'text', text: '' }, formClass: 'rounded-none', color: 'var(--non-unitary-and-modifiers)' },
};

const OPERATION_DEFINITIONS = Object.fromEntries(
    Object.entries(PRESENTATION).map(([identifier, presentation]) => [
        identifier,
        { ...GATE_ARITY[identifier as OperationIdentifier], ...presentation },
    ]),
) as Record<OperationIdentifier, OperationDefinition>;

const isOperationIdentifier = (identifier: string): identifier is OperationIdentifier => {
    return identifier in OPERATION_DEFINITIONS;
};

const normalizeOperationIdentifier = (identifier: unknown): OperationIdentifier | null => {
    if (typeof identifier !== 'string') return null;

    const normalized = identifier.toUpperCase();
    if (isOperationIdentifier(normalized)) return normalized;

    return null;
};

/**
 * Takes `unknown` on purpose: identifiers can come from parsed QASM, so an
 * unrecognized gate must render as a labelled box rather than crash the editor.
 */
export const getOperationDefinition = (identifier: unknown): OperationDefinition => {
    const normalizedIdentifier = normalizeOperationIdentifier(identifier);

    if (!normalizedIdentifier) {
        console.warn('Unknown quantum operation identifier:', identifier);
        return {
            ...OPERATION_DEFINITIONS.DUMMY,
            type: 'ELEMENTARY_QUANTUM_GATE',
            icon: { type: 'text', text: typeof identifier === 'string' ? identifier.toUpperCase() : '?' },
        };
    }

    return OPERATION_DEFINITIONS[normalizedIdentifier];
};
