import { configureStore } from '@reduxjs/toolkit';
import tabsReducer from './tabs/tabsSlice';
import dragOperationReducer from './circuit/dragOperationSlice';

// --- 2. Configure Store ---
export const store = configureStore({
    reducer: {
        tabs: tabsReducer,
        dragOperation: dragOperationReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
