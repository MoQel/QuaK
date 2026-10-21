import React, { useEffect, useState } from 'react';
import { ArrowLeft, UserRound } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GUEST_DATA_NOTICE } from '@/components/guest/guestNotice';
import { Separator } from '@/components/ui/separator';
import { LandingAlert } from '@/components/landing/LandingAlert';
import { LandingButton } from '@/components/landing/LandingButton';
import { GithubMark, GoogleMark } from '@/components/landing/BrandMarks';
import './LandingPageAlternative.css';

export const LoginOptions: React.FC = () => {
    const { login, guestEnabled, signInAsGuest } = useAuth();
    const [guestPending, setGuestPending] = useState(false);
    const [guestError, setGuestError] = useState<string | null>(null);

    const continueAsGuest = () => {
        setGuestPending(true);
        setGuestError(null);
        signInAsGuest()
            .catch((error) => {
                console.error('Guest sign-in failed:', error);
                setGuestError('Guest access is currently unavailable. Please try again later.');
            })
            .finally(() => setGuestPending(false));
    };

    return (
        <div className="space-y-3">
            <LandingButton variant="light" onClick={() => login('google')}>
                <GoogleMark />
                Continue with Google
            </LandingButton>
            <LandingButton variant="dark" onClick={() => login('github')}>
                <GithubMark />
                Continue with GitHub
            </LandingButton>
            {guestEnabled && (
                <>
                    <div className="flex items-center gap-3 py-1 text-xs text-landing-ink-muted" aria-hidden="true">
                        <Separator className="flex-1 bg-landing-border-strong" />
                        or
                        <Separator className="flex-1 bg-landing-border-strong" />
                    </div>
                    <LandingButton variant="dashed" onClick={continueAsGuest} disabled={guestPending}>
                        <UserRound className="h-5 w-5" aria-hidden="true" />
                        Continue as guest
                    </LandingButton>
                    <p className="text-xs leading-5 text-landing-ink-muted">No account needed. {GUEST_DATA_NOTICE}</p>
                    {guestError && <LandingAlert>{guestError}</LandingAlert>}
                </>
            )}
        </div>
    );
};

export const LogIn: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams.get('error') === 'email_exists') {
            setErrorMessage('This email address is already associated with another sign-in method.');
            searchParams.delete('error');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <main className="quak-landing min-h-screen bg-landing-canvas-warm text-landing-ink">
            <div className="h-1.5 bg-landing-accent" />
            <div className="mx-auto flex min-h-[calc(100vh-0.375rem)] max-w-[1180px] flex-col px-5 py-8 sm:px-8">
                <Link
                    to="/"
                    className="inline-flex w-fit items-center gap-2 text-sm text-landing-ink-muted hover:text-landing-accent-strong"
                >
                    <ArrowLeft className="h-4 w-4" />
                    QuaK
                </Link>

                <section className="my-auto w-full max-w-md self-center rounded-3xl border border-landing-border-strong bg-landing-surface-raised p-7 sm:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-landing-ink-muted">
                        Workspace access
                    </p>
                    <h1 className="mt-3 text-3xl font-normal">Sign in to QuaK</h1>

                    {errorMessage && <LandingAlert className="mt-5">{errorMessage}</LandingAlert>}

                    <div className="mt-7">
                        <LoginOptions />
                    </div>
                </section>
            </div>
        </main>
    );
};

export default LogIn;
