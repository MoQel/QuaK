import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GuestUpgradeButtons } from './GuestUpgradeButtons.tsx';

const auth = vi.hoisted(() => ({ upgradeGuest: vi.fn() }));
const toast = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('@/contexts/AuthContext.tsx', () => ({ useAuth: () => auth }));
vi.mock('sonner', () => ({ toast }));

describe('GuestUpgradeButtons', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('starts the upgrade with the chosen provider', () => {
        auth.upgradeGuest.mockReturnValue(new Promise(() => {}));
        render(<GuestUpgradeButtons />);

        fireEvent.click(screen.getByRole('button', { name: 'Sign in with GitHub' }));

        expect(auth.upgradeGuest).toHaveBeenCalledWith('github');
        expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeDisabled();
    });

    it('reports a failed start and allows another attempt', async () => {
        auth.upgradeGuest.mockRejectedValue(new Error('Unprocessable Entity'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<GuestUpgradeButtons />);

        fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not start the sign-in. Please try again.'));
        expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeEnabled();
    });
});
