import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { RefreshCcw, FilterX, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimulationToolbar } from '@/views/results-view/SimulationToolbar.tsx';
import { CustomTooltipContent } from '@/views/results-view/CustomTooltipContent.tsx';
import { CircuitResponse, getRegisterSize, getTotalQubitCount } from '@/api/dto/circuit';
import { useQuantumSimulation } from '@/hooks/results/useQuantumSimulation.ts';
import { SimulationOptions } from '@/simulation/simulation.types.ts';
import { Endianness, useChartData } from '@/hooks/results/useChartData.ts';
import { getBarColor } from '@/views/results-view/util/quantum-utils.ts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
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

const chartConfig = {
    prob: {
        label: 'Probability',
        color: 'var(--special)',
    },
} satisfies ChartConfig;

interface ResultsViewProps {
    circuit: CircuitResponse | undefined;
}

export function ResultsView({ circuit }: Readonly<ResultsViewProps>) {
    const [options, setOptions] = useState<SimulationOptions>({
        mode: 'exact',
        sampleCount: 1024,
        maxQubits: 12,
    });
    const [endianness, setEndianness] = useState<Endianness>('big');

    const { result, isCalculating, error } = useQuantumSimulation(circuit, options);

    const totalQubits = useMemo(() => {
        if (!circuit) return 0;
        return getTotalQubitCount(circuit);
    }, [circuit]);

    const numQubits = useMemo(() => {
        if (result?.simulatedQubits) {
            return result.simulatedQubits;
        }

        if (!circuit) return 0;

        const max = options.maxQubits ?? 8;
        let count = 0;

        for (const register of circuit.registers) {
            const registerSize: number = getRegisterSize(register);
            if (count + registerSize > max) break;
            count += registerSize;
        }
        return count;
    }, [circuit, result, options.maxQubits]);

    const chartData = useChartData(result, options, numQubits, endianness);

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
        if (numQubits === 0) return '';
        if (numQubits === 1) return '|q0>';

        return endianness === 'big' ? `|q0...q${numQubits - 1}>` : `|q${numQubits - 1}...q0>`;
    }, [numQubits, endianness]);

    // Empty State
    if (!circuit || (numQubits === 0 && !isCalculating)) {
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

    const isCircuitTooLarge = totalQubits > (options.maxQubits ?? 12);

    const renderChartArea = () => {
        if (isCircuitTooLarge) {
            return (
                <CardContent className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground text-sm italic">
                    <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                    <h3 className="font-semibold text-text mb-2 text-lg">Circuit Too Large</h3>
                    <p className="text-sm text-text-muted max-w-[320px] mb-6">
                        This circuit requires <strong>{totalQubits} qubits</strong>, but your simulation limit is set to{' '}
                        {options.maxQubits}.
                    </p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="default"
                                className="bg-special hover:bg-special-hover text-white shadow-md"
                            >
                                Increase limit to {totalQubits}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-warning">
                                    <AlertTriangle className="w-5 h-5" />
                                    High Memory Warning
                                </DialogTitle>
                                <DialogDescription className="text-text-muted mt-3">
                                    You are about to increase the simulation limit to{' '}
                                    <strong>{totalQubits} qubits</strong>.
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
                                        onClick={() => setOptions((prev) => ({ ...prev, maxQubits: totalQubits }))}
                                    >
                                        Continue anyway
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
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
                    className="h-full p-4 pb-2"
                >
                    <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                        <BarChart
                            data={visibleData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                                content={<CustomTooltipContent sampleCount={options.sampleCount} />}
                            />

                            <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
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
        <Card className="w-full h-full border-l rounded-none flex flex-col min-w-0">
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
                        <div
                            className={`flex flex-row gap-3 items-center transition-opacity duration-200 ${
                                isCircuitTooLarge ? 'opacity-50 pointer-events-none grayscale' : ''
                            }`}
                        >
                            <p className="text-text-muted text-sm font-mono tracking-wide">Basis:</p>
                            <Select value={endianness} onValueChange={(val: Endianness) => setEndianness(val)}>
                                <SelectTrigger className="w-[125px] bg-card hover:bg-bg-light-hover text-xs text-text">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-bg-light border-border text-text">
                                    <SelectItem
                                        value="big"
                                        className="text-xs rounded cursor-pointer focus:bg-highlight focus:text-text"
                                    >
                                        Big Endian
                                    </SelectItem>
                                    <SelectItem
                                        value="little"
                                        className="text-xs rounded cursor-pointer focus:bg-highlight focus:text-text"
                                    >
                                        Little Endian
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-text-muted mt-1 font-mono">
                                <span className="bg-bg px-1.5 py-0.5 rounded text-text border border-border-muted">
                                    {basisLabel}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div
                        className={`transition-opacity duration-200 ${
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
                {renderChartArea()}

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
