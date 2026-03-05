import { createBrowserRouter, RouteObject } from 'react-router-dom';
import Project from './App';
import LogIn from './pages/LogIn';
import Home from './pages/Home.tsx';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const routes: RouteObject[] = [
    {
        path: '/login',
        element: (
            <AuthProvider>
                <LogIn />
            </AuthProvider>
        ),
    },
    {
        path: '/',
        element: (
            <AuthProvider>
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            </AuthProvider>
        ),
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'project/:projectId',
                element: <Project />,
            },
            {
                path: 'profile',
                element: <Profile />,
            },
            {
                path: 'settings',
                element: <Settings />,
            },
        ],
    },
    {
        path: '*',
        element: (
            <AuthProvider>
                <NotFound />
            </AuthProvider>
        ),
    },
];

export const router = createBrowserRouter(routes);
