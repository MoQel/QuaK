import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Tab {
    id: string; // Unique file id
    title: string; // Filename
}

export interface TabsState {
    openTabs: Tab[];
    activeTabId: string | null;
    lastSaveRequest: { fileId: string | null; timestamp: number };
    lastLanguageRequest: { fileId: string | null; langId: string | null; timestamp: number };
}

const initialState: TabsState = {
    openTabs: [],
    activeTabId: null,
    lastSaveRequest: { fileId: null, timestamp: 0 },
    lastLanguageRequest: { fileId: null, langId: null, timestamp: 0 },
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
        closeOthers: (state, action: PayloadAction<string>) => {
            const targetId = action.payload;
            state.openTabs = state.openTabs.filter((t) => t.id === targetId);
            state.activeTabId = targetId;
        },
        closeAll: () => initialState,
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTabId = action.payload;
        },
        requestLanguageChange: (state, action: PayloadAction<{ fileId: string; langId: string }>) => {
            state.lastLanguageRequest = {
                ...action.payload,
                timestamp: Date.now(),
            };
        },
        requestSave: (state, action: PayloadAction<string>) => {
            state.lastSaveRequest = {
                fileId: action.payload,
                timestamp: Date.now(),
            };
        },
    },
});

export const { openTab, closeTab, closeOthers, closeAll, setActiveTab, requestLanguageChange, requestSave } =
    tabsSlice.actions;
export default tabsSlice.reducer;
