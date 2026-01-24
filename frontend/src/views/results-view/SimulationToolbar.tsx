import { Dispatch, SetStateAction } from 'react';
import { Settings2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

// Domain Types
import { SimulationMode, SimulationOptions } from '@/simulation/simulation.types';
import { SmartInput } from '@/views/results-view/SmartInput.tsx';

interface ToolbarProps {
    options: SimulationOptions;
    setOptions: Dispatch<SetStateAction<SimulationOptions>>;
}

export function SimulationToolbar({ options, setOptions }: ToolbarProps) {
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
                <SelectTrigger className="w-[140px] h-8 text-xs bg-bg-light border-border text-text">
                    <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent className="bg-bg-light border-border text-text">
                    <SelectItem value="exact">Exact State</SelectItem>
                    <SelectItem value="simulation">Simulation</SelectItem>
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
                            <h4 className="font-medium leading-none text-text">
                                Simulation Settings
                            </h4>
                            <p className="text-xs text-text-muted">
                                Configure simulator parameters.
                            </p>
                        </div>
                        <Separator className="bg-border-muted" />

                        <div className="grid gap-4">
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="maxQubits" className="text-xs text-text">
                                    Max Qubits
                                </Label>
                                <SmartInput
                                    id="maxQubits"
                                    value={options.maxQubits ?? 1024}
                                    onChange={(v) => updateOption('maxQubits', v)}
                                    min={1}
                                    max={14}
                                />
                            </div>

                            <div
                                className={`grid grid-cols-3 items-center gap-4 transition-opacity duration-200 ${
                                    options.mode === 'exact' ? 'opacity-50 pointer-events-none' : ''
                                }`}
                            >
                                <Label htmlFor="shots" className="text-xs text-text">
                                    Shots
                                </Label>
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
                </PopoverContent>
            </Popover>
        </div>
    );
}
