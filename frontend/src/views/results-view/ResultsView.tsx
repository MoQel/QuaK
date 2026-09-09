import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { RefreshCcw, FilterX, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimulationToolbar } from '@/views/results-view/SimulationToolbar.tsx';
import { CustomTooltipContent } from '@/views/results-view/CustomTooltipContent.tsx';
import { getCircuitWidth, isQuantumRegister } from '@/api/dto/circuit';
import type { CircuitResponse } from '@/api/dto/circuit';
import { useQuantumSimulation } from '@/hooks/results/useQuantumSimulation.ts';
import type {
    MeasurementMapping,
    MeasurementResult,
    SimulationMode,
    SimulationOptions,
    SimulationOutcome,
    SimulationResult,
} from '@/simulation/simulation.types.ts';
import { useChartData } from '@/hooks/results/useChartData.ts';
import type { Endianness } from '@/hooks/results/useChartData.ts';
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
import type { ReactNode } from 'react';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';

type RegisterNames = Map<string, string>;
type EventPanelType = 'intermediate' | 'final';

const chartConfig = {
    prob: {
        label: 'Probability',
        color: 'var(--special)',
    },
} satisfies ChartConfig;

const eventCopy: Record<EventPanelType, { title: string; singular: string; plural: string; description: string }> = {
    intermediate: {
        title: 'Intermediate measurements',
        singular: 'measurement event',
        plural: 'measurement events',
        description: 'These are the explicit measurement events that occurred during circuit execution.',
    },
    final: {
        title: 'Classical readout',
        singular: 'terminal measurement',
        plural: 'terminal measurements',
        description: 'Automatic end-of-circuit measurements for qubits without an explicit final measurement.',
    },
};

export function ResultsView() {
    const { activeCircuit: circuit } = useCircuitTabs();
    const [options, setOptions] = useState<SimulationOptions>({
        mode: 'simulation',
        measurementMode: 'measurement-gates',
        sampleCount: 1024,
        maxCircuitWidth: 12,
    });
    const [endianness, setEndianness] = useState<Endianness>('big');
    const [showZero, setShowZero] = useState(false);
    const [minProbability, setMinProbability] = useState(0.1);

    const hasExplicitMeasurements = useMemo(() => hasCircuitMeasurements(circuit), [circuit]);
    const shouldUseReadoutHistogram =
        hasExplicitMeasurements || options.measurementMode === 'measurement-gates-plus-final';
    const effectiveOptions = useMemo(
        () => (shouldUseReadoutHistogram ? { ...options, mode: 'simulation' as const } : options),
        [options, shouldUseReadoutHistogram],
    );
    const { result, isCalculating, error } = useQuantumSimulation(circuit, effectiveOptions);

    const circuitWidth = useMemo(() => (circuit ? getCircuitWidth(circuit) : 0), [circuit]);
    const simulatedCircuitWidth = result?.simulatedQubits ?? circuitWidth;
    const chartData = useChartData(result, effectiveOptions, simulatedCircuitWidth, endianness);

    const registerNames = useMemo(() => {
        return new Map(circuit?.registers.map((reg) => [reg.id, reg.name]) ?? []);
    }, [circuit?.registers]);
    const orderedQuantumSelectors = useMemo(() => getOrderedQuantumSelectors(circuit), [circuit]);
    const measurementRows = result?.measurementResults ?? [];
    const intermediateMeasurementRows = measurementRows.filter(
        (measurement) => measurement.classicBit?.registerId !== '__auto__',
    );
    const finalSweepMeasurementRows = measurementRows.filter(
        (measurement) => measurement.classicBit?.registerId === '__auto__',
    );
    const hasClassicalReadout = hasCompletedClassicalReadout(result, effectiveOptions.mode);
    const readoutBasisLabel = getReadoutBasisLabel(result, hasClassicalReadout);
    const visibleData = showZero ? chartData : chartData.filter((d) => d.prob > 0 && d.prob >= minProbability);
    const isFilteredOut = chartData.length > 0 && visibleData.length === 0;
    const chartMinWidth = visibleData.length > 12 ? `${Math.max(100, visibleData.length * 40)}px` : '100%';
    const basisLabel = getBasisLabel({
        endianness,
        hasClassicalReadout,
        orderedQuantumSelectors,
        readoutBasisLabel,
        simulatedCircuitWidth,
    });
    const chartHeading = getChartHeading(
        effectiveOptions.mode,
        hasClassicalReadout,
        intermediateMeasurementRows.length,
    );
    const chartDescription = getChartDescription({
        distinctOutcomeCount: result?.distinctOutcomeCount ?? result?.outcomes?.length ?? 0,
        finalSweepCount: finalSweepMeasurementRows.length,
        hasClassicalReadout,
        intermediateCount: intermediateMeasurementRows.length,
        mode: effectiveOptions.mode,
        shots: result?.shots ?? effectiveOptions.sampleCount ?? 1024,
    });
    const chartAreaMinHeight =
        !shouldUseReadoutHistogram && intermediateMeasurementRows.length > 0 ? 'min-h-[26rem]' : 'min-h-[22rem]';
    const isCircuitTooLarge = circuitWidth > (options.maxCircuitWidth ?? 12);
    const showBasisControls =
        !shouldUseReadoutHistogram && (effectiveOptions.mode === 'exact' || effectiveOptions.mode === 'simulation');
    const controlTone = `transition-opacity duration-200 ${
        isCircuitTooLarge ? 'opacity-50 pointer-events-none grayscale' : ''
    }`;

    if (!circuit || (simulatedCircuitWidth === 0 && !isCalculating)) {
        return <EmptyResultsState />;
    }

    return (
        <Card className="w-full h-full border-l rounded-none flex flex-col min-w-0 border-none">
            <CardHeader className="bg-card z-10 shrink-0 px-3 py-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className={`min-w-0 max-w-full ${controlTone}`}>
                        {showBasisControls && (
                            <BasisControls
                                basisLabel={basisLabel}
                                disabled={isCircuitTooLarge}
                                endianness={endianness}
                                setEndianness={setEndianness}
                            />
                        )}
                    </div>
                    <div className={`w-full lg:w-auto flex justify-start lg:justify-end ${controlTone}`}>
                        <SimulationToolbar
                            options={options}
                            setOptions={setOptions}
                            hasConditionalState={!shouldUseReadoutHistogram && intermediateMeasurementRows.length > 0}
                            forceHistogramMode={shouldUseReadoutHistogram}
                            showZero={showZero}
                            setShowZero={setShowZero}
                            minProbability={minProbability}
                            setMinProbability={setMinProbability}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative overflow-y-auto overflow-x-hidden flex flex-col min-h-0 bg-bg-dark custom-scrollbar">
                {!shouldUseReadoutHistogram && (
                    <>
                        <MeasurementEventsPanel
                            registerNames={registerNames}
                            rows={intermediateMeasurementRows}
                            type="intermediate"
                        />
                        <MeasurementEventsPanel
                            registerNames={registerNames}
                            rows={finalSweepMeasurementRows}
                            type="final"
                        />
                    </>
                )}

                <ChartSummaryPanel
                    description={chartDescription}
                    heading={chartHeading}
                    modeLabel={effectiveOptions.mode === 'exact' ? 'Exact amplitudes' : 'Sampled distribution'}
                    readoutBasisLabel={readoutBasisLabel}
                    showReadoutOrder={hasClassicalReadout && Boolean(readoutBasisLabel)}
                />

                <div className={`flex-1 min-h-0 relative px-2 pb-2 sm:px-3 sm:pb-3 ${chartAreaMinHeight}`}>
                    <ChartArea
                        chartMinWidth={chartMinWidth}
                        circuitWidth={circuitWidth}
                        error={error}
                        isCircuitTooLarge={isCircuitTooLarge}
                        isFilteredOut={isFilteredOut}
                        minProbability={minProbability}
                        onIncreaseLimit={() => setOptions((prev) => ({ ...prev, maxCircuitWidth: circuitWidth }))}
                        onResetFilter={() => setMinProbability(0.1)}
                        sampleCount={result?.shots ?? effectiveOptions.sampleCount}
                        simulationLimit={options.maxCircuitWidth}
                        visibleData={visibleData}
                    />
                </div>

                {hasClassicalReadout && (
                    <>
                        <OutcomesPanel
                            measuredShotCount={result?.measuredShotCount ?? result?.shots ?? 0}
                            outcomeRows={result?.outcomes ?? []}
                        />
                        <MeasurementMappingsPanel measurementMappings={result?.measurementMappings ?? []} />
                    </>
                )}

                {isCalculating && <ProcessingOverlay />}
            </CardContent>
        </Card>
    );
}

function EmptyResultsState() {
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

function BasisControls({
    basisLabel,
    disabled,
    endianness,
    setEndianness,
}: Readonly<{
    basisLabel: string;
    disabled: boolean;
    endianness: Endianness;
    setEndianness: (endianness: Endianness) => void;
}>) {
    return (
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Endian</span>
                <ToggleGroup
                    type="single"
                    value={endianness}
                    onValueChange={(val) => {
                        if (val) setEndianness(val as Endianness);
                    }}
                    disabled={disabled}
                    className="justify-start"
                >
                    <ToggleGroupItem value="big">Big</ToggleGroupItem>
                    <ToggleGroupItem value="little">Little</ToggleGroupItem>
                </ToggleGroup>
            </div>
            <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-text-muted">Order</span>
                <span className="min-w-0 truncate text-[11px] font-mono text-text" title={basisLabel}>
                    {basisLabel}
                </span>
            </div>
        </div>
    );
}

function ChartArea({
    chartMinWidth,
    circuitWidth,
    error,
    isCircuitTooLarge,
    isFilteredOut,
    minProbability,
    onIncreaseLimit,
    onResetFilter,
    sampleCount,
    simulationLimit,
    visibleData,
}: Readonly<{
    chartMinWidth: string;
    circuitWidth: number;
    error: string | null;
    isCircuitTooLarge: boolean;
    isFilteredOut: boolean;
    minProbability: number;
    onIncreaseLimit: () => void;
    onResetFilter: () => void;
    sampleCount?: number;
    simulationLimit?: number;
    visibleData: ReturnType<typeof useChartData>;
}>) {
    if (isCircuitTooLarge) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-[50vh] text-muted-foreground text-sm italic">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="font-semibold text-text mb-2 text-lg">Circuit Too Large</h3>
                <p className="text-sm text-text-muted max-w-[320px] mb-6">
                    This circuit requires <strong>{circuitWidth} qubits</strong>, but your simulation limit is set to{' '}
                    {simulationLimit}.
                </p>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="default" className="bg-special hover:bg-special-hover text-white shadow-md">
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
                                Increasing the limit to <strong>{circuitWidth} qubits</strong> can use a lot of memory.
                                State simulation stores 2^n amplitudes, and above 16-20 qubits the browser may freeze or
                                crash.
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
                                <Button variant="destructive" onClick={onIncreaseLimit}>
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
                    onClick={onResetFilter}
                    className="bg-bg-light border-border hover:bg-bg-light-hover text-text"
                >
                    Reset Filter
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div style={{ minWidth: chartMinWidth, width: '100%', height: '100%' }}>
                <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                    <BarChart data={visibleData} margin={{ top: 0, right: 10, left: 15, bottom: 0 }} accessibilityLayer>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.8} />
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
                            content={<CustomTooltipContent sampleCount={sampleCount} />}
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
}

function MeasurementEventsPanel({
    registerNames,
    rows,
    type,
}: Readonly<{
    registerNames: RegisterNames;
    rows: MeasurementResult[];
    type: EventPanelType;
}>) {
    if (rows.length === 0) return null;

    const copy = eventCopy[type];
    const formatEvent = type === 'final' ? formatFinalReadoutEvent : formatMeasurementEvent;

    return (
        <ResultPanel border="border-b">
            <PanelHeader
                title={copy.title}
                meta={`${rows.length} ${rows.length === 1 ? copy.singular : copy.plural}`}
            />
            <div className="text-xs text-text-muted">{copy.description}</div>
            <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
                {rows.map((measurement, index) => (
                    <Badge
                        key={measurement.operationId ?? `${measurement.targetQubit.registerId}-${index}`}
                        variant="outline"
                        className="whitespace-normal break-all font-mono border-border text-text bg-bg-light"
                    >
                        {formatEvent(measurement, registerNames)}
                    </Badge>
                ))}
            </div>
        </ResultPanel>
    );
}

function ChartSummaryPanel({
    description,
    heading,
    modeLabel,
    readoutBasisLabel,
    showReadoutOrder,
}: Readonly<{
    description: string;
    heading: string;
    modeLabel: string;
    readoutBasisLabel: string;
    showReadoutOrder: boolean;
}>) {
    return (
        <ResultPanel border="border-b">
            <PanelHeader title={heading} meta={modeLabel} />
            <div className="text-xs text-text-muted">{description}</div>
            {showReadoutOrder && (
                <div className="text-xs text-text-muted">
                    Displayed order: <span className="font-mono text-text">{readoutBasisLabel}</span>
                </div>
            )}
        </ResultPanel>
    );
}

function OutcomesPanel({
    measuredShotCount,
    outcomeRows,
}: Readonly<{ measuredShotCount: number; outcomeRows: SimulationOutcome[] }>) {
    if (outcomeRows.length === 0) return null;

    return (
        <ResultPanel border="border-t">
            <PanelHeader title="Outcomes" meta={`Counts sum to ${measuredShotCount.toLocaleString()}`} />
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="text-text-muted">
                        <tr className="border-b border-border">
                            <th className="py-2 pr-4 font-medium">Outcome</th>
                            <th className="py-2 pr-4 font-medium">Register values</th>
                            <th className="py-2 pr-4 text-right font-medium">Count</th>
                            <th className="py-2 pr-4 text-right font-medium">Probability</th>
                            <th className="py-2 text-right font-medium">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {outcomeRows.map((outcome) => (
                            <tr key={outcome.combinedKey} className="border-b border-border/60">
                                <td className="py-2 pr-4 font-mono text-text">{outcome.combinedKey}</td>
                                <td className="py-2 pr-4 font-mono text-text-muted">
                                    {formatRegisterValues(outcome.registerValues)}
                                </td>
                                <td className="py-2 pr-4 text-right font-mono text-text">
                                    {outcome.count.toLocaleString()}
                                </td>
                                <td className="py-2 pr-4 text-right font-mono text-text-muted">
                                    {outcome.probability.toFixed(6)}
                                </td>
                                <td className="py-2 text-right font-mono text-text-muted">
                                    {formatPercentage(outcome.percentage)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ResultPanel>
    );
}

function MeasurementMappingsPanel({ measurementMappings }: Readonly<{ measurementMappings: MeasurementMapping[] }>) {
    if (measurementMappings.length === 0) return null;

    return (
        <ResultPanel border="border-t">
            <PanelHeader
                title="Measurement mappings"
                meta={`${measurementMappings.length} ${measurementMappings.length === 1 ? 'mapping' : 'mappings'}`}
            />
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
                {measurementMappings.map((mapping) => (
                    <Badge
                        key={`${mapping.executionOrder}-${mapping.operationId ?? 'measurement'}`}
                        variant="outline"
                        className="whitespace-normal break-all font-mono border-border text-text bg-bg-light"
                    >
                        {mapping.executionOrder + 1}. {mapping.source.registerName}[{mapping.source.bitIndex}] -&gt;{' '}
                        {mapping.target.registerName}[{mapping.target.bitIndex}]
                    </Badge>
                ))}
            </div>
        </ResultPanel>
    );
}

function ProcessingOverlay() {
    return (
        <div className="absolute inset-0 bg-bg-dark/50 backdrop-blur-[2px] z-20 flex items-center justify-center cursor">
            <Badge
                variant="outline"
                className="bg-bg-light shadow-lg px-4 py-2 animate-pulse text-text border-border pointer-events-none"
            >
                Processing...
            </Badge>
        </div>
    );
}

function ResultPanel({ border, children }: Readonly<{ border: 'border-b' | 'border-t'; children: ReactNode }>) {
    return <div className={`shrink-0 ${border} border-border bg-bg px-4 py-3`}>{children}</div>;
}

function PanelHeader({ title, meta }: Readonly<{ title: string; meta: string }>) {
    return (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{title}</div>
            <div className="text-[11px] text-text-muted">{meta}</div>
        </div>
    );
}

function formatSelector(registerNames: RegisterNames, registerId: string, index: number) {
    if (registerId === '__auto__') {
        return `auto[${index}]`;
    }
    return `${registerNames.get(registerId) ?? registerId}[${index}]`;
}

function formatMeasurementEvent(measurement: MeasurementResult, registerNames: RegisterNames) {
    const target = formatSelector(registerNames, measurement.targetQubit.registerId, measurement.targetQubit.index);
    const classicTarget = measurement.classicBit
        ? ` -> ${formatSelector(registerNames, measurement.classicBit.registerId, measurement.classicBit.index)}`
        : '';
    return `${target}${classicTarget} = ${measurement.outcome}`;
}

function formatFinalReadoutEvent(measurement: MeasurementResult, registerNames: RegisterNames) {
    const target = formatSelector(registerNames, measurement.targetQubit.registerId, measurement.targetQubit.index);
    return `${target} -> readout[${measurement.targetQubit.index}] = ${measurement.outcome}`;
}

function formatRegisterValues(registerValues: Record<string, string>) {
    return Object.entries(registerValues)
        .map(([name, value]) => `${name}=${value}`)
        .join(' | ');
}

function formatPercentage(percentage: number) {
    return percentage > 0 && percentage < 0.01 ? '<0.01%' : `${percentage.toFixed(2)}%`;
}

function hasCircuitMeasurements(circuit?: CircuitResponse): boolean {
    return Boolean(
        circuit?.layers.some((layer) => layer.quantumOperations.some((operation) => operation.type === 'MEASUREMENT')),
    );
}

function hasCompletedClassicalReadout(result: SimulationResult | null, mode?: SimulationMode): boolean {
    return (
        mode === 'simulation' &&
        result?.status === 'COMPLETED' &&
        (result.readoutRegisters?.length ?? 0) > 0 &&
        Boolean(result.counts)
    );
}

function getOrderedQuantumSelectors(circuit?: CircuitResponse): string[] {
    return (
        circuit?.registers
            .filter(isQuantumRegister)
            .flatMap((register) =>
                Array.from({ length: register.numberOfQubits }, (_, index) => `${register.name}[${index}]`),
            ) ?? []
    );
}

function getReadoutBasisLabel(result: SimulationResult | null, hasClassicalReadout: boolean): string {
    if (!hasClassicalReadout || !result?.readoutRegisters?.length) return '';

    return result.readoutRegisters
        .map((register) => Array.from({ length: register.size }, (_, index) => `${register.name}[${index}]`).join(' '))
        .join('   ');
}

function getBasisLabel({
    endianness,
    hasClassicalReadout,
    orderedQuantumSelectors,
    readoutBasisLabel,
    simulatedCircuitWidth,
}: {
    endianness: Endianness;
    hasClassicalReadout: boolean;
    orderedQuantumSelectors: string[];
    readoutBasisLabel: string;
    simulatedCircuitWidth: number;
}) {
    if (simulatedCircuitWidth === 0) return '';
    if (hasClassicalReadout) return readoutBasisLabel;

    const visibleSelectors = orderedQuantumSelectors.slice(0, simulatedCircuitWidth);
    const orderedQubits = endianness === 'big' ? visibleSelectors : [...visibleSelectors].reverse();
    return orderedQubits.join(' ');
}

function getChartHeading(mode: SimulationMode | undefined, hasClassicalReadout: boolean, intermediateCount: number) {
    if (hasClassicalReadout) return 'Measurement Results';
    if (intermediateCount > 0 && mode === 'exact') return 'Conditional final state';
    return mode === 'simulation' ? 'Probabilities' : 'Statevector';
}

function getChartDescription({
    distinctOutcomeCount,
    finalSweepCount,
    hasClassicalReadout,
    intermediateCount,
    mode,
    shots,
}: {
    distinctOutcomeCount: number;
    finalSweepCount: number;
    hasClassicalReadout: boolean;
    intermediateCount: number;
    mode?: SimulationMode;
    shots: number;
}) {
    if (hasClassicalReadout) {
        return `${shots.toLocaleString()} shots, ${distinctOutcomeCount.toLocaleString()} observed outcome${
            distinctOutcomeCount === 1 ? '' : 's'
        }.`;
    }
    if (mode === 'simulation') return 'Sampled computational-basis probabilities.';
    if (intermediateCount > 0) {
        return `Conditioned on ${intermediateCount} intermediate measurement event${intermediateCount === 1 ? '' : 's'}.`;
    }
    if (finalSweepCount > 0) {
        return 'The quantum-state plot still reflects the state immediately before the automatic end-of-circuit measurement sweep.';
    }
    return 'Final quantum state after the circuit.';
}
