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
    showZero: boolean;
    setShowZero: Dispatch<SetStateAction<boolean>>;
    minProbability: number;
    setMinProbability: Dispatch<SetStateAction<number>>;
}

export function SimulationToolbar({
    options,
    setOptions,
    showZero,
    setShowZero,
    minProbability,
    setMinProbability,
}: Readonly<ToolbarProps>) {
    const updateOption = (field: keyof SimulationOptions, val: number) => {
        setOptions((prev) => ({ ...prev, [field]: val }));
    };

    return (
        <div className="flex items-center gap-2">
            <Select
                value={options.mode}
                onValueChange={(val) =>
                    setOptions((prev) => ({
                        ...prev,
                        mode: val as SimulationMode,
                    }))
                }
            >
                <SelectTrigger className="w-[140px] h-8 bg-bg-light hover:bg-bg-light-hover border-border text-text">
                    <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent className="bg-bg-light border-border text-text">
                    <SelectItem value="exact" className="rounded cursor-pointer focus:bg-highlight focus:text-text">
                        Exact State
                    </SelectItem>
                    <SelectItem
                        value="simulation"
                        className="rounded cursor-pointer focus:bg-highlight focus:text-text"
                    >
                        Simulation
                    </SelectItem>
                </SelectContent>
            </Select>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-bg-light border-border text-text hover:bg-bg-light-hover"
                    >
                        <Settings2 className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-bg-light border-border text-text" align="end">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none text-text">Simulation Settings</h4>
                            <p className="text-xs text-text-muted">Configure simulator parameters.</p>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Simulation Parameters */}
                            <div className="space-y-3">
                                <h5 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Simulation
                                </h5>
                                <div className="flex items-center justify-between">
                                    <div className="flex">
                                        <Label htmlFor="maxQubits" className="text-sm text-text font-normal">
                                            Max Circuit Size
                                        </Label>
                                        {(options.maxQubits ?? 12) >= 16 && (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Button variant="ghost" size="icon">
                                                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-destructive">
                                                    <p className="text-text text-sm leading-tight">
                                                        <p>High qubit counts may cause your browser</p>
                                                        <p>to freeze or crash due to high memory usage.</p>
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <div className="w-24">
                                        <SmartInput
                                            id="maxQubits"
                                            value={options.maxQubits ?? 24}
                                            onChange={(v) => updateOption('maxQubits', v)}
                                            min={1}
                                            max={24}
                                        />
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center justify-between transition-opacity duration-200 ${
                                        options.mode === 'exact' ? 'opacity-40 pointer-events-none' : ''
                                    }`}
                                >
                                    <Label htmlFor="shots" className="text-sm text-text font-normal">
                                        Shots
                                    </Label>
                                    <div className="w-24">
                                        <SmartInput
                                            id="shots"
                                            value={options.sampleCount ?? 1024}
                                            onChange={(v) => updateOption('sampleCount', v)}
                                            min={1}
                                            step={100}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Filters */}
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
                                        Hides states below this threshold.
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
