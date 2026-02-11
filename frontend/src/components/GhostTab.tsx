import { cn } from '@/lib/utils.ts';
import React from 'react';

export interface GhostTabProps {
    className?: string;
}

export const GhostTab = React.memo(({ className }: GhostTabProps) => {
    return <div className={cn('h-9 shrink-0 mx-0.5 w-32', 'pointer-events-none select-none', 'bg-bg', className)} />;
});
