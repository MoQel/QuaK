import React from 'react';
import { ArrowUpRight, Braces } from 'lucide-react';
import { isKitHostname } from '@/lib/hostname';
import { GithubMark } from '@/components/brand/BrandMarks';
import { LandingExternalLink } from '@/components/landing/LandingExternalLink';
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

function FooterLink(props: Readonly<React.ComponentProps<typeof LandingExternalLink>>) {
    return <LandingExternalLink className="hover:text-landing-accent" {...props} />;
}

export const LandingPageAlternative: React.FC = () => {
    const showKitLegalLinks = isKitHostname(globalThis.location.hostname);

    return (
        <div className="quak-landing rounded-design landing-page min-h-screen bg-landing-canvas text-landing-ink">
            <header className="landing-header border border-landing-border bg-landing-surface">
                <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-5 py-6 sm:px-8">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-landing-accent text-landing-accent sm:row-span-2">
                            <Braces className="h-6 w-6" strokeWidth={1.7} />
                        </span>
                        <span className="block text-2xl font-bold tracking-[-0.02em]">QuaK</span>
                        <span className="landing-brand-subtitle col-span-2 text-landing-ink-muted sm:col-span-1">
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
                        <div className="landing-intro rounded-3xl border border-landing-border bg-landing-surface-tint px-7 py-12 sm:px-10 sm:py-16">
                            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.06] tracking-[-0.035em] text-landing-ink sm:text-6xl">
                                Build and simulate quantum circuits in your browser.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-landing-ink-secondary">
                                Write OpenQASM or Qrisp code, build circuits in the visual editor, and inspect
                                simulation results.
                            </p>
                        </div>

                        <aside className="landing-access flex flex-col justify-center rounded-3xl border border-landing-border bg-landing-surface px-5 py-10 sm:px-8 lg:py-16">
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
                                        className="landing-capability rounded-2xl border border-landing-border bg-landing-surface p-7 sm:p-8"
                                    >
                                        <h3 className="text-lg font-bold">{title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-landing-ink-muted">{text}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="workflow"
                    className="landing-workflow overflow-hidden rounded-3xl border border-landing-showcase-border bg-landing-showcase text-white"
                >
                    <div className="mx-auto grid max-w-[1180px] lg:grid-cols-[0.72fr_1.28fr]">
                        <div className="px-5 py-14 sm:px-8 lg:border-r lg:border-landing-showcase-border lg:py-16 lg:pr-12">
                            <h2 className="text-4xl font-normal leading-tight">A two-qubit example</h2>
                            <p className="mt-5 leading-7 text-landing-showcase-text">
                                A Hadamard gate followed by a controlled-X gate prepares a Bell state. Measuring both
                                qubits gives 00 or 11, each with a probability of 50% in an ideal simulation.
                            </p>
                        </div>
                        <div className="landing-example grid min-w-0 min-h-[24rem] grid-cols-[minmax(0,1.3fr)_2rem_minmax(0,1fr)] items-center px-5 py-10 sm:px-8">
                            <div className="min-w-0 overflow-hidden rounded-2xl border border-landing-code-border bg-landing-code-bg">
                                <div className="border-b border-landing-code-border px-4 py-3 font-mono text-xs text-landing-code-muted">
                                    bell.qasm
                                </div>
                                <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-landing-code-text">
                                    <code>
                                        <span className="text-landing-glow">OPENQASM</span> 3;{String.fromCodePoint(10)}
                                        <span className="text-landing-glow">include</span> "stdgates.inc";
                                        {String.fromCodePoint(10)}
                                        {String.fromCodePoint(10)}
                                        qubit[2] q;{String.fromCodePoint(10)}h q[0];{String.fromCodePoint(10)}
                                        cx q[0], q[1];
                                    </code>
                                </pre>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="h-px w-full bg-landing-glow" />
                                <ArrowUpRight className="h-5 w-5 rotate-45 text-landing-glow" />
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

                <section className="bg-landing-canvas py-16">
                    <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-3xl font-normal">QuaK is open source.</h2>
                            <p className="mt-3 text-landing-ink-secondary">
                                Read the code, report a bug, or contribute on GitHub.
                            </p>
                        </div>
                        <LandingExternalLink
                            href="https://github.com/MoQel/QuaK"
                            className="inline-flex items-center gap-3 self-start rounded-xl border border-landing-ink px-6 py-3 text-sm font-bold hover:bg-landing-ink hover:text-white md:self-auto"
                        >
                            <GithubMark className="h-4 w-4" />
                            View source on GitHub
                            <ArrowUpRight className="h-4 w-4" />
                        </LandingExternalLink>
                    </div>
                </section>
            </main>

            <footer className="border-t border-landing-border bg-landing-surface">
                <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-9 text-xs text-landing-ink-muted sm:px-8 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-6">
                        <FooterLink href="https://github.com/MoQel/QuaK">GitHub</FooterLink>
                        {showKitLegalLinks && (
                            <>
                                <FooterLink href="https://www.kit.edu/legals.php">Imprint</FooterLink>
                                <FooterLink href="https://www.kit.edu/privacypolicy.php">Data protection</FooterLink>
                            </>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPageAlternative;
