import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IdeSidebar } from './IdeSidebar.tsx';

const togglePanel = vi.fn();

vi.mock('@/contexts/ProjectContext.tsx', () => ({
    useProject: () => ({
        projectName: 'New Project2',
    }),
}));

vi.mock('@/contexts/DockviewContext.tsx', () => ({
    useDockview: () => ({
        openPanels: new Set(['file', 'library']),
        togglePanel,
    }),
}));

describe('IdeSidebar', () => {
    it('marks open panels and toggles them from the sidebar', () => {
        render(<IdeSidebar />);

        const projectButton = screen.getByRole('button', { name: 'Project panel' });
        const circuitButton = screen.getByRole('button', { name: 'Circuit panel' });

        expect(projectButton).toHaveAttribute('aria-pressed', 'true');
        expect(circuitButton).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(projectButton);

        expect(togglePanel).toHaveBeenCalledWith('file');
    });
});
