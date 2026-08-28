import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { cn } from '@/lib/utils.ts';

export function IdeSidebar() {
    const { projectName } = useProject();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                'flex h-full shrink-0 flex-col border-r border-border bg-bg-dark text-text transition-[width] duration-200 ease-out',
                collapsed ? 'w-[4.75rem]' : 'w-64',
            )}
        >
            <header
                className={cn(
                    'relative flex h-16 shrink-0 items-center gap-3 border-b border-border px-4',
                    collapsed && 'justify-center px-3',
                )}
            >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-special text-base font-bold text-white">
                    Q
                </div>
                {!collapsed && (
                    <span className="min-w-0 flex-1 truncate text-lg font-bold">{projectName ?? 'QuaK'}</span>
                )}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'size-8 text-text-muted hover:text-text',
                        collapsed && 'absolute left-[5.5rem] top-4',
                    )}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    onClick={() => setCollapsed((current) => !current)}
                >
                    {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                </Button>
            </header>

            <div className="flex-1" />
        </aside>
    );
}
