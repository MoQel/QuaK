import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { RefreshCcw, FilterX, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimulationToolbar } from '@/views/results-view/SimulationToolbar.tsx';
import { CustomTooltipContent } from '@/views/results-view/CustomTooltipContent.tsx';
import { getCircuitWidth } from '@/api/dto/circuit';
import { useQuantumSimulation } from '@/hooks/results/useQuantumSimulation.ts';
import { SimulationOptions } from '@/simulation/simulation.types.ts';
import { Endianness, useChartData } from '@/hooks/results/useChartData.ts';
import { getBarColor } from '@/views/results-view/util/quantum-utils.ts';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle';

const chartConfig = {
    prob: {
        label: 'Probability',
        color: 'var(--special)',
    },
} satisfies ChartConfig;

import { useProject } from '@/contexts/ProjectContext';

export function ResultsView() {
    const { circuit } = useProject();
    const [options, setOptions] = useState<SimulationOptions>({
        mode: 'exact',
        sampleCount: 1024,
        maxCircuitWidth: 12,
    });
    const [endianness, setEndianness] = useState<Endianness>('big');

    const { result, isCalculating, error } = useQuantumSimulation(circuit, options);

    const circuitWidth = useMemo(() => {
        if (!circuit) return 0;
        return getCircuitWidth(circuit);
    }, [circuit]);

    const simulatedCircuitWidth = useMemo(() => {
        if (result?.simulatedQubits) {
            return result.simulatedQubits;
        }

        return circuitWidth;
    }, [result, circuitWidth]);

    const chartData = useChartData(result, options, simulatedCircuitWidth, endianness);

    const registerNames = useMemo(() => {
        return new Map(circuit?.registers.map((reg) => [reg.id, reg.name]) ?? []);
    }, [circuit?.registers]);

    const measurementRows = useMemo(() => {
        return result?.measurementResults ?? [];
    }, [result?.measurementResults]);

    const formatSelector = (registerId: string, index: number) => {
        return `${registerNames.get(registerId) ?? registerId}[${index}]`;
    };

    const [showZero, setShowZero] = useState(false);
    const [minProbability, setMinProbability] = useState(0.1); //standard is 0,1%

    const visibleData = useMemo(() => {
        if (showZero) return chartData;
        return chartData.filter((d) => d.prob >= minProbability);
    }, [chartData, showZero, minProbability]);

    const isFilteredOut = chartData.length > 0 && visibleData.length === 0;

    // Dynamic Width Calculation for Scrolling
    const minBarWidth = 40;
    const computedMinWidth = Math.max(100, visibleData.length * minBarWidth);
    const shouldScroll = visibleData.length > 12;

    const basisLabel = useMemo(() => {
        if (simulatedCircuitWidth === 0) return '';
        if (simulatedCircuitWidth === 1) return '|q0>';

        return endianness === 'big' ? `|q0...q${simulatedCircuitWidth - 1}>` : `|q${simulatedCircuitWidth - 1}...q0>`;
    }, [simulatedCircuitWidth, endianness]);

    // Empty State
    if (!circuit || (simulatedCircuitWidth === 0 && !isCalculating)) {
        return (
            <Card className="w-full h-full border-l rounded-none bg-muted/10">
                <CardHeader>
                    <CardTitle>Simulation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground text-sm italic">
                    <RefreshCcw className="w-12 h-12 mb-4 opacity-20" />
                    <p>Add qubits to the circuit to see results.</p>
                </CardContent>
            </Card>
        );
    }

    const isCircuitTooLarge = circuitWidth > (options.maxCircuitWidth ?? 12);

    const renderChartArea = () => {
        if (isCircuitTooLarge) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center h-[50vh] text-muted-foreground text-sm italic">
                    <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                    <h3 className="font-semibold text-text mb-2 text-lg">Circuit Too Large</h3>
                    <p className="text-sm text-text-muted max-w-[320px] mb-6">
                        This circuit requires <strong>{circuitWidth} qubits</strong>, but your simulation limit is set
                        to {options.maxCircuitWidth}.
                    </p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="default"
                                className="bg-special hover:bg-special-hover text-white shadow-md"
                            >
                                Increase limit to {circuitWidth}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-warning">
                                    <AlertTriangle className="w-5 h-5" />
                                    High Memory Warning
                                </DialogTitle>
                                <DialogDescription className="text-text-muted mt-3">
                                    You are about to increase the simulation limit to{' '}
                                    <strong>{circuitWidth} qubits</strong>.
                                    <br />
                                    <br />
                                    Quantum state simulation scales exponentially: a system with n qubits requires
                                    storing 2ⁿ complex amplitudes.
                                    <br />
                                    <br />
                                    Each additional qubit doubles the required memory. Setting this limit too high
                                    (typically above 16–20 qubits) may cause your browser to freeze, crash, or run out
                                    of memory.
                                    <br />
                                    <br />
                                    Are you sure you want to proceed?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4 gap-2 sm:gap-0">
                                <DialogClose asChild>
                                    <Button
                                        variant="outline"
                                        className="bg-bg border-border text-text hover:bg-bg-light-hover"
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setOptions((prev) => ({ ...prev, maxCircuitWidth: circuitWidth }))
                                        }
                                    >
                                        Continue anyway
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }

        if (error) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive bg-bg-dark/95 z-10 p-4 text-center">
                    <span className="font-bold mb-2">Simulation Error</span>
                    <span className="text-sm">{error}</span>
                </div>
            );
        }

        if (isFilteredOut) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted z-10 p-4 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-bg-light p-4 rounded-full mb-4 ring-1 ring-border shadow-sm">
                        <FilterX className="w-8 h-8 text-text-muted" />
                    </div>
                    <h3 className="font-semibold text-text mb-1">No states visible</h3>
                    <p className="text-sm max-w-[250px] mb-4">
                        All states are below the current threshold of {minProbability.toFixed(1)}%.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMinProbability(0.1)}
                        className="bg-bg-light border-border hover:bg-bg-light-hover text-text"
                    >
                        Reset Filter
                    </Button>
                </div>
            );
        }

        return (
            <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar">
                <div
                    style={{
                        minWidth: shouldScroll ? `${computedMinWidth}px` : '100%',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                        <BarChart
                            data={visibleData}
                            margin={{ top: 0, right: 10, left: 15, bottom: 0 }}
                            accessibilityLayer
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke="var(--border)"
                                opacity={0.8}
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
                                tickMargin={5}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                                tickLine={false}
                                ticks={[0, 25, 50, 75, 100]}
                                tickFormatter={(value) => `${value}%`}
                                width={30}
                            />

                            <ChartTooltip
                                cursor={{ fill: 'var(--bg-light-hover)', opacity: 0.3 }}
                                content={<CustomTooltipContent sampleCount={options.sampleCount} />}
                            />

                            <Bar dataKey="prob" radius={[4, 4, 0, 0]} maxBarSize={128}>
                                {visibleData.map((entry) => (
                                    <Cell key={entry.state} fill={getBarColor(entry.phase)} strokeWidth={0} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full h-full border-l rounded-none flex flex-col min-w-0 border-none">
            <CardHeader className="bg-card z-10 shrink-0">
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
                    <div className="flex flex-col gap-2">
                        <div
                            className={`flex flex-col gap-1 transition-opacity duration-200 ${
                                isCircuitTooLarge ? 'opacity-50 pointer-events-none grayscale' : ''
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-text-muted text-[10px] sm:text-xs font-mono w-[45px] sm:w-[60px] w-[70px]">
                                    Endian:
                                </span>
                                <ToggleGroup
                                    className="scale-[0.55] sm:scale-95 lg:scale-100"
                                    type="single"
                                    value={endianness}
                                    onValueChange={(val) => {
                                        if (val) setEndianness(val as Endianness);
                                    }}
                                    disabled={isCircuitTooLarge}
                                >
                                    <ToggleGroupItem value="big">Big</ToggleGroupItem>

                                    <ToggleGroupItem value="little">Little</ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] sm:text-xs text-text-muted font-mono w-[70px]">
                                    Basis:
                                </span>
                                <span className="text-[10px] sm:text-xs font-mono bg-bg px-2 py-0.5 rounded border border-border-muted text-text">
                                    {basisLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`w-full md:w-auto flex justify-start md:justify-end transition-opacity duration-200 ${
                            isCircuitTooLarge ? 'opacity-50 pointer-events-none grayscale' : ''
                        }`}
                    >
                        <SimulationToolbar
                            options={options}
                            setOptions={setOptions}
                            showZero={showZero}
                            setShowZero={setShowZero}
                            minProbability={minProbability}
                            setMinProbability={setMinProbability}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative overflow-hidden flex flex-col min-h-0 bg-bg-dark">
                {measurementRows.length > 0 && (
                    <div className="shrink-0 border-b border-border bg-bg px-4 py-3">
                        <div className="text-xs font-semibold text-text mb-2">Measurement results</div>
                        <div className="flex flex-wrap gap-2">
                            {measurementRows.map((measurement, idx) => (
                                <Badge
                                    key={measurement.operationId ?? `${measurement.targetQubit.registerId}-${idx}`}
                                    variant="outline"
                                    className="font-mono border-border text-text bg-bg-light"
                                >
                                    {formatSelector(measurement.targetQubit.registerId, measurement.targetQubit.index)}
                                    {' -> '}
                                    {formatSelector(measurement.classicBit.registerId, measurement.classicBit.index)}
                                    {' = '}
                                    {measurement.outcome}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 min-h-0 relative">{renderChartArea()}</div>

                {/* Loading State Overlay */}
                {isCalculating && (
                    <div className="absolute inset-0 bg-bg-dark/50 backdrop-blur-[2px] z-20 flex items-center justify-center cursor">
                        <Badge
                            variant="outline"
                            className="bg-bg-light shadow-lg px-4 py-2 animate-pulse text-text border-border pointer-events-none"
                        >
                            Processing...
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
