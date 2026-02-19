import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.tsx';
import { ThemeProvider } from '@/theme';
import { Provider } from 'react-redux';
import { store } from '@/store/store.ts';

// Enable dark mode globally
//document.documentElement.classList.add('dark');
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <ThemeProvider>
                <RouterProvider router={router} />
            </ThemeProvider>
        </Provider>
    </StrictMode>,
);
