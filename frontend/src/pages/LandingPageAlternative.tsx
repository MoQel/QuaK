import React, { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, Braces, CircuitBoard, Github, Play, SquareTerminal } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './LandingPageAlternative.css';

const capabilities = [
    {
        icon: SquareTerminal,
        title: 'Language-aware editing',
        text: 'Work with OpenQASM and Qrisp using diagnostics, completion, and language-server integration.',
    },
    {
        icon: CircuitBoard,
        title: 'Circuit construction',
        text: 'Translate quantum ideas into visual circuits and inspect operations across registers and layers.',
    },
    {
        icon: Play,
        title: 'Integrated simulation',
        text: 'Execute circuits in the browser and evaluate measurement distributions without leaving the project.',
    },
    {
        icon: BookOpen,
        title: 'Project workspace',
        text: 'Organize source files, circuits, and results in a shared environment built for iterative work.',
    },
];

const GithubMark = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
            fill="currentColor"
            d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.8c1.02 0 2.05.14 3 .4 2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.3c0 .32.19.69.8.57A12 12 0 0 0 12 0Z"
        />
    </svg>
);

export const LandingPageAlternative: React.FC = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) navigate('/');
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (searchParams.get('error') === 'email_exists') {
            setErrorMessage('An account with this email address already exists using a different sign-in method.');
            searchParams.delete('error');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    return (
        <div className="quak-landing min-h-screen bg-[#f7f6f2] text-[#17211f]">
            <div className="h-1.5 bg-[#00876c]" />

            <header className="border-b border-[#c9cfcc] bg-[#fbfbf9]">
                <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-6 sm:px-8">
                    <a href="#top" className="flex items-center gap-4" aria-label="QuaK home">
                        <span className="flex h-11 w-11 items-center justify-center border-2 border-[#00876c] text-[#00876c]">
                            <Braces className="h-6 w-6" strokeWidth={1.7} />
                        </span>
                        <span>
                            <span className="block text-2xl font-bold tracking-[-0.02em]">QuaK</span>
                            <span className="block text-xs uppercase tracking-[0.15em] text-[#59635f]">
                                Quantum Computing Platform
                            </span>
                        </span>
                    </a>
                    <nav className="hidden items-center gap-8 text-sm md:flex">
                        <a href="#platform" className="border-b border-transparent py-2 hover:border-[#00876c]">
                            Platform
                        </a>
                        <a href="#workflow" className="border-b border-transparent py-2 hover:border-[#00876c]">
                            Workflow
                        </a>
                        <a
                            href="https://github.com/MoQel/QuaK"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 border-b border-transparent py-2 hover:border-[#00876c]"
                        >
                            GitHub <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                    </nav>
                </div>
            </header>

            <main id="top">
                <section className="border-b border-[#c9cfcc] bg-[#e9efec]">
                    <div className="mx-auto grid max-w-[1180px] lg:grid-cols-[1fr_23rem]">
                        <div className="px-5 py-16 sm:px-8 sm:py-20 lg:border-r lg:border-[#c9cfcc] lg:pr-16">
                            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.17em] text-[#00735c]">
                                <span className="h-px w-10 bg-[#00876c]" />
                                Integrated quantum software development
                            </p>
                            <h1 className="max-w-3xl text-5xl font-normal leading-[1.06] tracking-[-0.035em] text-[#17211f] sm:text-6xl">
                                A practical workspace for quantum software engineering.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#495450]">
                                QuaK connects source-code editing, visual circuit construction, simulation, and result
                                analysis in one coherent project environment.
                            </p>
                            <div className="mt-9 flex flex-wrap items-center gap-5 text-sm">
                                <a
                                    href="#platform"
                                    className="inline-flex items-center gap-2 font-bold text-[#00735c] hover:underline"
                                >
                                    Explore the platform
                                    <ArrowUpRight className="h-4 w-4" />
                                </a>
                                <span className="hidden h-4 w-px bg-[#a9b3af] sm:block" />
                                <span className="text-[#59635f]">OpenQASM · Qrisp · Qulacs</span>
                            </div>
                        </div>

                        <aside
                            id="sign-in"
                            className="flex flex-col justify-center bg-[#fbfbf9] px-5 py-10 sm:px-8 lg:py-16"
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#59635f]">
                                Workspace access
                            </p>
                            <h2 className="mt-3 text-3xl font-normal">Sign in to QuaK</h2>
                            {errorMessage && (
                                <div className="mt-5 border-l-4 border-[#a22223] bg-[#f5e8e8] px-4 py-3 text-sm text-[#791f20]">
                                    {errorMessage}
                                </div>
                            )}
                            <div className="mt-7 space-y-3">
                                <button
                                    onClick={() => login('google')}
                                    className="flex w-full cursor-pointer items-center justify-center gap-3 border border-[#8d9692] bg-white px-5 py-3.5 text-sm font-bold hover:border-[#00876c] hover:text-[#00735c]"
                                >
                                    <span className="text-base font-bold text-[#4664aa]">G</span>
                                    Continue with Google
                                </button>
                                <button
                                    onClick={() => login('github')}
                                    className="flex w-full cursor-pointer items-center justify-center gap-3 bg-[#202725] px-5 py-3.5 text-sm font-bold text-white hover:bg-black"
                                >
                                    <GithubMark />
                                    Continue with GitHub
                                </button>
                            </div>
                        </aside>
                    </div>
                </section>

                <section id="platform" className="bg-[#fbfbf9] py-16 sm:py-20">
                    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
                        <div className="grid gap-12 lg:grid-cols-[18rem_1fr]">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#00876c]">Platform</p>
                                <h2 className="mt-4 text-4xl font-normal leading-tight">
                                    One project,
                                    <br />
                                    four perspectives.
                                </h2>
                            </div>
                            <div className="grid border-l border-t border-[#bfc6c3] sm:grid-cols-2">
                                {capabilities.map(({ icon: Icon, title, text }) => (
                                    <article key={title} className="border-b border-r border-[#bfc6c3] p-7 sm:p-8">
                                        <Icon className="h-6 w-6 text-[#00876c]" strokeWidth={1.5} />
                                        <h3 className="mt-6 text-lg font-bold">{title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-[#59635f]">{text}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="workflow" className="border-y border-[#c9cfcc] bg-[#1e2926] text-white">
                    <div className="mx-auto grid max-w-[1180px] lg:grid-cols-[0.72fr_1.28fr]">
                        <div className="px-5 py-14 sm:px-8 lg:border-r lg:border-[#43504c] lg:py-16 lg:pr-12">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#73c7b5]">
                                Example workflow
                            </p>
                            <h2 className="mt-4 text-4xl font-normal leading-tight">
                                From program text to measurable output.
                            </h2>
                            <p className="mt-5 leading-7 text-[#bdc8c4]">
                                Edit a source file, inspect the corresponding circuit, execute the simulation, and
                                compare the resulting state distribution.
                            </p>
                        </div>
                        <div className="grid min-h-[24rem] grid-cols-[1fr_5rem_1fr] items-center px-5 py-10 sm:px-8">
                            <div className="border border-[#596762] bg-[#17201e]">
                                <div className="border-b border-[#596762] px-4 py-3 font-mono text-xs text-[#9eaaa6]">
                                    bell.qasm
                                </div>
                                <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-[#e7ecea]">
                                    <code>
                                        <span className="text-[#73c7b5]">OPENQASM</span> 3;{String.fromCharCode(10)}
                                        <span className="text-[#9eb4e8]">include</span> "stdgates.inc";
                                        {String.fromCharCode(10)}
                                        {String.fromCharCode(10)}
                                        qubit[2] q;{String.fromCharCode(10)}h q[0];{String.fromCharCode(10)}
                                        cx q[0], q[1];
                                    </code>
                                </pre>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="h-px w-full bg-[#73c7b5]" />
                                <ArrowUpRight className="h-5 w-5 rotate-45 text-[#73c7b5]" />
                            </div>
                            <div className="space-y-10">
                                <div className="flex items-center">
                                    <span className="mr-3 font-mono text-xs text-[#9eaaa6]">q₀</span>
                                    <span className="grid h-10 w-10 place-items-center border border-[#73c7b5] font-bold text-[#73c7b5]">
                                        H
                                    </span>
                                    <span className="h-px flex-1 bg-[#6d7a76]" />
                                    <span className="h-3 w-3 bg-[#73c7b5]" />
                                </div>
                                <div className="flex items-center">
                                    <span className="mr-3 font-mono text-xs text-[#9eaaa6]">q₁</span>
                                    <span className="h-px w-10 bg-[#6d7a76]" />
                                    <span className="h-px flex-1 bg-[#6d7a76]" />
                                    <span className="grid h-10 w-10 place-items-center rounded-full border border-[#73c7b5] text-xl text-[#73c7b5]">
                                        +
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#f7f6f2] py-16">
                    <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-center">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#00876c]">Open source</p>
                            <h2 className="mt-3 text-3xl font-normal">Review, use, and contribute to QuaK.</h2>
                        </div>
                        <a
                            href="https://github.com/MoQel/QuaK"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 self-start border border-[#17211f] px-6 py-3 text-sm font-bold hover:bg-[#17211f] hover:text-white md:self-auto"
                        >
                            <Github className="h-4 w-4" />
                            View repository
                            <ArrowUpRight className="h-4 w-4" />
                        </a>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#aeb7b3] bg-[#fbfbf9]">
                <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-9 text-xs text-[#59635f] sm:px-8 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-6">
                        <a
                            href="https://github.com/MoQel/QuaK"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#00876c]"
                        >
                            GitHub
                        </a>
                        <a
                            href="https://www.kit.edu/legals.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#00876c]"
                        >
                            Imprint
                        </a>
                        <a
                            href="https://www.kit.edu/privacypolicy.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#00876c]"
                        >
                            Data protection
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPageAlternative;
