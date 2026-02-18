import { Separator } from '@/components/ui/separator.tsx';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { getBarColor } from '@/views/results-view/util/quantum-utils.ts';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
    sampleCount?: number;
}

export interface ChartDataPoint {
    state: string;
    prob: number;
    count?: number;
    real?: number;
    imag?: number;
    phase?: number;
}

export const CustomTooltipContent = ({ active, payload, sampleCount }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as ChartDataPoint;

    return (
        <div className="bg-bg-light/95 border border-border text-text p-3 rounded-lg shadow-xl text-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBarColor(d.phase) }} />
                <p className="font-bold font-mono text-base tracking-wider">{d.state}</p>
            </div>

            <div className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-6">
                    <span className="text-text-muted">Probability:</span>
                    <span className="font-mono font-medium text-text">{d.prob.toFixed(2)}%</span>
                </div>

                {/* Simulation Mode */}
                {d.count !== undefined && (
                    <div className="flex justify-between gap-6">
                        <span className="text-text-muted">Count:</span>
                        <span className="font-mono text-text">
                            {d.count} / <span className="text-text-muted">{sampleCount}</span>
                        </span>
                    </div>
                )}

                {/* Exact Mode */}
                {d.real !== undefined && (
                    <>
                        <Separator className="my-2 bg-border-muted" />
                        <div className="flex justify-between gap-6">
                            <span className="text-text-muted">Amplitude:</span>
                            <span className="font-mono text-text">
                                {d.real.toFixed(3)} {d.imag! >= 0 ? '+' : ''}
                                {d.imag!.toFixed(3)}i
                            </span>
                        </div>
                        <div className="flex justify-between gap-6 items-center">
                            <span className="text-text-muted">Phase:</span>
                            <span className="font-mono text-text">{((d.phase! * 180) / Math.PI).toFixed(1)}°</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
