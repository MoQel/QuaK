import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { IdeSidebar } from '@/components/sidebar/IdeSidebar.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { DockviewProvider } from '@/contexts/DockviewContext';
import { PanelDataProvider } from '@/contexts/panel/PanelDataProvider';
import { CircuitTabsProvider } from '@/contexts/CircuitTabsContext.tsx';
import { cn } from '@/lib/utils.ts';

export const Layout: React.FC = () => {
    const { pathname } = useLocation();

    const isIDE = pathname.startsWith('/project');

    return (
        <ProjectProvider>
            <CircuitTabsProvider>
                <PanelDataProvider>
                    <DockviewProvider>
                        <div
                            className={cn(
                                'flex bg-bg-dark',
                                isIDE ? 'h-screen overflow-hidden' : 'min-h-screen overflow-auto',
                            )}
                        >
                            <IdeSidebar />

                            <main
                                className={cn(
                                    'min-w-0 flex-1',
                                    isIDE ? 'min-h-0 overflow-hidden relative' : 'overflow-auto',
                                )}
                            >
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
