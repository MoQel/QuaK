import { useMemo, useState } from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Microscope, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle.tsx';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { toLabeledDirac, type Layout } from '@quak/circuit-core/notation/dirac';

interface DiracInspectorViewProps {
    circuit: CircuitResponse | undefined;
}

const toDisplayMath = (latex: string): string => `\\[\n${latex}\n\\]`;

// Mirrors InspectorView's SafeBlockMath: KaTeX throws on malformed input, so isolate the failure.
function SafeBlockMath({ math }: Readonly<{ math: string }>) {
    try {
        return <BlockMath math={math} />;
    } catch (error) {
        console.error('LaTeX rendering error:', error);
        return <div className="text-destructive text-xs">Error rendering LaTeX: {math}</div>;
    }
}

/**
 * Read-only Dirac notation of a circuit, styled to sit inside the Inspector panel. This is the
 * Inspector's default view; it is replaced by a gate's details while a gate is inspected.
 */
export function DiracInspectorView({ circuit }: Readonly<DiracInspectorViewProps>) {
    const [layout, setLayout] = useState<Layout>('inline');
    const [copied, setCopied] = useState(false);

    const latex = useMemo(() => (circuit ? toLabeledDirac(circuit, layout) : ''), [circuit, layout]);

    if (!latex) {
        return (
            <Card className="w-full h-full border-none rounded-none bg-muted/10">
                <CardContent className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground text-sm italic">
                    <Microscope className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nothing to inspect.</p>
                </CardContent>
            </Card>
        );
    }

    const copyLatex = async () => {
        try {
            await navigator.clipboard.writeText(toDisplayMath(latex));
            setCopied(true);
            globalThis.setTimeout(() => setCopied(false), 2000);
            toast.success('LaTeX copied to clipboard');
        } catch (error) {
            console.error('Failed to copy LaTeX:', error);
            toast.error('Could not copy LaTeX');
        }
    };

    return (
        <Card className="w-full h-full border-none rounded-none flex flex-col overflow-hidden bg-card gap-0">
            <CardHeader className="bg-card z-10 shrink-0 p-0 px-6 py-0 cursor-default">
                <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base font-semibold leading-none">Dirac Notation</CardTitle>

                    <ToggleGroup
                        type="single"
                        value={layout}
                        onValueChange={(value) => value && setLayout(value as Layout)}
                        aria-label="Notation layout"
                    >
                        <ToggleGroupItem value="inline" className="h-7 px-2 text-xs">
                            Inline
                        </ToggleGroupItem>
                        <ToggleGroupItem value="layered" className="h-7 px-2 text-xs">
                            Layered
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <CardContent className="pt-6">
                    <div className="relative bg-muted/30 p-3 pr-12 rounded-md overflow-x-auto text-sm border border-border/50">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 z-10 h-8 w-8 text-muted-foreground"
                            onClick={copyLatex}
                            title="Copy LaTeX"
                            aria-label="Copy Dirac notation LaTeX"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>

                        <SafeBlockMath math={latex} />
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}
