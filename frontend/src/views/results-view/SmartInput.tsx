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
        const newVal = e.target.value;
        setLocalValue(newVal);

        if (newVal === '') return;

        const num = parseInt(newVal);
        if (!isNaN(num)) {
            onChange(num);
        }
    };

    const handleBlur = () => {
        const num = parseInt(localValue);
        if (isNaN(num) || localValue === '') {
            setLocalValue(value.toString());
        } else {
            let finalVal = num;
            if (min !== undefined && finalVal < min) finalVal = min;
            if (max !== undefined && finalVal > max) finalVal = max;

            if (finalVal !== num) {
                setLocalValue(finalVal.toString());
                onChange(finalVal);
            }
        }
    };

    return (
        <Input
            id={id}
            type="number"
            className="col-span-2 h-8 text-xs bg-bg border-border text-text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            min={min}
            max={max}
            step={step}
        />
    );
};
