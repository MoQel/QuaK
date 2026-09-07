import { type ReactNode, useState } from 'react';
import {
    BarChart3,
    CircuitBoard,
    Code2,
    Folder,
    Home,
    Library,
    LogOut,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    Pencil,
    Search,
    Settings,
    Sun,
    Trash2,
    User,
    type LucideIcon,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useDockview } from '@/contexts/DockviewContext.tsx';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { useCurrentUser } from '@/hooks/useUser.ts';
import { PANELS, PANEL_TITLES } from '@/lib/layout/layout-utils.ts';
import { cn } from '@/lib/utils.ts';
import { useProjectActionsDialog } from '@/components/projects/useProjectActionsDialog.tsx';
import { useTheme } from '@/theme.tsx';

type PanelKey = keyof typeof PANELS;

type SidebarPanelItem = {
    id: PanelKey;
    icon: LucideIcon;
};

type SidebarItemStyleOptions = {
    active?: boolean;
    collapsed: boolean;
    muted?: boolean;
};

const PANEL_ITEMS: SidebarPanelItem[] = [
    { id: 'file', icon: Folder },
    { id: 'circuit', icon: CircuitBoard },
    { id: 'code', icon: Code2 },
    { id: 'library', icon: Library },
    { id: 'inspector', icon: Search },
    { id: 'results', icon: BarChart3 },
];

const NAV_ITEMS = [
    { label: 'Home', to: '/', icon: Home, isActive: (pathname: string) => pathname === '/' },
    { label: 'Profile', to: '/profile', icon: User, isActive: (pathname: string) => pathname.startsWith('/profile') },
    {
        label: 'Settings',
        to: '/settings',
        icon: Settings,
        isActive: (pathname: string) => pathname.startsWith('/settings'),
    },
];

export function IdeSidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { projectId, projectName, refreshProject } = useProject();
    const { user } = useCurrentUser();
    const { dialog, openDeleteProjectDialog, openRenameProjectDialog } = useProjectActionsDialog();
    const { openPanels, togglePanel } = useDockview();
    const [collapsed, setCollapsed] = useState(false);
    const isDark = theme === 'dark';
    const projectTitle = projectName ?? 'QuaK';

    return (
        <aside
            className={cn(
                'flex h-full shrink-0 flex-col border-r border-border bg-bg-subtle text-text transition-[width] duration-200 ease-out',
                collapsed ? 'w-16' : 'w-72',
            )}
        >
            {dialog}
            <header
                className={cn(
                    'flex shrink-0 items-center border-b border-border',
                    collapsed ? 'h-20 flex-col justify-center gap-2 px-2' : 'h-20 gap-3 px-5',
                )}
            >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-special text-base font-bold text-white shadow-sm">
                    Q
                </div>
                {!collapsed && (
                    <>
                        <span className="min-w-0 flex-1 truncate text-lg font-semibold">{projectTitle}</span>
                        {projectId && projectName && (
                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-text-muted hover:bg-bg-light hover:text-text"
                                    aria-label="Rename project"
                                    title="Rename project"
                                    onClick={() =>
                                        openRenameProjectDialog(
                                            { id: projectId, name: projectName },
                                            { onRenamed: () => refreshProject() },
                                        )
                                    }
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-destructive-text hover:bg-destructive/20 hover:text-destructive-text"
                                    aria-label="Delete project"
                                    title="Delete project"
                                    onClick={() =>
                                        openDeleteProjectDialog(
                                            { id: projectId, name: projectName },
                                            { onDeleted: () => navigate('/') },
                                        )
                                    }
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn('size-8 text-text-muted hover:bg-bg-light hover:text-text', !collapsed && 'ml-auto')}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    onClick={() => setCollapsed((current) => !current)}
                >
                    {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                </Button>
            </header>

            <nav className="flex-1 overflow-y-auto px-2 py-5">
                <SidebarSectionLabel collapsed={collapsed}>Panels</SidebarSectionLabel>
                <ul className="space-y-1">
                    {PANEL_ITEMS.map((item) => {
                        const isOpen = openPanels.has(item.id);
                        const Icon = item.icon;
                        const title = `${PANEL_TITLES[item.id]} panel`;

                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={sidebarItemClassName({ active: isOpen, collapsed })}
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

            <footer className="shrink-0 border-t border-border px-2 py-4">
                <SidebarSectionLabel collapsed={collapsed}>Navigation</SidebarSectionLabel>
                <ul className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = item.isActive(pathname);

                        return (
                            <li key={item.to}>
                                <Link
                                    to={item.to}
                                    className={sidebarItemClassName({ active, collapsed, muted: true })}
                                    aria-label={item.label}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <Icon className="size-5 shrink-0" />
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-4 space-y-1">
                    <button
                        type="button"
                        className={sidebarItemClassName({ collapsed, muted: true })}
                        aria-label="Toggle dark mode"
                        aria-pressed={isDark}
                        title={collapsed ? 'Dark Mode' : undefined}
                        onClick={toggleTheme}
                    >
                        {isDark ? <Moon className="size-5 shrink-0" /> : <Sun className="size-5 shrink-0" />}
                        {!collapsed && (
                            <>
                                <span className="min-w-0 flex-1 truncate text-left">Dark Mode</span>
                                <span
                                    className={cn(
                                        'relative h-6 w-11 rounded-full bg-bg-light transition-colors shadow-inner',
                                        isDark && 'bg-special',
                                    )}
                                    aria-hidden="true"
                                >
                                    <span
                                        className={cn(
                                            'absolute left-1 top-1 size-4 rounded-full bg-white transition-transform',
                                            isDark && 'translate-x-5',
                                        )}
                                    />
                                </span>
                            </>
                        )}
                    </button>

                    {user && !collapsed && (
                        <div className="px-3 py-2 text-xs text-text-muted">
                            <div className="truncate font-semibold text-text">{user.name}</div>
                            <div className="truncate">{user.email}</div>
                        </div>
                    )}

                    <button
                        type="button"
                        className={sidebarItemClassName({ collapsed, muted: true })}
                        aria-label="Logout"
                        title={collapsed ? 'Logout' : undefined}
                        onClick={logout}
                    >
                        <LogOut className="size-5 shrink-0" />
                        {!collapsed && <span className="truncate">Logout</span>}
                    </button>
                </div>
            </footer>
        </aside>
    );
}

function sidebarItemClassName({ active = false, collapsed, muted = false }: SidebarItemStyleOptions) {
    return cn(
        'relative flex h-10 w-full items-center rounded-md text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-special/60',
        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
        active
            ? 'bg-bg text-special before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-special'
            : muted
              ? 'text-text-muted hover:bg-bg hover:text-text'
              : 'text-text hover:bg-bg',
    );
}

function SidebarSectionLabel({ children, collapsed }: Readonly<{ children: ReactNode; collapsed: boolean }>) {
    if (collapsed) return null;

    return <div className="px-3 pb-3 text-xs font-bold uppercase text-text-muted">{children}</div>;
}
