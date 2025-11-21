import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, User, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location.pathname === '/' || location.pathname.startsWith('/home')) {
      return 'home';
    } else if (location.pathname.startsWith('/profile')) {
      return 'profile';
    } else if (location.pathname.startsWith('/settings')) {
      return 'settings';
    }
    return 'home';
  };

  return (
    <nav className="bg-background border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-blue-500 bg-clip-text text-transparent">
            QuaK
          </h1>
        </Link>

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
      </div>
    </nav>
  );
};

export default Navbar;
