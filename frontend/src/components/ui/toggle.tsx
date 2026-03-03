import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';

function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
    return (
        <ToggleGroupPrimitive.Root
            data-slot="toggle-group"
            className={cn(
                // Container
                'inline-flex items-center rounded-md border border-border bg-bg',
                'p-0.5',
                'disabled:opacity-50 disabled:pointer-events-none',
                className,
            )}
            {...props}
        />
    );
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
    return (
        <ToggleGroupPrimitive.Item
            data-slot="toggle-group-item"
            className={cn(
                // Base
                'inline-flex items-center justify-center',
                'px-3 py-1.5 text-xs font-medium',
                'rounded-sm transition-colors',
                'outline-none select-none',

                // Default state
                'text-text-muted hover:bg-bg-light hover:text-text',

                // Active state
                'data-[state=on]:bg-bg-light data-[state=on]:text-text',

                // Focus
                'focus-visible:ring-2 focus-visible:ring-special focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark',

                // Disabled
                'disabled:pointer-events-none disabled:opacity-50',

                className,
            )}
            {...props}
        />
    );
}

export { ToggleGroup, ToggleGroupItem };
