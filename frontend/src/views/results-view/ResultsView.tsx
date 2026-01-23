import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimulationToolbar } from '@/views/results-view/SimulationToolbar.tsx';
import { CustomTooltipContent } from '@/views/results-view/CustomTooltipContent.tsx';
import { CircuitResponse } from '@/api/dto/circuit';
import { useQuantumSimulation } from '@/hooks/useQuantumSimulation.ts';
import { SimulationOptions } from '@/simulation/simulation.types.ts';
import { useChartData } from '@/hooks/useChartData.ts';
import { getBarColor } from '@/views/results-view/util/quantum-utils.ts';

const chartConfig = {
    prob: {
        label: 'Probability',
        color: 'hsl(var(--chart-1))',
    },
} satisfies ChartConfig;

interface ResultsViewProps {
    circuit: CircuitResponse | null;
}

export function ResultsView({ circuit }: ResultsViewProps) {
    const [options, setOptions] = useState<SimulationOptions>({
        mode: 'exact',
        sampleCount: 1024,
        maxQubits: 8,
    });

    const { result, isCalculating, error } = useQuantumSimulation(circuit, options);

    const numQubits = useMemo(
        () => circuit?.registers.flatMap((r) => r.qubits).length || 0,
        [circuit],
    );

    const chartData = useChartData(result, options, numQubits);

    // Dynamic Width Calculation for Scrolling
    const minBarWidth = 40;
    const computedWidth = Math.max(100, chartData.length * minBarWidth);
    const shouldScroll = chartData.length > 12;

    const basisLabel = numQubits > 1 ? `|q${numQubits - 1}...q0>` : numQubits === 1 ? '|q0>' : '';

    // Empty State
    if (!circuit || numQubits === 0) {
        return (
            <Card className="w-full h-full flex flex-col justify-center items-center text-muted-foreground p-8 border-dashed">
                <div className="bg-muted p-4 rounded-full mb-4 ring-1 ring-border">
                    <RefreshCcw className="w-8 h-8 opacity-50" />
                </div>
                <p>Add qubits to the circuit to see results.</p>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full flex flex-col overflow-hidden border-none shadow-none sm:border sm:shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 shrink-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            Simulation Results
                            {isCalculating && (
                                <Badge variant="secondary" className="animate-pulse text-xs">
                                    Calculating...
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                            Basis: Big Endian{' '}
                            <span className="bg-muted px-1.5 py-0.5 rounded text-foreground border border-border/50">
                                {basisLabel}
                            </span>
                        </p>
                    </div>
                    <SimulationToolbar options={options} setOptions={setOptions} />
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative overflow-hidden flex flex-col min-h-0">
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive bg-background/95 z-10 p-4 text-center">
                        <span className="font-bold mb-2">Simulation Error</span>
                        <span className="text-sm">{error}</span>
                    </div>
                ) : (
                    <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar">
                        {/* Wrapper div bestimmt die Breite (Scroll vs Full) */}
                        <div
                            style={{ width: shouldScroll ? `${computedWidth}px` : '100%' }}
                            className="h-full p-4 pb-2"
                        >
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 0, left: 0, bottom: 40 }}
                                    accessibilityLayer
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))" // Theme variable
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="state"
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        // Wir entfernen manuelle Farben hier, ChartContainer macht das via CSS
                                        tick={{ fontSize: 11, fontFamily: 'monospace' }}
                                    />

                                    {/* Shadcn Tooltip Component + Custom Content */}
                                    <ChartTooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                        content={
                                            <CustomTooltipContent
                                                sampleCount={options.sampleCount}
                                            />
                                        }
                                    />

                                    <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                // Nutzt Theme Farbe für Sim, Color Wheel für Exact
                                                fill={getBarColor(entry.phase)}
                                                // Border nur im Dark Mode subtil sichtbar machen oder weglassen
                                                strokeWidth={0}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </div>
                )}

                {/* Loading State Overlay */}
                {isCalculating && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <Badge
                            variant="outline"
                            className="bg-background shadow-lg px-4 py-2 animate-pulse"
                        >
                            Processing...
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
