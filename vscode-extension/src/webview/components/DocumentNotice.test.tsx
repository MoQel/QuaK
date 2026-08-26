// @vitest-environment jsdom
import type { DocumentClassification } from '@quak/qasm-transform';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { DocumentNotice } from './DocumentNotice.tsx';

function textFor(classification: DocumentClassification, hasCircuit = false): string {
    const container = document.createElement('div');
    document.body.append(container);

    act(() => {
        createRoot(container).render(
            <DocumentNotice
                state="readOnly"
                classification={classification}
                hasCircuit={hasCircuit}
                onEditAnyway={vi.fn()}
            />,
        );
    });

    return container.textContent ?? '';
}

describe('what a document without a circuit is told to add', () => {
    it('names all three lines for an empty file', () => {
        const text = textFor({ kind: 'empty' });

        expect(text).toContain('OPENQASM 3.0;');
        expect(text).toContain('include "stdgates.inc";');
        expect(text).toContain('qubit[4] q;');
    });

    it('leaves out the version once it is there', () => {
        const text = textFor({ kind: 'noRegister', hasVersion: true, hasInclude: false });

        expect(text).not.toContain('OPENQASM 3.0;');
        expect(text).toContain('include "stdgates.inc";');
        expect(text).toContain('qubit[4] q;');
    });

    it('asks for the register alone once version and include are there', () => {
        const text = textFor({ kind: 'noRegister', hasVersion: true, hasInclude: true });

        expect(text).not.toContain('OPENQASM 3.0;');
        expect(text).not.toContain('stdgates.inc');
        expect(text).toContain('qubit[4] q;');
    });
});

// A notice that says there is nothing to see contradicts the pane below it.
describe('what a file with errors is told', () => {
    const BROKEN: DocumentClassification = {
        kind: 'invalid',
        problems: [
            { line: 4, column: 0, construct: 'syntax', message: 'This statement cannot be read.', kind: 'invalid' },
        ],
    };

    it('calls the circuit incomplete rather than absent while it is on screen', () => {
        const text = textFor(BROKEN, true);

        expect(text).toContain('incomplete');
        expect(text).not.toContain('no circuit to show');
    });

    it('says there is nothing to show when nothing could be read', () => {
        expect(textFor(BROKEN, false)).toContain('no circuit to show');
    });

    it.each([true, false])('names the errors either way (circuit on screen: %s)', (hasCircuit) => {
        expect(textFor(BROKEN, hasCircuit)).toContain('Line 4: This statement cannot be read.');
    });
});
