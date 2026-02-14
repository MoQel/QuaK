import { ArrowDownAZ, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import type { SortMode } from '../types';

export function SortSelect({ value, onChange }: { value: SortMode; onChange: (value: SortMode) => void }) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as SortMode)}>
            <SelectTrigger size="sm" className="min-w-[10rem]">
                <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="lastUsed">
                    <Clock className="size-4" />
                    Last used
                </SelectItem>
                <SelectItem value="alphabetical">
                    <ArrowDownAZ className="size-4" />
                    Alphabetical
                </SelectItem>
            </SelectContent>
        </Select>
    );
}
