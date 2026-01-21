import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

export const Layout: React.FC = () => {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
