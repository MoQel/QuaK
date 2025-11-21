import { createBrowserRouter, RouteObject } from 'react-router-dom';
import Project from './App';
import LogIn from './pages/LogIn';
import Home from './pages/Home.tsx';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LogIn />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'project',
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
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);

