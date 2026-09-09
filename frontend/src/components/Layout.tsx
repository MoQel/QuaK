import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner.tsx';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { DockviewProvider } from '@/contexts/DockviewContext';
import { PanelDataProvider } from '@/contexts/panel/PanelDataProvider';
import { CircuitTabsProvider } from '@/contexts/CircuitTabsContext.tsx';

export const Layout: React.FC = () => {
    const { pathname } = useLocation();

    const isIDE = pathname.startsWith('/project');

    return (
        <ProjectProvider>
            <CircuitTabsProvider>
                <PanelDataProvider>
                    <DockviewProvider>
                        <div
                            className={isIDE ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen flex flex-col'}
                        >
                            <Navbar />

                            <main className={isIDE ? 'flex-1 min-h-0 overflow-hidden relative' : 'flex-1 w-full'}>
                                <Outlet />
                            </main>

                            <Toaster />
                        </div>
                    </DockviewProvider>
                </PanelDataProvider>
            </CircuitTabsProvider>
        </ProjectProvider>
    );
};

export default Layout;
