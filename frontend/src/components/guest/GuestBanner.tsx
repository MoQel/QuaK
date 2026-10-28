import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext.tsx';
import { GUEST_DATA_NOTICE } from './guestNotice';

/** Explains the limits of a guest session; renders nothing for accounts. */
export function GuestBanner({ linkToProfile = false }: Readonly<{ linkToProfile?: boolean }>) {
    const { isGuest } = useAuth();

    if (!isGuest) return null;

    return (
        <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-lg border border-special/40 bg-special/10 px-4 py-3 text-sm text-text"
        >
            <Info className="mt-0.5 size-4 shrink-0 text-special" />
            <p>
                <span className="font-semibold">You are a Guest user.</span> {GUEST_DATA_NOTICE}{' '}
                {linkToProfile ? (
                    <Link to="/profile" className="font-semibold text-special underline underline-offset-2">
                        Sign in
                    </Link>
                ) : (
                    'Sign in'
                )}{' '}
                to keep your projects.
            </p>
        </div>
    );
}
