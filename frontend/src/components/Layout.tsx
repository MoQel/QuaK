import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

export const Layout: React.FC = () => {
    const { pathname } = useLocation();

    // Adjust this to match your IDE route
    const isIDE = pathname.startsWith('/project'); // <-- change to e.g. "/ide" or "/editor"

    return (
        <div className={isIDE ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen flex flex-col'}>
            <Navbar />

            {/* Key part: for IDE, main becomes a fixed-height box under navbar */}
            <main className={isIDE ? 'flex-1 min-h-0 overflow-hidden relative' : 'flex-1 w-full'}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
