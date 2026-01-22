import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircuitResponse } from "@/api/dto/circuit";
import {useQuantumSimulation} from "@/hooks/useQuantumSimulation.ts";
interface ResultsViewProps {
    circuit: CircuitResponse | null;
}

interface ChartDataPoint {
    state: string;      // e.g. "|01>"
    prob: number;       // 0–100
    real: number;
    imag: number;
    phase: number;      // radians
}

export function ResultsView({ circuit }: ResultsViewProps) {
    // 1. Use Worker Hook: It handles loading, errors and calculations.
    const { result, isLoading, error } = useQuantumSimulation(circuit);

    // Transform data: Only if “result” is present use useMemo so that this does not occur with every re-render
    const chartData = useMemo<ChartDataPoint[]>(() => {
        if (!result) return [];

        return result.stateVector.map(entry => ({
            state: entry.state,
            prob: entry.prob * 100, // Umrechnung in Prozent für die Chart
            real: entry.real,
            imag: entry.imag,
            phase: entry.phase
        }));
    }, [result]);

    // Compute number of qubits (used for UI metadata)
    const numQubits = useMemo(() => {
        return circuit?.registers.flatMap(r => r.qubits).length || 0;
    }, [circuit]);

    // Helper: compute bar color based on phase
    const getPhaseColor = (phase: number) => {
        // Map phase (-PI to +PI) to color wheel (0–360)
        const degrees = (phase * 180) / Math.PI;
        // Use HSL: hue rotates with the phase
        return `hsl(${degrees < 0 ? degrees + 360 : degrees}, 70%, 60%)`;
    };

    // --- RENDER: Empty state ---
    if (!circuit || numQubits === 0) {
        return (
            <Card className="w-full h-full flex flex-col justify-center items-center text-muted-foreground p-8">
                <div className="text-4xl mb-2">⚛️</div>
                <p>Add qubits to the circuit to see results.</p>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle>Simulation Results</CardTitle>
                    <div className="flex gap-2">
                        {/* Display loading badge when worker is calculating */}
                        {isLoading && <Badge variant="secondary" className="animate-pulse">Calculating...</Badge>}

                        <Badge variant="outline">{numQubits} Qubits</Badge>
                        <Badge variant={result?.counts ? "default" : "secondary"}>
                            {result?.counts ? "Monte Carlo (1024 Shots)" : "Exact State Vector"}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] relative">
                {/* Error State */}
                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-background/80 z-10">
                        Simulation Error: {error}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="state"
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                fontSize={12}
                            />
                            <YAxis
                                unit="%"
                                domain={[0, 100]}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload as ChartDataPoint;
                                        return (
                                            <div className="bg-popover border text-popover-foreground p-3 rounded shadow-lg text-sm">
                                                <p className="font-bold mb-1">{d.state}</p>
                                                <div className="space-y-1">
                                                    <p>Probability: <span className="font-mono">{d.prob.toFixed(2)}%</span></p>
                                                    <div className="h-px bg-border my-2" />
                                                    <p className="text-xs text-muted-foreground">Amplitude:</p>
                                                    <p className="font-mono text-xs">
                                                        {d.real.toFixed(3)} {d.imag >= 0 ? '+' : ''}{d.imag.toFixed(3)}i
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Phase: {(d.phase * 180 / Math.PI).toFixed(1)}°
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getPhaseColor(entry.phase)}
                                        stroke={getPhaseColor(entry.phase)}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}

                {/* Optional: Overlay during loading if the old chart should still be visible */}
                {isLoading && (
                    <div className="absolute inset-0 bg-background/20 pointer-events-none" />
                )}
            </CardContent>
        </Card>
    );
}