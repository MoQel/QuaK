import React, { useEffect, useState } from 'react';
import { ArrowRight, CircuitBoard, Code2, Github, Play, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const sections = [
    {
        number: '01',
        icon: Code2,
        title: 'Write quantum programs',
        description:
            'Create and edit OpenQASM and Qrisp files with syntax highlighting, diagnostics, and language-server support.',
    },
    {
        number: '02',
        icon: CircuitBoard,
        title: 'Design circuits visually',
        description:
            'Build quantum circuits in a graphical editor and keep visual and textual representations in one project.',
    },
    {
        number: '03',
        icon: Play,
        title: 'Simulate and evaluate',
        description:
            'Run quantum circuits in the browser and inspect measurement results directly in the integrated workspace.',
    },
];

const GithubMark = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path
            fill="currentColor"
            d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.8c1.02 0 2.05.14 3 .4 2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.3c0 .32.19.69.8.57A12 12 0 0 0 12 0Z"
        />
    </svg>
);

export const LandingPage: React.FC = () => {
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
        <div
            className="min-h-screen bg-white text-[#202020]"
            style={{ fontFamily: 'Roboto, Arial, Helvetica, sans-serif' }}
        >
            <div className="border-b border-black/10 bg-[#f2f2f2]">
                <div className="mx-auto flex max-w-7xl items-center justify-end gap-5 px-5 py-2 text-xs text-[#505050] sm:px-8">
                    <a
                        href="https://github.com/MoQel/QuaK"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#00876C]"
                    >
                        GitHub
                    </a>
                    <a
                        href="https://www.kit.edu/legals.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#00876C]"
                    >
                        Imprint
                    </a>
                    <a
                        href="https://www.kit.edu/privacypolicy.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#00876C]"
                    >
                        Data protection
                    </a>
                </div>
            </div>

            <header className="bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-7 sm:px-8">
                    <a href="#top" className="flex items-center gap-4" aria-label="QuaK home">
                        <span className="grid h-12 w-12 place-items-center bg-[#00876C] text-white">
                            <CircuitBoard className="h-7 w-7" strokeWidth={1.7} />
                        </span>
                        <span>
                            <span className="block text-3xl font-bold leading-none tracking-tight">QuaK</span>
                            <span className="mt-1 block text-sm text-[#555]">Quantum Computing Platform</span>
                        </span>
                    </a>
                    <a
                        href="#sign-in"
                        className="hidden border border-[#00876C] px-5 py-2.5 text-sm font-bold text-[#006f59] hover:bg-[#00876C] hover:text-white sm:inline-flex"
                    >
                        Sign in
                    </a>
                </div>
                <nav className="border-t border-white/20 bg-[#404040]">
                    <div className="mx-auto flex max-w-7xl px-5 sm:px-8">
                        <a href="#top" className="border-b-4 border-[#00876C] px-4 py-4 text-sm font-bold text-white">
                            Overview
                        </a>
                        <a href="#features" className="px-4 py-4 text-sm text-white hover:bg-[#303030]">
                            Features
                        </a>
                        <a href="#sign-in" className="px-4 py-4 text-sm text-white hover:bg-[#303030]">
                            Access QuaK
                        </a>
                    </div>
                </nav>
            </header>

            <main id="top">
                <section className="border-b border-[#d4d4d4] bg-[#f5f5f5]">
                    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:py-20">
                        <div className="max-w-3xl">
                            <p className="mb-5 border-l-4 border-[#00876C] pl-4 text-sm font-bold uppercase tracking-[0.08em] text-[#555]">
                                Web-based quantum development environment
                            </p>
                            <h1 className="text-4xl font-bold leading-tight text-[#202020] sm:text-5xl">
                                Develop, visualize, and simulate quantum circuits in one place.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#505050]">
                                QuaK is an integrated development environment for quantum computing. It combines a
                                source-code editor, graphical circuit design, project management, and simulation in a
                                single browser-based application.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a
                                    href="#sign-in"
                                    className="inline-flex items-center gap-3 bg-[#00876C] px-6 py-3 font-bold text-white hover:bg-[#006f59]"
                                >
                                    Open QuaK
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                                <a
                                    href="https://github.com/MoQel/QuaK"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 border border-[#777] bg-white px-6 py-3 font-bold text-[#333] hover:border-[#00876C] hover:text-[#006f59]"
                                >
                                    <Github className="h-4 w-4" />
                                    Source code
                                </a>
                            </div>
                        </div>

                        <aside className="border-t-4 border-[#4664AA] bg-white p-7">
                            <h2 className="text-lg font-bold">Project information</h2>
                            <dl className="mt-5 divide-y divide-[#ddd] text-sm">
                                <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                                    <dt className="font-bold text-[#555]">Application</dt>
                                    <dd>Web-based IDE</dd>
                                </div>
                                <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                                    <dt className="font-bold text-[#555]">Languages</dt>
                                    <dd>OpenQASM, Qrisp</dd>
                                </div>
                                <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                                    <dt className="font-bold text-[#555]">Access</dt>
                                    <dd>Google or GitHub account</dd>
                                </div>
                                <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                                    <dt className="font-bold text-[#555]">License</dt>
                                    <dd>Open source</dd>
                                </div>
                            </dl>
                        </aside>
                    </div>
                </section>

                <section id="features" className="py-16">
                    <div className="mx-auto max-w-7xl px-5 sm:px-8">
                        <div className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr]">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#00876C]">
                                    Capabilities
                                </p>
                                <h2 className="mt-2 text-3xl font-bold">A connected workflow</h2>
                                <p className="mt-5 leading-7 text-[#555]">
                                    The individual tools are organized around a common project, reducing context
                                    switches throughout the development process.
                                </p>
                            </div>
                            <div className="border-t border-[#bbb]">
                                {sections.map(({ number, icon: Icon, title, description }) => (
                                    <article
                                        key={title}
                                        className="grid gap-5 border-b border-[#bbb] py-7 sm:grid-cols-[4rem_3rem_1fr]"
                                    >
                                        <span className="text-sm font-bold text-[#00876C]">{number}</span>
                                        <Icon className="h-7 w-7 text-[#4664AA]" strokeWidth={1.6} />
                                        <div>
                                            <h3 className="text-xl font-bold">{title}</h3>
                                            <p className="mt-2 max-w-2xl leading-7 text-[#555]">{description}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-[#bbb] bg-[#eeeeee] py-16">
                    <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-2">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#00876C]">Example</p>
                            <h2 className="mt-2 text-3xl font-bold">A Bell-state circuit in OpenQASM</h2>
                            <p className="mt-5 max-w-xl leading-7 text-[#555]">
                                QuaK supports text-based and graphical work. Code and circuits remain accessible within
                                the same project workspace.
                            </p>
                        </div>
                        <div className="border border-[#aaa] bg-[#252525]">
                            <div className="border-b border-[#555] bg-[#353535] px-5 py-3 font-mono text-xs text-[#ddd]">
                                bell.qasm
                            </div>
                            <pre className="overflow-x-auto p-6 font-mono text-sm leading-7 text-[#e5e5e5]">
                                <code>
                                    <span className="text-[#76cbb9]">OPENQASM</span> 3;{String.fromCharCode(10)}
                                    <span className="text-[#9db3e8]">include</span> "stdgates.inc";
                                    {String.fromCharCode(10)}
                                    {String.fromCharCode(10)}
                                    <span className="text-[#76cbb9]">qubit</span>[2] q;
                                    {String.fromCharCode(10)}
                                    <span className="text-[#9db3e8]">h</span> q[0];
                                    {String.fromCharCode(10)}
                                    <span className="text-[#9db3e8]">cx</span> q[0], q[1];
                                </code>
                            </pre>
                        </div>
                    </div>
                </section>

                <section id="sign-in" className="py-16">
                    <div className="mx-auto max-w-3xl px-5 sm:px-8">
                        <div className="border border-[#aaa]">
                            <div className="border-b border-[#aaa] bg-[#404040] px-7 py-5 text-white">
                                <h2 className="text-2xl font-bold">Access the QuaK workspace</h2>
                            </div>
                            <div className="p-7 sm:p-9">
                                <p className="leading-7 text-[#555]">
                                    Sign in with an existing Google or GitHub account. No separate QuaK password is
                                    required.
                                </p>
                                {errorMessage && (
                                    <div className="mt-5 border-l-4 border-[#a22223] bg-[#f4e7e7] px-4 py-3 text-sm text-[#721b1c]">
                                        {errorMessage}
                                    </div>
                                )}
                                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                    <button
                                        onClick={() => login('google')}
                                        className="flex cursor-pointer items-center justify-center gap-3 border border-[#777] bg-white px-5 py-3 font-bold hover:border-[#00876C] hover:text-[#006f59]"
                                    >
                                        <span className="text-lg font-bold text-[#4664AA]">G</span>
                                        Continue with Google
                                    </button>
                                    <button
                                        onClick={() => login('github')}
                                        className="flex cursor-pointer items-center justify-center gap-3 bg-[#252525] px-5 py-3 font-bold text-white hover:bg-black"
                                    >
                                        <GithubMark />
                                        Continue with GitHub
                                    </button>
                                </div>
                                <p className="mt-5 flex items-center gap-2 text-xs text-[#666]">
                                    <ShieldCheck className="h-4 w-4 text-[#00876C]" />
                                    Authentication is handled securely through OAuth 2.0.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t-8 border-[#00876C] bg-[#353535] text-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-2">
                    <div>
                        <p className="text-xl font-bold">QuaK</p>
                        <p className="mt-2 text-sm text-[#d0d0d0]">
                            A web-based development environment for quantum computing.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm md:justify-end">
                        <a
                            href="https://github.com/MoQel/QuaK"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#76cbb9]"
                        >
                            GitHub
                        </a>
                        <a
                            href="https://www.kit.edu/legals.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#76cbb9]"
                        >
                            Imprint
                        </a>
                        <a
                            href="https://www.kit.edu/privacypolicy.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#76cbb9]"
                        >
                            Data protection
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
