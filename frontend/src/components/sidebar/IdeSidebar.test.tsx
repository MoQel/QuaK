import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IdeSidebar } from './IdeSidebar.tsx';

const togglePanel = vi.fn();
const logout = vi.fn();
const toggleTheme = vi.fn();
const openRenameProjectDialog = vi.fn();
const openDeleteProjectDialog = vi.fn();
const auth = { logout, isGuest: false };

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
    useAuth: () => auth,
}));

const themeState = { theme: 'dark', toggleTheme };

vi.mock('@/theme.tsx', () => ({
    useTheme: () => themeState,
}));

vi.mock('@/components/projects/useProjectActionsDialog.tsx', () => ({
    useProjectActionsDialog: () => ({
        dialog: null,
        openRenameProjectDialog,
        openDeleteProjectDialog,
    }),
}));

const renderSidebar = (initialEntries = ['/project/project-1']) =>
    render(
        <MemoryRouter initialEntries={initialEntries}>
            <IdeSidebar />
        </MemoryRouter>,
    );

describe('IdeSidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        auth.isGuest = false;
        themeState.theme = 'dark';
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

        fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
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

    it('hides IDE panel controls outside project routes', () => {
        renderSidebar(['/settings']);

        expect(screen.queryByRole('button', { name: 'Project panel' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Circuit panel' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Rename project' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('text-special');
    });

    it('marks the profile entry of a guest session', () => {
        auth.isGuest = true;
        renderSidebar();

        const profileLink = screen.getByRole('link', { name: 'Profile' });
        expect(profileLink).toHaveTextContent('Guest');
        expect(profileLink).toHaveAttribute('title', expect.stringContaining('deleted after 2 hours of inactivity'));
    });

    it('asks a guest to confirm before signing out', () => {
        auth.isGuest = true;
        renderSidebar();

        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

        expect(logout).not.toHaveBeenCalled();
        expect(screen.getByRole('alertdialog', { name: 'End guest session?' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'End session' }));

        expect(logout).toHaveBeenCalledOnce();
    });

    it('keeps a guest signed in when the logout is cancelled', () => {
        auth.isGuest = true;
        renderSidebar();

        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(logout).not.toHaveBeenCalled();
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('offers the light theme while the dark theme is active', () => {
        renderSidebar();

        const themeSwitch = screen.getByRole('button', { name: 'Switch to light mode' });
        expect(themeSwitch).toHaveTextContent('Light Mode');
    });

    it('offers the dark theme while the light theme is active', () => {
        themeState.theme = 'light';
        renderSidebar();

        const themeSwitch = screen.getByRole('button', { name: 'Switch to dark mode' });
        expect(themeSwitch).toHaveTextContent('Dark Mode');
    });

    it('names the theme switch in the tooltip of the collapsed sidebar', () => {
        renderSidebar();

        fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

        expect(screen.getByRole('button', { name: 'Switch to light mode' })).toHaveAttribute('title', 'Light Mode');
    });
});
