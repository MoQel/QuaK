import { configureStore } from '@reduxjs/toolkit';
import layoutReducer, { LayoutState } from './slices/layoutSlice';
import tabsReducer from './tabs/tabsSlice.ts';

// --- 1. Load State from LocalStorage ---
const loadState = (): { layout: LayoutState } | undefined => {
    try {
        const serializedState = localStorage.getItem('ide-layout-settings');
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (e) {
        console.warn('Could not load state', e);
    }
};

// --- 2. Configure Store ---
export const store = configureStore({
    reducer: {
        layout: layoutReducer,
        tabs: tabsReducer,
    },
    preloadedState: loadState(),
});

const saveState = (state: RootState) => {
    try {
        const serializedState = JSON.stringify({ layout: state.layout });
        localStorage.setItem('ide-layout', serializedState);
    } catch (e) {
        console.warn('Could not save state', e);
    }
};

let debounceTimer: ReturnType<typeof setTimeout>;

store.subscribe(() => {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    const currentState = store.getState();

    debounceTimer = setTimeout(() => {
        saveState(currentState);
    }, 300);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
