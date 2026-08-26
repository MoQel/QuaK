// @vitest-environment jsdom
import type { DocumentClassification } from '@quak/qasm-transform';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { DocumentNotice } from './DocumentNotice.tsx';

function textFor(classification: DocumentClassification): string {
    const container = document.createElement('div');
    document.body.append(container);

    act(() => {
        createRoot(container).render(
            <DocumentNotice state="readOnly" classification={classification} onEditAnyway={vi.fn()} />,
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
