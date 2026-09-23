import { expect } from 'vitest';
import type { CircuitContent } from '@quak/circuit-core';
import { isEditable, toCircuit, type ToCircuitResult } from './toCircuit.ts';

// Shared by the transform test suites. Not exported from the package.

export const HEADER = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n';

/** A parse result whose content is known to exist. */
export type EditableParse = Omit<ToCircuitResult, 'content'> & { content: CircuitContent };

/** Parses a fixture the test needs to be editable, and names the fixture when it is not. */
export function parseEditable(source: string): EditableParse {
    const parsed = toCircuit(source);
    expect(isEditable(parsed), `fixture is not editable: ${JSON.stringify(parsed.unsupported)}`).toBe(true);
    if (!parsed.content) throw new Error(`fixture produced no circuit: ${JSON.stringify(source)}`);

    return { ...parsed, content: parsed.content };
}

/** The circuit of an editable fixture. */
export const circuitOf = (source: string): CircuitContent => parseEditable(source).content;
