import React from 'react';
import { ArrowUpRight, BookOpen, Braces, CircuitBoard, Github, Play, SquareTerminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoginOptions } from './LogIn';
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

export const LandingPageAlternative: React.FC = () => {
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
                        <Link
                            to="/login"
                            className="border border-[#17211f] px-4 py-2 font-bold hover:bg-[#17211f] hover:text-white"
                        >
                            Sign in
                        </Link>
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

                        <aside className="flex flex-col justify-center bg-[#fbfbf9] px-5 py-10 sm:px-8 lg:py-16">
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#59635f]">
                                Workspace access
                            </p>
                            <h2 className="mt-3 text-3xl font-normal">Sign in to QuaK</h2>
                            <div className="mt-7">
                                <LoginOptions />
                            </div>
                            <Link to="/login" className="mt-5 text-center text-sm text-[#59635f] hover:text-[#00735c]">
                                Open the dedicated sign-in page
                            </Link>
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
