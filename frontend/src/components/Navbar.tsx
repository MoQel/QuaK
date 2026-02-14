import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, User, Settings, LogOut, Menu, Pencil, Trash2 } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/useUser';
import ThemeSwitch from '@/components/ThemeSwitch';
import { Button } from '@/components/ui/button';
import { IdeMenubar } from '@/components/MenuBar';
import { useLayout } from '@/hooks/use-layout';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectActionsDialog } from '@/components/projects/useProjectActionsDialog.tsx';

export const Navbar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { user } = useCurrentUser();
    const { projectName, projectId, refreshProject } = useProject();

    const { dialog, openRenameProjectDialog, openDeleteProjectDialog } = useProjectActionsDialog();

    const { visiblePanels, isMenubarVisible, onToggleMenubar, onTogglePanel, onResetLayout } = useLayout();

    const isIdeView = location.pathname.startsWith('/project');

    const getActiveTab = () => {
        if (location.pathname === '/' || location.pathname.startsWith('/home')) {
            return 'home';
        } else if (location.pathname.startsWith('/project')) {
            return 'project';
        } else if (location.pathname.startsWith('/profile')) {
            return 'profile';
        } else if (location.pathname.startsWith('/settings')) {
            return 'settings';
        }
        return 'home';
    };

    return (
        <nav className="bg-bg-dark border-b border-border px-6 py-4 sticky top-0 z-50">
            {dialog}
            <div className="grid grid-cols-3 items-center">
                {/* Left section */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-logo-start to-logo-end bg-clip-text text-transparent">
                            QuaK
                        </h1>
                    </Link>

                    {isIdeView && (
                        <div className="flex items-center gap-2 border-l border-border pl-4 ml-2">
                            <Button
                                variant={isMenubarVisible ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onToggleMenubar()}
                            >
                                <Menu className="h-4 w-4" />
                            </Button>

                            {isMenubarVisible && (
                                <IdeMenubar
                                    visiblePanels={visiblePanels}
                                    togglePanel={(key) => onTogglePanel(key)}
                                    resetLayout={() => onResetLayout()}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Center section - Project Name */}
                <div className="flex justify-center">
                    {isIdeView && projectName && projectId && (
                        <div className="group flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">{projectName}</span>
                            <div className="flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Rename project"
                                    aria-label="Rename project"
                                    onClick={() =>
                                        openRenameProjectDialog(
                                            { id: projectId, name: projectName },
                                            { onRenamed: () => refreshProject() },
                                        )
                                    }
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    title="Delete project"
                                    aria-label="Delete project"
                                    onClick={() =>
                                        openDeleteProjectDialog(
                                            { id: projectId, name: projectName },
                                            { onDeleted: () => navigate('/') },
                                        )
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right section */}
                {user && (
                    <div className="flex items-center gap-4 justify-end flex-nowrap">
                        <Tabs value={getActiveTab()} className="w-auto shrink-0">
                            <TabsList>
                                <Link to="/">
                                    <TabsTrigger value="home" className="gap-2">
                                        <Home className="size-4" />
                                        Home
                                    </TabsTrigger>
                                </Link>
                                <Link to="/profile">
                                    <TabsTrigger value="profile" className="gap-2">
                                        <User className="size-4" />
                                        Profile
                                    </TabsTrigger>
                                </Link>
                                <Link to="/settings">
                                    <TabsTrigger value="settings" className="gap-2">
                                        <Settings className="size-4" />
                                        Settings
                                    </TabsTrigger>
                                </Link>
                            </TabsList>
                        </Tabs>
                        <ThemeSwitch />
                        <div className="flex items-center gap-3 shrink-0">
                            <UserAvatar avatarUrl={user.avatarUrl} alt={user.name} size="sm" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-text truncate">{user.name}</span>
                                <span className="text-xs text-text-muted truncate">{user.email}</span>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive-hover text-text border-border rounded-lg transition-colors duration-200 cursor-pointer"
                        >
                            <LogOut className="size-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
