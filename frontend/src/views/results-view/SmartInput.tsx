import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export const SmartInput = ({
    value,
    onChange,
    id,
    min,
    max,
    step,
}: {
    value: number;
    onChange: (val: number) => void;
    id: string;
    min?: number;
    max?: number;
    step?: number;
}) => {
    const [localValue, setLocalValue] = useState(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const commitValue = () => {
        if (localValue === '') return;

        let num = Number.parseFloat(localValue);

        if (Number.isNaN(num)) {
            setLocalValue(value.toString());
            return;
        }

        if (min !== undefined && num < min) num = min;
        if (max !== undefined && num > max) num = max;

        setLocalValue(num.toString());

        onChange(num);
    };

    const handleBlur = () => {
        commitValue();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <Input
            id={id}
            type="number"
            className={`col-span-2 h-8 text-xs bg-bg border-border text-text`}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step}
        />
    );
};
