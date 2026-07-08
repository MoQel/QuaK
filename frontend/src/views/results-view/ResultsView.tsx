import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { RefreshCcw, FilterX, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimulationToolbar } from '@/views/results-view/SimulationToolbar.tsx';
import { CustomTooltipContent } from '@/views/results-view/CustomTooltipContent.tsx';
import { getCircuitWidth, isQuantumRegister } from '@/api/dto/circuit';
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
        measurementMode: 'measurement-gates',
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

    const orderedQuantumSelectors = useMemo(() => {
        if (!circuit) return [];

        return circuit.registers
            .filter(isQuantumRegister)
            .flatMap((register) =>
                Array.from({ length: register.numberOfQubits }, (_, index) => `${register.name}[${index}]`),
            );
    }, [circuit]);

    const measurementRows = useMemo(() => {
        return result?.measurementResults ?? [];
    }, [result?.measurementResults]);

    const intermediateMeasurementRows = useMemo(() => {
        return measurementRows.filter((measurement) => measurement.classicBit?.registerId !== '__auto__');
    }, [measurementRows]);

    const finalSweepMeasurementRows = useMemo(() => {
        return measurementRows.filter((measurement) => measurement.classicBit?.registerId === '__auto__');
    }, [measurementRows]);

    const formatSelector = (registerId: string, index: number) => {
        if (registerId === '__auto__') {
            return `auto[${index}]`;
        }
        return `${registerNames.get(registerId) ?? registerId}[${index}]`;
    };

    const formatMeasurementEvent = (measurement: (typeof measurementRows)[number]) => {
        const target = formatSelector(measurement.targetQubit.registerId, measurement.targetQubit.index);
        const classicTarget = measurement.classicBit
            ? ` -> ${formatSelector(measurement.classicBit.registerId, measurement.classicBit.index)}`
            : '';
        return `${target}${classicTarget} = ${measurement.outcome}`;
    };

    const formatFinalReadoutEvent = (measurement: (typeof measurementRows)[number]) => {
        const target = formatSelector(measurement.targetQubit.registerId, measurement.targetQubit.index);
        return `${target} -> readout[${measurement.targetQubit.index}] = ${measurement.outcome}`;
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

        const visibleSelectors = orderedQuantumSelectors.slice(0, simulatedCircuitWidth);
        const orderedQubits = endianness === 'big' ? visibleSelectors : [...visibleSelectors].reverse();

        return `|${orderedQubits.join(' ')}>`;
    }, [simulatedCircuitWidth, endianness, orderedQuantumSelectors]);

    const chartHeading = useMemo(() => {
        if (intermediateMeasurementRows.length > 0 && options.mode === 'exact') {
            return 'Conditional final state';
        }

        return 'Final state probabilities';
    }, [intermediateMeasurementRows.length, options.mode]);

    const chartDescription = useMemo(() => {
        if (intermediateMeasurementRows.length > 0) {
            return `Conditioned on ${intermediateMeasurementRows.map(formatMeasurementEvent).join(', ')}.`;
        }

        if (finalSweepMeasurementRows.length > 0) {
            return 'The quantum-state plot still reflects the state immediately before the automatic end-of-circuit measurement sweep.';
        }

        return 'This plot shows the quantum state after the full circuit execution.';
    }, [finalSweepMeasurementRows.length, intermediateMeasurementRows]);

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

    const chartAreaMinHeight = intermediateMeasurementRows.length > 0 ? 'min-h-[26rem]' : 'min-h-[22rem]';

    return (
        <Card className="w-full h-full border-l rounded-none flex flex-col min-w-0 border-none">
            <CardHeader className="bg-card z-10 shrink-0 px-3 py-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div
                        className={`min-w-0 max-w-full transition-opacity duration-200 ${
                            isCircuitTooLarge ? 'opacity-50 pointer-events-none grayscale' : ''
                        }`}
                    >
                        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Endian</span>
                                <ToggleGroup
                                    type="single"
                                    value={endianness}
                                    onValueChange={(val) => {
                                        if (val) setEndianness(val as Endianness);
                                    }}
                                    disabled={isCircuitTooLarge}
                                    className="justify-start"
                                >
                                    <ToggleGroupItem value="big">Big</ToggleGroupItem>
                                    <ToggleGroupItem value="little">Little</ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-text-muted">
                                    Basis
                                </span>
                                <span className="min-w-0 truncate text-[11px] font-mono text-text" title={basisLabel}>
                                    {basisLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`w-full lg:w-auto flex justify-start lg:justify-end transition-opacity duration-200 ${
                            isCircuitTooLarge ? 'opacity-50 pointer-events-none grayscale' : ''
                        }`}
                    >
                        <SimulationToolbar
                            options={options}
                            setOptions={setOptions}
                            hasConditionalState={intermediateMeasurementRows.length > 0}
                            showZero={showZero}
                            setShowZero={setShowZero}
                            minProbability={minProbability}
                            setMinProbability={setMinProbability}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative overflow-y-auto overflow-x-hidden flex flex-col min-h-0 bg-bg-dark custom-scrollbar">
                {intermediateMeasurementRows.length > 0 && (
                    <div className="shrink-0 border-b border-border bg-bg px-4 py-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                                    Intermediate measurements
                                </div>
                                <div className="text-[11px] text-text-muted">
                                    {intermediateMeasurementRows.length}{' '}
                                    {intermediateMeasurementRows.length === 1
                                        ? 'measurement event'
                                        : 'measurement events'}
                                </div>
                            </div>
                            <div className="text-xs text-text-muted">
                                These are the explicit measurement events that occurred during circuit execution.
                            </div>
                        </div>
                        <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
                            {intermediateMeasurementRows.map((measurement, idx) => (
                                <Badge
                                    key={measurement.operationId ?? `${measurement.targetQubit.registerId}-${idx}`}
                                    variant="outline"
                                    className="whitespace-normal break-all font-mono border-border text-text bg-bg-light"
                                >
                                    {formatMeasurementEvent(measurement)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {finalSweepMeasurementRows.length > 0 && (
                    <div className="shrink-0 border-b border-border bg-bg px-4 py-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                                    Classical readout
                                </div>
                                <div className="text-[11px] text-text-muted">
                                    {finalSweepMeasurementRows.length}{' '}
                                    {finalSweepMeasurementRows.length === 1
                                        ? 'terminal measurement'
                                        : 'terminal measurements'}
                                </div>
                            </div>
                            <div className="text-xs text-text-muted">
                                Automatic end-of-circuit measurements for qubits without an explicit final measurement.
                            </div>
                        </div>
                        <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
                            {finalSweepMeasurementRows.map((measurement, idx) => (
                                <Badge
                                    key={
                                        measurement.operationId ??
                                        `readout-${measurement.targetQubit.registerId}-${idx}`
                                    }
                                    variant="outline"
                                    className="whitespace-normal break-all font-mono border-border text-text bg-bg-light"
                                >
                                    {formatFinalReadoutEvent(measurement)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="shrink-0 border-b border-border bg-bg px-4 py-3">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                                {chartHeading}
                            </div>
                            <div className="text-[11px] text-text-muted">
                                {options.mode === 'exact' ? 'Exact amplitudes' : 'Sampled distribution'}
                            </div>
                        </div>
                        <div className="text-xs text-text-muted">{chartDescription}</div>
                    </div>
                </div>

                <div className={`flex-1 min-h-0 relative px-2 pb-2 sm:px-3 sm:pb-3 ${chartAreaMinHeight}`}>
                    {renderChartArea()}
                </div>

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
