import { useState } from 'react';
import { toast } from 'sonner';

import { GithubMark, GoogleMark } from '@/components/brand/BrandMarks.tsx';
import { Button } from '@quak/ui/button';
import { cn } from '@quak/ui/lib/utils';
import { useAuth } from '@/contexts/AuthContext.tsx';

type Provider = 'google' | 'github';

/** Lets a guest sign in with a real account that takes over the guest's projects. */
export function GuestUpgradeButtons({ className }: Readonly<{ className?: string }>) {
    const { upgradeGuest } = useAuth();
    const [pending, setPending] = useState(false);

    const upgradeWith = (provider: Provider) => {
        setPending(true);
        upgradeGuest(provider).catch((error) => {
            console.error('Guest upgrade failed:', error);
            toast.error('Could not start the sign-in. Please try again.');
            setPending(false);
        });
    };

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => upgradeWith('google')}
            >
                <GoogleMark className="size-4" />
                Sign in with Google
            </Button>
            <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => upgradeWith('github')}
            >
                <GithubMark className="size-4" />
                Sign in with GitHub
            </Button>
        </div>
    );
}
