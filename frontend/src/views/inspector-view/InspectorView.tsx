import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { memo } from 'react';
import { BlockMath, InlineMath } from 'react-katex'; // LaTex rendering
import 'katex/dist/katex.min.css'; // LaTex rendering
import { X, Microscope, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

interface InspectorViewProps {
    operationDefinition: OperationDefinitionResponse | undefined;
    onClear?: () => void;
}

// Safe LaTeX rendering components with error handling
function SafeBlockMath({ math }: Readonly<{ math: string }>) {
    try {
        return <BlockMath math={math} />;
    } catch (error) {
        console.error('LaTeX rendering error:', error);
        return <div className="text-destructive text-xs">Error rendering LaTeX: {math}</div>;
    }
}

function SafeInlineMath({ math }: Readonly<{ math: string }>) {
    try {
        return <InlineMath math={math} />;
    } catch (error) {
        console.error('LaTeX rendering error:', error);
        return <span className="text-destructive text-xs">Error: {math}</span>;
    }
}

function InspectorViewComponent({ operationDefinition, onClear }: Readonly<InspectorViewProps>) {
    // Case 1: nothing selected
    if (!operationDefinition) {
        return (
            <Card className="w-full h-full border-none rounded-none bg-muted/10">
                <CardContent className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground text-sm italic">
                    <Microscope className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a gate from the Library.</p>
                </CardContent>
            </Card>
        );
    }

    // Case 2: show details
    const info = operationDefinition.inspectorInfo;

    return (
        <Card className="w-full h-full border-none rounded-none flex flex-col overflow-hidden bg-card gap-0">
            <CardHeader className="bg-card z-10 shrink-0 p-0 px-6 border-b py-0 [.border-b]:pb-3 cursor-default">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Title and Symbol */}
                        <div className="flex items-center gap-2 shrink-0">
                            <CardTitle className="text-base font-semibold leading-none">
                                {operationDefinition.name}
                            </CardTitle>
                            <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-wider">
                                {operationDefinition.symbol}
                            </span>
                        </div>
                        {/* Inline Description */}
                        <div className="hidden sm:block h-4 w-px bg-border shrink-0" /> {/* Vertical divider */}
                        <p className="text-sm text-muted-foreground italic min-w-0 break-words">
                            {operationDefinition.description}
                        </p>
                    </div>

                    {/* Close Action */}
                    {onClear && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={onClear}
                            title="Clear inspector"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            {/* Scrollable Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <CardContent className="space-y-6 pt-6">
                    {/* Bra-Ket / Operator definition */}
                    {info?.operatorDefinition && (
                        <div>
                            <h4 className="font-semibold text-xs uppercase tracking-wider mb-2 text-muted-foreground">
                                Definition
                            </h4>
                            <div className="bg-muted/30 p-3 rounded-md overflow-x-auto text-sm border border-border/50">
                                <SafeBlockMath math={info.operatorDefinition} />
                            </div>
                        </div>
                    )}

                    {/* Matrix */}
                    {info?.matrix && (
                        <div>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Unitary Matrix ({info.matrix.rows}x{info.matrix.cols})
                                </h4>

                                {/* Info Tooltip - Multi-Qubit Gates (>= 4 lines) */}
                                {info.matrix.rows >= 4 && (
                                    <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                            <Info className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground cursor-help transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p className="text-xs">
                                                Convention: <strong>Big Endian</strong>
                                                <br />
                                                (Highest value qubit left/top)
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>

                            <div className="bg-muted/30 p-3 rounded-md overflow-x-auto text-sm border border-border/50">
                                <SafeBlockMath math={info.matrix.display} />
                            </div>
                        </div>
                    )}

                    {/* Truth table */}
                    {info?.truthTable && info.truthTable.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-xs uppercase tracking-wider mb-2 text-muted-foreground">
                                Truth Table
                            </h4>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
                                                Input
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                                Output
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {info.truthTable.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-3 py-2 font-mono text-xs">
                                                    <SafeInlineMath math={row.input} />
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-xs">
                                                    <SafeInlineMath math={row.output} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Parameters */}
                    {operationDefinition.parameters && operationDefinition.parameters.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-xs uppercase tracking-wider mb-2 text-muted-foreground">
                                Parameters
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {operationDefinition.parameters.map((param) => (
                                    <span
                                        key={param}
                                        className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono rounded border border-blue-500/20"
                                    >
                                        {param}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </div>
        </Card>
    );
}

export const InspectorView = memo(InspectorViewComponent);
