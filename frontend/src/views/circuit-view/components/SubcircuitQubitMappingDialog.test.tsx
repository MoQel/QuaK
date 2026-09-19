import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubcircuitQubitMappingDialog } from './SubcircuitQubitMappingDialog.tsx';
import { REGISTER_TYPE_QUANTUM } from '@/api/dto/circuit.ts';
import { QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import type { FlatQubit } from '@/views/circuit-view/util/types.ts';

const flatQubits: FlatQubit[] = Array.from({ length: 4 }, (_, i) => ({
    regId: 'r1',
    regName: 'q',
    regIdx: 0,
    relQubitIdx: i,
    absQubitIdx: i,
    regType: REGISTER_TYPE_QUANTUM,
    section: 'quantum' as const,
    headerY: 0,
    registerSize: 4,
    isCollapsed: false,
    visualY: i * QUBIT_HEIGHT,
}));

describe('SubcircuitQubitMappingDialog', () => {
    it('renders distinct subcircuit qubit rows and defaults to unmapped', () => {
        render(
            <SubcircuitQubitMappingDialog
                open={true}
                onOpenChange={vi.fn()}
                subcircuitName="test.qasm"
                subcircuitQubitCount={4}
                flatQubits={flatQubits}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByText('q0')).toBeDefined();
        expect(screen.getByText('q1')).toBeDefined();
        expect(screen.getByText('q2')).toBeDefined();
        expect(screen.getByText('q3')).toBeDefined();

        const unmappedLabels = screen.getAllByText('✕ Nicht importieren');
        expect(unmappedLabels.length).toBeGreaterThanOrEqual(4);
    });
});
