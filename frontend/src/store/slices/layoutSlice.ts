import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LayoutState {
    visiblePanels: {
        file: boolean;
        circuit: boolean;
        code: boolean;
        results: boolean;
        inspector: boolean;
        library: boolean;
    };
    topLayout: number[];
    bottomLayout: number[];
    isMenubarVisible: boolean;
    layoutResetVersion: number;
}

const initialState: LayoutState = {
    visiblePanels: {
        file: true,
        circuit: true,
        code: true,
        results: true,
        inspector: true,
        library: true,
    },
    topLayout: [20, 50, 30],
    bottomLayout: [33, 34, 33],
    isMenubarVisible: false,
    layoutResetVersion: 0,
};

export const layoutSlice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        togglePanel: (state, action: PayloadAction<keyof LayoutState['visiblePanels']>) => {
            state.visiblePanels[action.payload] = !state.visiblePanels[action.payload];
        },
        resetLayout: (state) => {
            // Restore defaults
            state.visiblePanels = initialState.visiblePanels;
            state.topLayout = initialState.topLayout;
            state.bottomLayout = initialState.bottomLayout;
            // INCREMENT THIS to signal App.tsx
            state.layoutResetVersion += 1;
        },
        toggleMenubar: (state) => {
            state.isMenubarVisible = !state.isMenubarVisible;
        },
        setMenubarVisibility: (state, action: PayloadAction<boolean>) => {
            state.isMenubarVisible = action.payload;
        },
    },
});

export const { togglePanel, resetLayout, toggleMenubar, setMenubarVisibility } = layoutSlice.actions;
export default layoutSlice.reducer;
