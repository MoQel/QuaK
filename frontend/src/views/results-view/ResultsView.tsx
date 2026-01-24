import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
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
        color: 'var(--special)',
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
    const computedMinWidth = Math.max(100, chartData.length * minBarWidth);
    const shouldScroll = chartData.length > 12;

    const basisLabel = numQubits > 1 ? `|q${numQubits - 1}...q0>` : numQubits === 1 ? '|q0>' : '';

    // Empty State
    if (!circuit || numQubits === 0) {
        return (
            <Card className="w-full h-full border-l rounded-none bg-muted/10">
                <CardHeader>
                    <CardTitle>Simulation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground text-sm italic">
                    <div className="bg-bg p-4 rounded-full mb-4 ring-1 ring-border">
                        <RefreshCcw className="w-8 h-8 text-text-muted/50" />
                    </div>
                    <p>Add qubits to the circuit to see results.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full border-l rounded-none flex flex-col">
            <CardHeader className="pb-2 border-b bg-card z-10 shrink-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg text-text">
                            Simulation Results
                            {isCalculating && (
                                <Badge
                                    variant="secondary"
                                    className="animate-pulse text-xs bg-bg-light text-text-muted"
                                >
                                    Calculating...
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-xs text-text-muted mt-1 font-mono">
                            Basis: Big Endian{' '}
                            <span className="bg-bg px-1.5 py-0.5 rounded text-text border border-border-muted">
                                {basisLabel}
                            </span>
                        </p>
                    </div>
                    <SimulationToolbar options={options} setOptions={setOptions} />
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative overflow-hidden flex flex-col min-h-0 bg-bg-dark">
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive bg-bg-dark/95 z-10 p-4 text-center">
                        <span className="font-bold mb-2">Simulation Error</span>
                        <span className="text-sm">{error}</span>
                    </div>
                ) : (
                    <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar">
                        <div
                            style={{
                                minWidth: shouldScroll ? `${computedMinWidth}px` : '100%',
                                width: '100%',
                                height: '100%',
                            }}
                            className="h-full p-4 pb-2"
                        >
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                    accessibilityLayer
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke="var(--border-muted)"
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="state"
                                        tickLine={false}
                                        axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{
                                            fontSize: 11,
                                            fontFamily: 'monospace',
                                            fill: 'var(--text-muted)',
                                        }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                        axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                                        tickLine={false}
                                        ticks={[0, 25, 50, 75, 100]}
                                        tickFormatter={(value) => `${value}%`}
                                        width={35}
                                    />

                                    <ChartTooltip
                                        cursor={{ fill: 'var(--bg-light-hover)', opacity: 0.3 }}
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
                                                fill={getBarColor(entry.phase)}
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
                    <div className="absolute inset-0 bg-bg-dark/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <Badge
                            variant="outline"
                            className="bg-bg-light shadow-lg px-4 py-2 animate-pulse text-text border-border"
                        >
                            Processing...
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
