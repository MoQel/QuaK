import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginOptions } from './LogIn';

const auth = vi.hoisted(() => ({
    login: vi.fn(),
    signInAsGuest: vi.fn(),
    guestEnabled: false,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => auth,
}));

const renderOptions = () =>
    render(
        <MemoryRouter>
            <LoginOptions />
        </MemoryRouter>,
    );

describe('LoginOptions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        auth.guestEnabled = false;
        auth.signInAsGuest.mockResolvedValue(undefined);
    });

    it('hides guest access when the backend does not allow it', () => {
        renderOptions();

        expect(screen.queryByRole('button', { name: 'Continue as guest' })).not.toBeInTheDocument();
    });

    it('signs in as guest and explains what happens to guest projects', async () => {
        auth.guestEnabled = true;
        renderOptions();

        expect(screen.getByText(/deleted after 2 hours of inactivity/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Continue as guest' }));

        await waitFor(() => expect(auth.signInAsGuest).toHaveBeenCalledOnce());
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('reports a failed guest sign-in', async () => {
        auth.guestEnabled = true;
        auth.signInAsGuest.mockRejectedValue(new Error('Not Found'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        renderOptions();

        fireEvent.click(screen.getByRole('button', { name: 'Continue as guest' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Guest access is currently unavailable.');
    });
});
