import { useState } from 'react';
import {
    BarChart3,
    CircuitBoard,
    Code2,
    Folder,
    Library,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { useDockview } from '@/contexts/DockviewContext.tsx';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { PANELS, PANEL_TITLES } from '@/lib/layout/layout-utils.ts';
import { cn } from '@/lib/utils.ts';

type PanelKey = keyof typeof PANELS;

type SidebarPanelItem = {
    id: PanelKey;
    icon: LucideIcon;
};

const PANEL_ITEMS: SidebarPanelItem[] = [
    { id: 'file', icon: Folder },
    { id: 'circuit', icon: CircuitBoard },
    { id: 'code', icon: Code2 },
    { id: 'library', icon: Library },
    { id: 'inspector', icon: Search },
    { id: 'results', icon: BarChart3 },
];

export function IdeSidebar() {
    const { projectName } = useProject();
    const { openPanels, togglePanel } = useDockview();
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

            <nav className="flex-1 overflow-y-auto px-3 py-5">
                {!collapsed && <div className="px-3 pb-3 text-xs font-bold uppercase text-text-muted">Panels</div>}
                <ul className="space-y-1">
                    {PANEL_ITEMS.map((item) => {
                        const isOpen = openPanels.has(item.id);
                        const Icon = item.icon;
                        const title = `${PANEL_TITLES[item.id]} panel`;

                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={cn(
                                        'flex h-10 w-full items-center rounded-md text-sm font-medium transition-colors',
                                        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                                        isOpen ? 'bg-bg text-special' : 'text-text hover:bg-bg hover:text-special',
                                    )}
                                    aria-pressed={isOpen}
                                    aria-label={title}
                                    title={collapsed ? title : undefined}
                                    onClick={() => togglePanel(item.id)}
                                >
                                    <Icon className="size-5 shrink-0" />
                                    {!collapsed && <span className="truncate">{PANEL_TITLES[item.id]}</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
