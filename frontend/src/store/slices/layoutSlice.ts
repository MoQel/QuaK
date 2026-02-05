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
};

export const layoutSlice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        togglePanel: (state, action: PayloadAction<keyof LayoutState['visiblePanels']>) => {
            state.visiblePanels[action.payload] = !state.visiblePanels[action.payload];
        },
        resetLayout: () => initialState,

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
