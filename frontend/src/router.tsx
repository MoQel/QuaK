import { createBrowserRouter, RouteObject, useLocation } from 'react-router-dom';
import Project from './App';
import LandingPage from './pages/LandingPageAlternative';
import LogIn from './pages/LogIn';
import Home from './pages/Home.tsx';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Keep the application's original URLs while making the home URL public to visitors.
function LandingOrApplication() {
    const { isAuthenticated, isLoading } = useAuth();
    const { pathname } = useLocation();

    if (pathname === '/' && !isLoading && !isAuthenticated) {
        return <LandingPage />;
    }

    return (
        <ProtectedRoute>
            <Layout />
        </ProtectedRoute>
    );
}

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
                <LandingOrApplication />
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
