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
import { api } from '@/api/api.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';

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
                // Get circuit for project.
                loader: async ({ params }) => {
                    return api.get<CircuitResponse>(`/api/circuit/${params.projectId}`);
                },
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
