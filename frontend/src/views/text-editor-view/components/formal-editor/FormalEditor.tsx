import { useMemo, useState } from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Check, Copy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle.tsx';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { toLabeledDirac } from '@/notation/dirac/labeledMapper.ts';
import { toUnlabeledDirac } from '@/notation/dirac/unlabeledMapper.ts';
import { Layout } from '@/notation/dirac/layout.ts';

interface FormalEditorViewProps {
    circuit: CircuitResponse | undefined;
}

const toDisplayMath = (latex: string): string => `\\[\n${latex}\n\\]`;

export function FormalEditor({ circuit }: Readonly<FormalEditorViewProps>) {
    const [layout, setLayout] = useState<Layout>('inline');

    const labeled = useMemo(() => (circuit ? toLabeledDirac(circuit, layout) : ''), [circuit, layout]);
    const unlabeled = useMemo(() => (circuit ? toUnlabeledDirac(circuit, layout) : ''), [circuit, layout]);

    if (!labeled) {
        return (
            <Card className="h-full overflow-auto border-none rounded-none bg-bg-subtle p-0 gap-0">
                <CardContent className="flex h-full items-center justify-center p-6">
                    <CardDescription>No circuit to display</CardDescription>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full overflow-auto border-none rounded-none bg-bg-subtle p-0 gap-0">
            <CardContent className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <Badge variant="outline" className="pointer-events-none select-none">
                        <Lock />
                        Read-only
                    </Badge>

                    <ToggleGroup
                        type="single"
                        value={layout}
                        onValueChange={(value) => {
                            if (value) setLayout(value as Layout);
                        }}
                        aria-label="Notation layout"
                    >
                        <ToggleGroupItem value="inline">Inline</ToggleGroupItem>
                        <ToggleGroupItem value="layered">Layered</ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <NotationBlock title="Labeled Dirac Notation" latex={labeled} />
                <NotationBlock title="Unlabeled Dirac Notation" latex={unlabeled} />
            </CardContent>
        </Card>
    );
}

function NotationBlock({ title, latex }: Readonly<{ title: string; latex: string }>) {
    const [copied, setCopied] = useState(false);

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
        <section className="flex flex-col gap-2">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>

            <Card className="relative border-border rounded-md bg-bg-dark p-0 gap-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyLatex}
                    aria-label={`Copy ${title} LaTeX`}
                    className="absolute right-2 top-2 z-10"
                >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>

                <CardContent className="max-h-[45vh] overflow-auto p-4 pr-12">
                    <div className="min-w-[18rem] [&_.katex-display]:my-0">
                        <BlockMath math={latex} />
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
