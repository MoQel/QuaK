import { configureStore } from "@reduxjs/toolkit";
import layoutReducer, { LayoutState } from "./slices/layoutSlice";

// --- 1. Load State from LocalStorage ---
const loadState = (): { layout: LayoutState } | undefined => {
    try {
        const serializedState = localStorage.getItem("ide-layout-settings");
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (err) {
        return undefined;
    }
};

// --- 2. Configure Store ---
export const store = configureStore({
    reducer: {
        layout: layoutReducer,
    },
    preloadedState: loadState(),
});

// --- 3. Save State to LocalStorage on Change ---
store.subscribe(() => {
    try {
        const state = store.getState();
        const stateToSave = {
            layout: state.layout
        };
        localStorage.setItem("ide-layout-settings", JSON.stringify(stateToSave));
    } catch (e) {
        console.warn("Could not save layout state to local storage", e);
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;