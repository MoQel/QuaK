import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
}));

vi.mock('./contexts/AuthContext', () => ({
    AuthProvider: ({ children }: { children: ReactNode }) => children,
    useAuth: () => auth,
}));
vi.mock('./App', () => ({ default: () => <div>Project editor</div> }));
vi.mock('./pages/Home.tsx', () => ({ default: () => <div>My projects</div> }));
vi.mock('./pages/Profile', () => ({ default: () => <div>My profile</div> }));
vi.mock('./pages/Settings', () => ({ default: () => <div>My settings</div> }));
vi.mock('./components/Layout', async () => {
    const { Outlet } = await import('react-router-dom');
    return {
        default: () => (
            <div data-testid="application-layout">
                <Outlet />
            </div>
        ),
    };
});

import { router } from './router';

function RouteHarness() {
    const location = useLocation();
    const content = useRoutes(router.routes);
    return (
        <>
            {content}
            <output data-testid="current-path">{location.pathname}</output>
        </>
    );
}

function visit(path: string) {
    render(
        <MemoryRouter initialEntries={[path]}>
            <RouteHarness />
        </MemoryRouter>,
    );
}

beforeEach(() => {
    auth.isAuthenticated = false;
    auth.isLoading = false;
});

describe('landing page with original application URLs', () => {
    it('shows the public landing page at home when signed out', () => {
        visit('/');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
            'Build and simulate quantum circuits in your browser.',
        );
        expect(screen.queryByTestId('application-layout')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'KIT - Karlsruher Institut für Technologie' })).toHaveAttribute(
            'src',
            '/kit-logo.svg',
        );
    });

    it('waits for authentication before choosing landing or application', () => {
        auth.isLoading = true;
        visit('/');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('My projects')).not.toBeInTheDocument();
        expect(screen.queryByText('Build and simulate quantum circuits in your browser.')).not.toBeInTheDocument();
    });

    it.each([
        ['/', 'My projects'],
        ['/profile', 'My profile'],
        ['/settings', 'My settings'],
        ['/project/example-id', 'Project editor'],
    ])('opens %s for signed-in users', (path, content) => {
        auth.isAuthenticated = true;
        visit(path);
        expect(screen.getByTestId('application-layout')).toHaveTextContent(content);
    });

    it.each(['/profile', '/settings', '/project/example-id'])('protects %s from signed-out visitors', async (path) => {
        visit(path);
        expect(await screen.findByRole('heading', { name: 'Sign in to QuaK' })).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent(/^\/login$/);
        expect(screen.queryByTestId('application-layout')).not.toBeInTheDocument();
    });

    it('takes an authenticated visitor from sign-in to their projects', async () => {
        auth.isAuthenticated = true;
        visit('/login');
        expect(await screen.findByText('My projects')).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent(/^\/$/);
    });

    it('retains the sign-in error message on the dedicated page', async () => {
        visit('/login?error=email_exists');
        expect(
            await screen.findByText('This email address is already associated with another sign-in method.'),
        ).toBeInTheDocument();
    });
});
