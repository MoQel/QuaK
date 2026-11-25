import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const PARAM = 'guest_upgrade';

const RESULTS: Record<string, () => void> = {
    success: () => toast.success('Your guest projects are now part of your account.'),
    email_exists: () =>
        toast.error('This email address is already associated with another sign-in method.', {
            description: 'You are still signed in as a guest and your projects are unchanged.',
        }),
    failed: () =>
        toast.error('Your guest projects could not be moved to your account.', {
            description: 'You are still signed in as a guest and can try again.',
        }),
};

/** Reports the outcome of a guest upgrade that the backend passes back after the OAuth2 login. */
export function useGuestUpgradeResult() {
    const [searchParams, setSearchParams] = useSearchParams();
    const result = searchParams.get(PARAM);

    useEffect(() => {
        if (!result) return;
        RESULTS[result]?.();
        setSearchParams(
            (params) => {
                params.delete(PARAM);
                return params;
            },
            { replace: true },
        );
    }, [result, setSearchParams]);
}
