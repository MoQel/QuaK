import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LayoutState {
    isMenubarVisible: boolean;
}

const initialState: LayoutState = {
    isMenubarVisible: false,
};

export const layoutSlice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        toggleMenubar: (state) => {
            state.isMenubarVisible = !state.isMenubarVisible;
        },
        setMenubarVisibility: (state, action: PayloadAction<boolean>) => {
            state.isMenubarVisible = action.payload;
        },
    },
});

export const { toggleMenubar, setMenubarVisibility } = layoutSlice.actions;
export default layoutSlice.reducer;
