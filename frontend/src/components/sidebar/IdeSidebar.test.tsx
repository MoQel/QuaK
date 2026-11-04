import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/api/api.ts';
import { SidebarProvider } from '@/components/ui/sidebar.tsx';
import { IdeSidebar } from './IdeSidebar.tsx';

const togglePanel = vi.fn();
const logout = vi.fn();
const toggleTheme = vi.fn();
const openRenameProjectDialog = vi.fn();
const openDeleteProjectDialog = vi.fn();
const navigate = vi.fn();
const auth = { logout };

vi.mock('@/api/api.ts', () => ({
    api: { get: vi.fn().mockResolvedValue([]) },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
    ...(await importOriginal<typeof import('react-router-dom')>()),
    useNavigate: () => navigate,
}));

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

vi.mock('@/views/project-manager-view/ProjectManagerView.tsx', () => ({
    CreateProject: ({ open }: { open: boolean }) => (open ? <div data-testid="create-dialog" /> : null),
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
            <SidebarProvider>
                <IdeSidebar />
            </SidebarProvider>
        </MemoryRouter>,
    );

const openProjectActions = () =>
    fireEvent.keyDown(screen.getByRole('button', { name: 'Project actions' }), { key: 'Enter' });

describe('IdeSidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        themeState.theme = 'dark';
    });

    it('marks open panels and toggles them from the sidebar', () => {
        renderSidebar();

        const projectButton = screen.getByRole('button', { name: 'Project panel' });
        const circuitButton = screen.getByRole('button', { name: 'Circuit panel' });

        expect(projectButton).toHaveAttribute('aria-pressed', 'true');
        expect(circuitButton).toHaveAttribute('aria-pressed', 'false');
        expect(projectButton).toHaveAttribute('data-active', 'true');
        expect(circuitButton).toHaveAttribute('data-active', 'false');

        fireEvent.click(projectButton);

        expect(togglePanel).toHaveBeenCalledWith('file');
    });

    it('renders navigation, theme toggle, and logout controls', () => {
        renderSidebar();

        expect(screen.getByRole('link', { name: 'QuaK home' })).toHaveAttribute('href', '/');
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

    it('lists projects in the switcher and navigates to the chosen one', async () => {
        vi.mocked(api.get).mockResolvedValueOnce([
            { id: 'project-1', name: 'New Project2', lastAccess: '2026-10-01T00:00:00Z' },
            { id: 'project-2', name: 'Grover', lastAccess: '2026-10-02T00:00:00Z' },
        ]);
        renderSidebar();

        fireEvent.keyDown(screen.getByRole('button', { name: 'Switch project' }), { key: 'Enter' });
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Grover' }));

        expect(navigate).toHaveBeenCalledWith('/project/project-2');
    });

    it('creates a project from the switcher', () => {
        renderSidebar();

        fireEvent.keyDown(screen.getByRole('button', { name: 'Switch project' }), { key: 'Enter' });
        fireEvent.click(screen.getByRole('menuitem', { name: 'New project' }));

        expect(screen.getByTestId('create-dialog')).toBeInTheDocument();
    });

    it('keeps project actions available after the top navbar is hidden', () => {
        renderSidebar();

        openProjectActions();
        fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
        openProjectActions();
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

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
        expect(screen.queryByRole('button', { name: 'Project actions' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('data-active', 'true');
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

    it('names the theme switch in the tooltip of the collapsed sidebar', async () => {
        renderSidebar();

        fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

        fireEvent.focus(screen.getByRole('button', { name: 'Switch to light mode' }));

        expect(await screen.findByRole('tooltip')).toHaveTextContent('Light Mode');
    });
});
