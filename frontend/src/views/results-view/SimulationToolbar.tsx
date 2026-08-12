import { Dispatch, SetStateAction } from 'react';
import { Settings2, Eye, Filter, Cpu, Target, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SimulationMode, SimulationOptions } from '@/simulation/simulation.types';
import { SmartInput } from '@/views/results-view/SmartInput.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip.tsx';

interface ToolbarProps {
    options: SimulationOptions;
    setOptions: Dispatch<SetStateAction<SimulationOptions>>;
    hasConditionalState: boolean;
    forceHistogramMode: boolean;
    showZero: boolean;
    setShowZero: Dispatch<SetStateAction<boolean>>;
    minProbability: number;
    setMinProbability: Dispatch<SetStateAction<number>>;
}

export function SimulationToolbar({
    options,
    setOptions,
    hasConditionalState,
    forceHistogramMode,
    showZero,
    setShowZero,
    minProbability,
    setMinProbability,
}: Readonly<ToolbarProps>) {
    const updateOption = (field: keyof SimulationOptions, val: number) => {
        setOptions((prev) => ({ ...prev, [field]: val }));
    };

    const updateSelectOption = (field: keyof SimulationOptions, val: SimulationMode) => {
        setOptions((prev) => ({ ...prev, [field]: val }));
    };

    const isExactMode = options.mode === 'exact' && !forceHistogramMode;
    const finalReadoutEnabled = options.measurementMode === 'measurement-gates-plus-final';
    const exactModeLabel = hasConditionalState ? 'Conditional State' : 'Exact State';
    const shotsDescription = forceHistogramMode
        ? 'Readout histograms are always shot-based.'
        : `${exactModeLabel} does not need shots.`;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <Select
                value={forceHistogramMode ? 'simulation' : options.mode}
                onValueChange={(val) => updateSelectOption('mode', val as SimulationMode)}
                disabled={forceHistogramMode}
            >
                <SelectTrigger className="w-full sm:w-[156px] h-9 bg-bg hover:bg-bg-light border-border text-text">
                    <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent className="bg-bg border-border text-text">
                    <SelectItem value="exact" className="rounded cursor-pointer focus:bg-bg-light focus:text-text">
                        {exactModeLabel}
                    </SelectItem>
                    <SelectItem value="simulation" className="rounded cursor-pointer focus:bg-bg-light focus:text-text">
                        {forceHistogramMode ? 'Measurement Results' : 'Simulation'}
                    </SelectItem>
                </SelectContent>
            </Select>

            <Popover>
                <PopoverTrigger asChild>
                    <Button size="icon" className="h-9 w-9 text-text bg-bg hover:bg-bg-light border border-border">
                        <Settings2 className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[min(26rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto bg-bg-light border-border text-text"
                    align="end"
                >
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none text-text">Simulation Settings</h4>
                            <p className="text-xs text-text-muted">Tune the run settings.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h5 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Simulation
                                </h5>
                                <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg/40 px-3 py-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="final-readout" className="text-sm text-text font-normal">
                                            Final readout
                                        </Label>
                                        <p className="text-xs text-text-muted">
                                            Explicit measurement gates are always executed. When enabled, terminal
                                            measurements are added to qubits that do not already have a final
                                            measurement.
                                        </p>
                                    </div>
                                    <Switch
                                        id="final-readout"
                                        checked={finalReadoutEnabled}
                                        onCheckedChange={(checked) =>
                                            setOptions((prev) => ({
                                                ...prev,
                                                measurementMode: checked
                                                    ? 'measurement-gates-plus-final'
                                                    : 'measurement-gates',
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px] sm:items-center">
                                    <div className="flex items-center gap-1.5">
                                        <Label
                                            htmlFor="maxWidth"
                                            className="text-sm text-text font-normal leading-none"
                                        >
                                            Max Circuit Width
                                        </Label>
                                        {(options.maxCircuitWidth ?? 12) >= 16 && (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-destructive">
                                                    <div className="text-text text-sm leading-tight">
                                                        <p>High circuit widths may cause your browser</p>
                                                        <p>to freeze or crash due to high memory usage.</p>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <SmartInput
                                        id="maxCircuitWidth"
                                        value={options.maxCircuitWidth ?? 24}
                                        onChange={(v) => updateOption('maxCircuitWidth', v)}
                                        min={1}
                                        max={24}
                                    />
                                </div>

                                <div
                                    className={`grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px] sm:items-center transition-opacity duration-200 ${
                                        isExactMode ? 'opacity-40 pointer-events-none' : ''
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <Label htmlFor="shots" className="text-sm text-text font-normal">
                                            Shots
                                        </Label>
                                        <p className="text-xs text-text-muted">
                                            Used for sampled simulation runs. {shotsDescription}
                                        </p>
                                    </div>
                                    <SmartInput
                                        id="shots"
                                        value={options.sampleCount ?? 1024}
                                        onChange={(v) => updateOption('sampleCount', v)}
                                        min={1}
                                        step={100}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Filter className="w-3 h-3" /> View Filters
                                </h5>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label
                                            htmlFor="showZero"
                                            className="text-sm text-text font-medium flex items-center gap-2"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-text-muted" />
                                            Show all states
                                        </Label>
                                        <p className="text-xs text-text-muted">Include 0% probability states</p>
                                    </div>
                                    <Switch id="showZero" checked={showZero} onCheckedChange={setShowZero} />
                                </div>

                                <div
                                    className={`transition-all duration-200 ${showZero ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <Label
                                            htmlFor="probFilter"
                                            className="text-sm text-text font-normal flex items-center gap-2"
                                        >
                                            <Target className="w-3.5 h-3.5 text-text-muted" />
                                            Min. Probability
                                        </Label>
                                        <span className="text-xs text-text-muted font-mono">
                                            {minProbability.toFixed(1)}%
                                        </span>
                                    </div>
                                    <SmartInput
                                        id="probFilter"
                                        value={minProbability}
                                        onChange={setMinProbability}
                                        min={0}
                                        max={100}
                                        step={0.1}
                                    />
                                    <p className="text-[10px] text-text-muted mt-1">
                                        Hides 0% states and states below this threshold.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
