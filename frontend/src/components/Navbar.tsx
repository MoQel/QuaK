import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, User, Settings, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/useUser';
import ThemeSwitch from '@/components/ThemeSwitch';
import { Button } from '@/components/ui/button';
import { IdeMenubar } from '@/components/MenuBar';
import { useLayout } from '@/hooks/use-layout';

export const Navbar: React.FC = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const { user } = useCurrentUser();

    const {
        visiblePanels,
        isMenubarVisible,
        onToggleMenubar,
        onTogglePanel,
        onResetLayout
    } = useLayout();

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
        <nav className="bg-bg-dark border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-50">
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

            {user && (
                <div className="flex items-center gap-4">
                    <Tabs value={getActiveTab()} className="w-auto">
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
                    <div className="flex items-center gap-3">
                        {user.avatarUrl && (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-9 h-9 rounded-full border-2 border-blue-500"
                            />
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-text">{user.name}</span>
                            <span className="text-xs text-text-muted">{user.email}</span>
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
        </nav>
    );
};

export default Navbar;
