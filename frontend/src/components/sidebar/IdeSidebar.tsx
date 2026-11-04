import {
    BarChart3,
    CircuitBoard,
    Code2,
    Folder,
    Home,
    LayoutGrid,
    LogOut,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    EllipsisVertical,
    Pencil,
    Search,
    Settings,
    Sun,
    Trash2,
    User,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@quak/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useDockview } from '@/contexts/DockviewContext.tsx';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { PANELS, PANEL_TITLES } from '@/lib/layout/layout-utils.ts';
import { cn } from '@quak/ui/lib/utils';
import { useProjectActionsDialog } from '@/components/projects/useProjectActionsDialog.tsx';
import { CreateProject } from '@/views/project-manager-view/ProjectManagerView.tsx';
import { ProjectSwitcher } from '@/components/sidebar/ProjectSwitcher.tsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useTheme } from '@/theme.tsx';

type PanelKey = keyof typeof PANELS;

type SidebarPanelItem = {
    id: PanelKey;
    icon: LucideIcon;
};

const PANEL_ITEMS: SidebarPanelItem[] = [
    { id: 'file', icon: Folder },
    { id: 'circuit', icon: CircuitBoard },
    { id: 'code', icon: Code2 },
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
    const isIdeView = pathname.startsWith('/project');
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { projectId, projectName, refreshProject } = useProject();
    const { dialog, openDeleteProjectDialog, openRenameProjectDialog } = useProjectActionsDialog();
    const { openPanels, togglePanel, resetLayout } = useDockview();
    const [createOpen, setCreateOpen] = useState(false);
    const { state, toggleSidebar } = useSidebar();
    const collapsed = state === 'collapsed';
    const isDark = theme === 'dark';
    const themeSwitchLabel = isDark ? 'Light Mode' : 'Dark Mode';
    const hasProject = isIdeView && !!projectId && !!projectName;

    return (
        <Sidebar collapsible="icon">
            {dialog}
            <CreateProject
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={(project) => navigate(`/project/${project.id}`)}
            />
            <SidebarHeader
                className={cn('shrink-0 border-b border-border py-4', collapsed ? 'items-center px-2' : 'px-4')}
            >
                <div className="flex items-center gap-2">
                    <Link
                        to="/"
                        aria-label="QuaK home"
                        title="Home"
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-special font-bold text-white shadow-sm hover:bg-special-hover"
                    >
                        Q
                    </Link>
                    {!collapsed && hasProject && (
                        <>
                            <ProjectSwitcher
                                projectId={projectId}
                                projectName={projectName}
                                onNewProject={() => setCreateOpen(true)}
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className={cn(HEADER_BUTTON_CLASS_NAME, 'ml-auto size-7')}
                                        aria-label="Project actions"
                                        title="Project actions"
                                    >
                                        <EllipsisVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            openRenameProjectDialog(
                                                { id: projectId, name: projectName },
                                                { onRenamed: () => refreshProject() },
                                            )
                                        }
                                    >
                                        <Pencil /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() =>
                                            openDeleteProjectDialog(
                                                { id: projectId, name: projectName },
                                                { onDeleted: () => navigate('/') },
                                            )
                                        }
                                    >
                                        <Trash2 /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                    {!collapsed && !hasProject && <span className="text-lg font-semibold">QuaK</span>}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size={collapsed ? 'icon' : 'sm'}
                    className={cn(
                        HEADER_BUTTON_CLASS_NAME,
                        collapsed ? 'size-8' : 'h-7 justify-start gap-2 px-2 text-xs',
                    )}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    onClick={toggleSidebar}
                >
                    {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                    {!collapsed && 'Collapse'}
                </Button>
            </SidebarHeader>

            <SidebarContent className="py-3">
                {isIdeView && (
                    <SidebarGroup>
                        <SidebarGroupLabel className={SECTION_LABEL_CLASS_NAME}>Panels</SidebarGroupLabel>
                        <SidebarMenu>
                            {PANEL_ITEMS.map((item) => {
                                const isOpen = openPanels.has(item.id);
                                const Icon = item.icon;
                                const title = `${PANEL_TITLES[item.id]} panel`;

                                return (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            className={menuButtonClassName()}
                                            isActive={isOpen}
                                            aria-pressed={isOpen}
                                            aria-label={title}
                                            tooltip={title}
                                            onClick={() => togglePanel(item.id)}
                                        >
                                            <Icon />
                                            {!collapsed && <span>{PANEL_TITLES[item.id]}</span>}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                            <SidebarMenuItem className="mt-1">
                                <SidebarMenuButton
                                    className={menuButtonClassName({ muted: true })}
                                    aria-label="Reset layout"
                                    tooltip="Reset layout"
                                    onClick={resetLayout}
                                >
                                    <LayoutGrid />
                                    {!collapsed && <span>Reset Layout</span>}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="shrink-0 gap-0 border-t border-border py-4">
                <SidebarGroup className="py-0">
                    <SidebarGroupLabel className={SECTION_LABEL_CLASS_NAME}>Navigation</SidebarGroupLabel>
                    <SidebarMenu>
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;

                            return (
                                <SidebarMenuItem key={item.to}>
                                    <SidebarMenuButton
                                        asChild
                                        className={menuButtonClassName({ muted: true })}
                                        isActive={item.isActive(pathname)}
                                        tooltip={item.label}
                                    >
                                        <Link to={item.to} aria-label={item.label}>
                                            <Icon />
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                        <SidebarMenuItem className="mt-1">
                            <SidebarMenuButton
                                className={menuButtonClassName({ muted: true })}
                                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                tooltip={themeSwitchLabel}
                                onClick={toggleTheme}
                            >
                                {isDark ? <Sun /> : <Moon />}
                                {!collapsed && <span>{themeSwitchLabel}</span>}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className={menuButtonClassName({ muted: true })}
                                aria-label="Logout"
                                tooltip="Logout"
                                onClick={logout}
                            >
                                <LogOut />
                                {!collapsed && <span>Logout</span>}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    );
}

const HEADER_BUTTON_CLASS_NAME = 'text-text-muted hover:bg-bg-light hover:text-text';

const SECTION_LABEL_CLASS_NAME = 'pointer-events-none px-3 pb-3 text-xs font-bold uppercase text-text-muted';

function menuButtonClassName({ muted = false }: { muted?: boolean } = {}) {
    return cn(
        'h-10 gap-3 px-3 font-medium text-sidebar-foreground [&>svg]:size-5',
        'group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center',
        'data-[active=true]:text-special data-[active=true]:before:absolute data-[active=true]:before:bottom-2 data-[active=true]:before:left-0 data-[active=true]:before:top-2 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-special',
        muted && 'text-text-muted hover:text-text',
    );
}
