import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './LandingPageAlternative.css';

const GoogleMark = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.56 10.56 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        />
    </svg>
);

const GithubMark = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
            fill="currentColor"
            d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.8c1.02 0 2.05.14 3 .4 2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.3c0 .32.19.69.8.57A12 12 0 0 0 12 0Z"
        />
    </svg>
);

export const LoginOptions: React.FC = () => {
    const { login } = useAuth();

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => login('google')}
                className="flex w-full cursor-pointer items-center justify-center gap-3 border border-[#8d9692] bg-white px-5 py-3.5 text-sm font-bold hover:border-[#00876c] hover:text-[#00735c]"
            >
                <GoogleMark />
                Continue with Google
            </button>
            <button
                type="button"
                onClick={() => login('github')}
                className="flex w-full cursor-pointer items-center justify-center gap-3 bg-[#202725] px-5 py-3.5 text-sm font-bold text-white hover:bg-black"
            >
                <GithubMark />
                Continue with GitHub
            </button>
        </div>
    );
};

export const LogIn: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) navigate('/app');
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (searchParams.get('error') === 'email_exists') {
            setErrorMessage('This email address is already associated with another sign-in method.');
            searchParams.delete('error');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    return (
        <main className="quak-landing min-h-screen bg-[#f7f6f2] text-[#17211f]">
            <div className="h-1.5 bg-[#00876c]" />
            <div className="mx-auto flex min-h-[calc(100vh-0.375rem)] max-w-[1180px] flex-col px-5 py-8 sm:px-8">
                <Link
                    to="/"
                    className="inline-flex w-fit items-center gap-2 text-sm text-[#59635f] hover:text-[#00735c]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    QuaK
                </Link>

                <section className="my-auto w-full max-w-md self-center border border-[#c9cfcc] bg-[#fbfbf9] p-7 sm:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#59635f]">Workspace access</p>
                    <h1 className="mt-3 text-3xl font-normal">Sign in to QuaK</h1>

                    {errorMessage && (
                        <div className="mt-5 border-l-4 border-[#a22223] bg-[#f5e8e8] px-4 py-3 text-sm text-[#791f20]">
                            {errorMessage}
                        </div>
                    )}

                    <div className="mt-7">
                        <LoginOptions />
                    </div>
                </section>
            </div>
        </main>
    );
};

export default LogIn;
