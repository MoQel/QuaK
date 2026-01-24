import { Dispatch, SetStateAction } from 'react';
import { Settings2 } from 'lucide-react';

// UI Components
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
import { Input } from '@/components/ui/input';

// Domain Types
import { SimulationMode, SimulationOptions } from '@/simulation/simulation.types';

interface ToolbarProps {
    options: SimulationOptions;
    setOptions: Dispatch<SetStateAction<SimulationOptions>>;
}

export function SimulationToolbar({ options, setOptions }: ToolbarProps) {
    const handleNumberChange = (
        field: keyof SimulationOptions,
        value: string,
        fallback: number,
    ) => {
        const num = parseInt(value);
        setOptions((prev) => ({
            ...prev,
            [field]: isNaN(num) ? fallback : num,
        }));
    };

    return (
        <div className="flex items-center gap-2">
            {/* Mode Selector */}
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

            {/* Advanced Settings Popover */}
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
                            {/* Max Qubits */}
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="maxQubits" className="text-xs text-text">
                                    Max Qubits
                                </Label>
                                <Input
                                    id="maxQubits"
                                    type="number"
                                    className="col-span-2 h-8 text-xs bg-bg border-border text-text"
                                    value={options.maxQubits}
                                    onChange={(e) =>
                                        handleNumberChange('maxQubits', e.target.value, 8)
                                    }
                                    max={14}
                                    min={1}
                                />
                            </div>

                            {/* Shots (Disabled if Exact Mode) */}
                            <div
                                className={`grid grid-cols-3 items-center gap-4 transition-opacity duration-200 ${
                                    options.mode === 'exact' ? 'opacity-50 pointer-events-none' : ''
                                }`}
                            >
                                <Label htmlFor="shots" className="text-xs text-text">
                                    Shots
                                </Label>
                                <Input
                                    id="shots"
                                    type="number"
                                    className="col-span-2 h-8 text-xs bg-bg border-border text-text"
                                    value={options.sampleCount}
                                    onChange={(e) =>
                                        handleNumberChange('sampleCount', e.target.value, 1024)
                                    }
                                    step={100}
                                    min={1}
                                />
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
