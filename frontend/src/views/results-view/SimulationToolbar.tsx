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
    // Helper für sauberes Input-Handling (verhindert NaN)
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
                <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                    <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="exact">Exact State</SelectItem>
                    <SelectItem value="simulation">Simulation</SelectItem>
                </SelectContent>
            </Select>

            {/* Advanced Settings Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <Settings2 className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Simulation Settings</h4>
                            <p className="text-xs text-muted-foreground">
                                Configure simulator parameters.
                            </p>
                        </div>
                        <Separator />

                        <div className="grid gap-4">
                            {/* Max Qubits */}
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="maxQubits" className="text-xs">
                                    Max Qubits
                                </Label>
                                <Input
                                    id="maxQubits"
                                    type="number"
                                    className="col-span-2 h-8 text-xs"
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
                                <Label htmlFor="shots" className="text-xs">
                                    Shots
                                </Label>
                                <Input
                                    id="shots"
                                    type="number"
                                    className="col-span-2 h-8 text-xs"
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
