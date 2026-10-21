import { Info } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext.tsx';
import { GUEST_DATA_NOTICE } from './guestNotice';

/** Explains the limits of a guest session; renders nothing for signed-in accounts. */
export function GuestBanner() {
    const { isGuest } = useAuth();

    if (!isGuest) return null;

    return (
        <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-lg border border-special/40 bg-special/10 px-4 py-3 text-sm text-text"
        >
            <Info className="mt-0.5 size-4 shrink-0 text-special" />
            <p>
                <span className="font-semibold">You are using QuaK as a guest.</span> {GUEST_DATA_NOTICE}
            </p>
        </div>
    );
}
