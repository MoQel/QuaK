import React from 'react';
import { ArrowUpRight, Braces, Github } from 'lucide-react';
import { LoginOptions } from './LogIn';
import './LandingPageAlternative.css';

const capabilities = [
    {
        title: 'Code editor',
        text: 'Edit OpenQASM and Qrisp files with code completion and error diagnostics.',
    },
    {
        title: 'Circuit editor',
        text: 'Add gates to qubit registers and inspect how your circuit is arranged.',
    },
    {
        title: 'Simulation results',
        text: 'Run circuits in your browser and inspect the state vector and measurement probabilities.',
    },
    {
        title: 'Projects',
        text: 'Keep your source files and circuits together in named projects.',
    },
];

export const LandingPageAlternative: React.FC = () => {
    return (
        <div className="quak-landing rounded-design landing-page min-h-screen bg-[#f5f7f6] text-[#17211f]">
            <header className="landing-header border border-[#d5e0db] bg-[#ffffff]">
                <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-5 py-6 sm:px-8">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#00876c] text-[#00876c] sm:row-span-2">
                            <Braces className="h-6 w-6" strokeWidth={1.7} />
                        </span>
                        <span className="block text-2xl font-bold tracking-[-0.02em]">QuaK</span>
                        <span className="landing-brand-subtitle col-span-2 text-[#59635f] sm:col-span-1">
                            Quantum coding, simplified
                        </span>
                    </div>
                    <img
                        src="/kit-logo.svg"
                        alt="KIT - Karlsruher Institut für Technologie"
                        width={196.18}
                        height={90.32}
                        className="h-auto w-36 shrink-0"
                    />
                </div>
            </header>

            <main id="top">
                <section className="landing-hero">
                    <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[1fr_23rem]">
                        <div className="landing-intro rounded-3xl border border-[#d5e0db] bg-[#e9f5f1] px-7 py-12 sm:px-10 sm:py-16">
                            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.06] tracking-[-0.035em] text-[#17211f] sm:text-6xl">
                                Build and simulate quantum circuits in your browser.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#495450]">
                                Write OpenQASM or Qrisp code, build circuits in the visual editor, and inspect
                                simulation results.
                            </p>
                        </div>

                        <aside className="landing-access flex flex-col justify-center rounded-3xl border border-[#d5e0db] bg-[#ffffff] px-5 py-10 sm:px-8 lg:py-16">
                            <h2 className="text-3xl font-normal">Sign in to QuaK</h2>
                            <div className="mt-7">
                                <LoginOptions />
                            </div>
                        </aside>
                    </div>
                </section>

                <section id="platform" className="py-16 sm:py-20">
                    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
                        <div className="grid gap-12 lg:grid-cols-[18rem_1fr]">
                            <div>
                                <h2 className="text-4xl font-normal leading-tight">Working with QuaK</h2>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {capabilities.map(({ title, text }) => (
                                    <article
                                        key={title}
                                        className="landing-capability rounded-2xl border border-[#d5e0db] bg-white p-7 sm:p-8"
                                    >
                                        <h3 className="text-lg font-bold">{title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-[#59635f]">{text}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="workflow"
                    className="landing-workflow overflow-hidden rounded-3xl border border-[#315368] bg-[#002d4c] text-white"
                >
                    <div className="mx-auto grid max-w-[1180px] lg:grid-cols-[0.72fr_1.28fr]">
                        <div className="px-5 py-14 sm:px-8 lg:border-r lg:border-[#315368] lg:py-16 lg:pr-12">
                            <h2 className="text-4xl font-normal leading-tight">A two-qubit example</h2>
                            <p className="mt-5 leading-7 text-[#c3d6d5]">
                                A Hadamard gate followed by a controlled-X gate prepares a Bell state. Measuring both
                                qubits gives 00 or 11, each with a probability of 50% in an ideal simulation.
                            </p>
                        </div>
                        <div className="landing-example grid min-w-0 min-h-[24rem] grid-cols-[minmax(0,1.3fr)_2rem_minmax(0,1fr)] items-center px-5 py-10 sm:px-8">
                            <div className="min-w-0 overflow-hidden rounded-2xl border border-[#496775] bg-[#242629]">
                                <div className="border-b border-[#496775] px-4 py-3 font-mono text-xs text-[#b8ccc8]">
                                    bell.qasm
                                </div>
                                <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-[#edf7f4]">
                                    <code>
                                        <span className="text-[#b7fff5]">OPENQASM</span> 3;{String.fromCharCode(10)}
                                        <span className="text-[#b7fff5]">include</span> "stdgates.inc";
                                        {String.fromCharCode(10)}
                                        {String.fromCharCode(10)}
                                        qubit[2] q;{String.fromCharCode(10)}h q[0];{String.fromCharCode(10)}
                                        cx q[0], q[1];
                                    </code>
                                </pre>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="h-px w-full bg-[#b7fff5]" />
                                <ArrowUpRight className="h-5 w-5 rotate-45 text-[#b7fff5]" />
                            </div>
                            <div
                                className="landing-circuit"
                                role="img"
                                aria-label="Bell-state circuit: a Hadamard gate on qubit zero, followed by a controlled-X gate from qubit zero to qubit one."
                            >
                                <div className="landing-circuit-row" aria-hidden="true">
                                    <span className="landing-qubit">q₀</span>
                                    <span className="landing-wire landing-gate-column">
                                        <span className="landing-hadamard">H</span>
                                    </span>
                                    <span className="landing-wire" />
                                    <span className="landing-wire landing-control-column">
                                        <span className="landing-control" />
                                    </span>
                                </div>
                                <div className="landing-circuit-row" aria-hidden="true">
                                    <span className="landing-qubit">q₁</span>
                                    <span className="landing-wire landing-gate-column" />
                                    <span className="landing-wire" />
                                    <span className="landing-wire landing-target-column">
                                        <span className="landing-target">+</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#f5f7f6] py-16">
                    <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-3xl font-normal">QuaK is open source.</h2>
                            <p className="mt-3 text-[#495450]">Read the code, report a bug, or contribute on GitHub.</p>
                        </div>
                        <a
                            href="https://github.com/MoQel/QuaK"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 self-start rounded-xl border border-[#17211f] px-6 py-3 text-sm font-bold hover:bg-[#17211f] hover:text-white md:self-auto"
                        >
                            <Github className="h-4 w-4" />
                            View source on GitHub
                            <ArrowUpRight className="h-4 w-4" />
                        </a>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#d5e0db] bg-[#ffffff]">
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
