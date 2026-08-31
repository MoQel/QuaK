import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IdeSidebar } from './IdeSidebar.tsx';

const togglePanel = vi.fn();
const logout = vi.fn();
const toggleTheme = vi.fn();
const openRenameProjectDialog = vi.fn();
const openDeleteProjectDialog = vi.fn();

vi.mock('@/contexts/ProjectContext.tsx', () => ({
    useProject: () => ({
        projectId: 'project-1',
        projectName: 'New Project2',
        refreshProject: vi.fn(),
    }),
}));

vi.mock('@/contexts/DockviewContext.tsx', () => ({
    useDockview: () => ({
        openPanels: new Set(['file', 'library']),
        togglePanel,
    }),
}));

vi.mock('@/contexts/AuthContext.tsx', () => ({
    useAuth: () => ({
        logout,
    }),
}));

vi.mock('@/hooks/useUser.ts', () => ({
    useCurrentUser: () => ({
        user: {
            name: 'Ilias',
            email: 'ilias@example.com',
        },
    }),
}));

vi.mock('@/theme.tsx', () => ({
    useTheme: () => ({
        theme: 'dark',
        toggleTheme,
    }),
}));

vi.mock('@/components/projects/useProjectActionsDialog.tsx', () => ({
    useProjectActionsDialog: () => ({
        dialog: null,
        openRenameProjectDialog,
        openDeleteProjectDialog,
    }),
}));

const renderSidebar = () =>
    render(
        <MemoryRouter>
            <IdeSidebar />
        </MemoryRouter>,
    );

describe('IdeSidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('marks open panels and toggles them from the sidebar', () => {
        renderSidebar();

        const projectButton = screen.getByRole('button', { name: 'Project panel' });
        const circuitButton = screen.getByRole('button', { name: 'Circuit panel' });

        expect(projectButton).toHaveAttribute('aria-pressed', 'true');
        expect(circuitButton).toHaveAttribute('aria-pressed', 'false');
        expect(projectButton).toHaveClass('text-special');
        expect(circuitButton).toHaveClass('text-text');
        expect(circuitButton.className).not.toContain('hover:text-special');

        fireEvent.click(projectButton);

        expect(togglePanel).toHaveBeenCalledWith('file');
    });

    it('renders navigation, theme toggle, and logout controls', () => {
        renderSidebar();

        expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
        expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');

        fireEvent.click(screen.getByRole('button', { name: 'Toggle dark mode' }));
        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

        expect(toggleTheme).toHaveBeenCalledOnce();
        expect(logout).toHaveBeenCalledOnce();
    });

    it('can expand again after being collapsed', () => {
        renderSidebar();

        fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

        expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
        expect(screen.queryByText('New Project2')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));

        expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
        expect(screen.getByText('New Project2')).toBeInTheDocument();
    });

    it('keeps project actions available after the top navbar is hidden', () => {
        renderSidebar();

        fireEvent.click(screen.getByRole('button', { name: 'Rename project' }));
        fireEvent.click(screen.getByRole('button', { name: 'Delete project' }));

        expect(openRenameProjectDialog).toHaveBeenCalledWith(
            { id: 'project-1', name: 'New Project2' },
            { onRenamed: expect.any(Function) },
        );
        expect(openDeleteProjectDialog).toHaveBeenCalledWith(
            { id: 'project-1', name: 'New Project2' },
            { onDeleted: expect.any(Function) },
        );
    });
});
