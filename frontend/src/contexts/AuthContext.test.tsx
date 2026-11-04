import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

const api = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/api/api', () => ({ api }));

let signInAsGuest: () => Promise<void> = async () => {};
let upgradeGuest: (provider: 'google' | 'github') => Promise<void> = async () => {};

function AuthState() {
    const auth = useAuth();
    signInAsGuest = auth.signInAsGuest;
    upgradeGuest = auth.upgradeGuest;

    if (auth.isLoading) return <output>loading</output>;
    return (
        <output>
            {`authenticated=${auth.isAuthenticated} guest=${auth.isGuest} guestEnabled=${auth.guestEnabled}`}
        </output>
    );
}

const stubAuthStatus = (status: object) =>
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => status }));

describe('AuthProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reports whether guest access is enabled for signed-out visitors', async () => {
        stubAuthStatus({ authenticated: false, userId: null, guest: false, guestEnabled: true });

        render(
            <AuthProvider>
                <AuthState />
            </AuthProvider>,
        );

        expect(await screen.findByText('authenticated=false guest=false guestEnabled=true')).toBeInTheDocument();
    });

    it('recognises a guest session', async () => {
        stubAuthStatus({ authenticated: true, userId: 'u-1', guest: true, guestEnabled: true });

        render(
            <AuthProvider>
                <AuthState />
            </AuthProvider>,
        );

        expect(await screen.findByText('authenticated=true guest=true guestEnabled=true')).toBeInTheDocument();
    });

    it('signs in as guest through the backend', async () => {
        stubAuthStatus({ authenticated: false, userId: null, guest: false, guestEnabled: true });
        api.post.mockResolvedValue({ authenticated: true, userId: 'u-2', guest: true, guestEnabled: true });

        render(
            <AuthProvider>
                <AuthState />
            </AuthProvider>,
        );
        await screen.findByText('authenticated=false guest=false guestEnabled=true');

        await act(() => signInAsGuest());

        expect(api.post).toHaveBeenCalledWith('/api/auth/guest');
        await waitFor(() =>
            expect(screen.getByText('authenticated=true guest=true guestEnabled=true')).toBeInTheDocument(),
        );
    });

    it('marks the guest for an upgrade before redirecting to the provider', async () => {
        stubAuthStatus({ authenticated: true, userId: 'u-1', guest: true, guestEnabled: true });
        const location = { href: '' };
        vi.stubGlobal('location', location);
        api.post.mockResolvedValue('');

        render(
            <AuthProvider>
                <AuthState />
            </AuthProvider>,
        );
        await screen.findByText('authenticated=true guest=true guestEnabled=true');

        await act(() => upgradeGuest('github'));

        expect(api.post).toHaveBeenCalledWith('/api/auth/guest/upgrade');
        expect(location.href).toMatch(/\/oauth2\/authorization\/github$/);
    });
});
