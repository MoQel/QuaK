import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            className={cn('flex flex-col gap-2', className)}
            {...props}
        />
    );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                'inline-flex h-12 w-fit items-center justify-center rounded-lg p-1 text-text',
                className,
            )}
            {...props}
        />
    );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            className={cn(
                `
        cursor-pointer
        inline-flex h-[calc(100%-8px)] flex-1 items-center justify-center gap-2
        rounded-md border border-transparent px-4 py-2 text-base font-medium
        whitespace-nowrap transition-all

        text-text
        hover:text-text-muted

        data-[state=active]:bg-bg
        data-[state=active]:text-text
        data-[state=active]:shadow-md

        focus-visible:border-border
        focus-visible:ring-border
        focus-visible:outline-border
        focus-visible:ring-[3px]
        focus-visible:outline-1

        disabled:pointer-events-none
        disabled:opacity-50

        [&_svg]:pointer-events-none
        [&_svg]:shrink-0
        [&_svg:not([class*='size-'])]:size-5
        `,
                className,
            )}
            {...props}
        />
    );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            className={cn('flex-1 outline-none', className)}
            {...props}
        />
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
