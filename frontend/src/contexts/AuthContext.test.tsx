import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

const api = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/api/api', () => ({ api }));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const renderAuth = async () => {
    const hook = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
    return hook;
};

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

        const { result } = await renderAuth();

        expect(result.current).toMatchObject({ isAuthenticated: false, isGuest: false, guestEnabled: true });
    });

    it('recognises a guest session', async () => {
        stubAuthStatus({ authenticated: true, userId: 'u-1', guest: true, guestEnabled: true });

        const { result } = await renderAuth();

        expect(result.current).toMatchObject({ isAuthenticated: true, isGuest: true, guestEnabled: true });
    });

    it('signs in as guest through the backend', async () => {
        stubAuthStatus({ authenticated: false, userId: null, guest: false, guestEnabled: true });
        api.post.mockResolvedValue({ authenticated: true, userId: 'u-2', guest: true, guestEnabled: true });

        const { result } = await renderAuth();

        await act(() => result.current.signInAsGuest());

        expect(api.post).toHaveBeenCalledWith('/api/auth/guest');
        await waitFor(() =>
            expect(result.current).toMatchObject({ isAuthenticated: true, isGuest: true, guestEnabled: true }),
        );
    });

    it('marks the guest for an upgrade before redirecting to the provider', async () => {
        stubAuthStatus({ authenticated: true, userId: 'u-1', guest: true, guestEnabled: true });
        const location = { href: '' };
        vi.stubGlobal('location', location);
        api.post.mockResolvedValue('');

        const { result } = await renderAuth();

        await act(() => result.current.upgradeGuest('github'));

        expect(api.post).toHaveBeenCalledWith('/api/auth/guest/upgrade');
        expect(location.href).toMatch(/\/oauth2\/authorization\/github$/);
    });
});
