import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGuestUpgradeResult } from './useGuestUpgradeResult.ts';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));

function Harness() {
    useGuestUpgradeResult();
    const location = useLocation();
    return <output data-testid="search">{location.search}</output>;
}

const visit = (path: string) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Harness />
        </MemoryRouter>,
    );

describe('useGuestUpgradeResult', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('confirms a successful upgrade and removes the result from the URL', () => {
        visit('/?guest_upgrade=success');

        expect(toast.success).toHaveBeenCalledWith('Your guest projects are now part of your account.');
        expect(screen.getByTestId('search')).toBeEmptyDOMElement();
    });

    it('explains that a guest whose email is taken stays a guest', () => {
        visit('/?guest_upgrade=email_exists');

        expect(toast.error).toHaveBeenCalledWith(
            'This email address is already associated with another sign-in method.',
            {
                description: 'You are still signed in as a guest and your projects are unchanged.',
            },
        );
    });

    it('stays silent without an upgrade result', () => {
        visit('/');

        expect(toast.success).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
    });
});
