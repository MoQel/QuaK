import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DragOperationState {
    isOperationDragging: boolean;
    draggingOperationSize: number;
}

const initialState: DragOperationState = {
    isOperationDragging: false,
    draggingOperationSize: 1,
};

export const dragOperationSlice = createSlice({
    name: 'dragOperation',
    initialState,
    reducers: {
        startOperationDrag: (state, action: PayloadAction<number>) => {
            state.isOperationDragging = true;
            state.draggingOperationSize = action.payload;
        },
        stopOperationDrag: (state) => {
            state.isOperationDragging = false;
        },
    },
});

export const { startOperationDrag, stopOperationDrag } = dragOperationSlice.actions;
export default dragOperationSlice.reducer;
