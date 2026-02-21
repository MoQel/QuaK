import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { DockviewProvider } from '@/contexts/DockviewContext';

export const Layout: React.FC = () => {
    const { pathname } = useLocation();

    const isIDE = pathname.startsWith('/project');

    const content = (
        <div className={isIDE ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen flex flex-col'}>
            <Navbar />

            <main className={isIDE ? 'flex-1 min-h-0 overflow-hidden relative' : 'flex-1 w-full'}>
                <Outlet />
            </main>
        </div>
    );

    return isIDE ? <DockviewProvider>{content}</DockviewProvider> : content;
};

export default Layout;
