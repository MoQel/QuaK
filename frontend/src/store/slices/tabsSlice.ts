import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Tab {
    id: string; // Unique file id
    title: string; // Filename
    viewport: 'code' | 'circuit';
}

export interface TabsState {
    openTabs: Tab[];
    activeTabId: string | null;
}

const initialState: TabsState = {
    openTabs: [],
    activeTabId: null,
};

export const tabsSlice = createSlice({
    name: 'tabs',
    initialState,
    reducers: {
        openTab: (state, action: PayloadAction<Tab>) => {
            const exists = state.openTabs.find((t) => t.id === action.payload.id);
            if (!exists) {
                state.openTabs.push(action.payload);
            }
            state.activeTabId = action.payload.id;
        },
        closeTab: (state, action: PayloadAction<string>) => {
            const index = state.openTabs.findIndex((t) => t.id === action.payload);
            state.openTabs = state.openTabs.filter((t) => t.id !== action.payload);

            // Focus logic: if closed tab was active, focus the previous one
            if (state.activeTabId === action.payload) {
                const nextTab = state.openTabs[index - 1] || state.openTabs[0];
                state.activeTabId = nextTab ? nextTab.id : null;
            }
        },
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTabId = action.payload;
        },
    },
});

export const { openTab, closeTab, setActiveTab } = tabsSlice.actions;
export default tabsSlice.reducer;
