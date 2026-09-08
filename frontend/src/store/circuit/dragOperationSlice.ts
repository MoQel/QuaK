import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DragOperationState {
    isOperationDragging: boolean;
    draggingOperationSize: number;
    /**
     * Which wire of the dragged operation the pointer grabbed, counted from its topmost one.
     *
     * An operation is positioned by its top wire, so without this the box would jump downwards by
     * however far down it was grabbed, and the user would have to drag that much further up just to
     * keep it where it was. Dragging from the library has no such offset.
     */
    draggingGrabOffset: number;
}

const initialState: DragOperationState = {
    isOperationDragging: false,
    draggingOperationSize: 1,
    draggingGrabOffset: 0,
};

export const dragOperationSlice = createSlice({
    name: 'dragOperation',
    initialState,
    reducers: {
        startOperationDrag: (state, action: PayloadAction<number | { size: number; grabOffset: number }>) => {
            state.isOperationDragging = true;
            const { size, grabOffset } =
                typeof action.payload === 'number' ? { size: action.payload, grabOffset: 0 } : action.payload;
            state.draggingOperationSize = size;
            state.draggingGrabOffset = grabOffset;
        },
        stopOperationDrag: (state) => {
            state.isOperationDragging = false;
            state.draggingGrabOffset = 0;
        },
    },
});

export const { startOperationDrag, stopOperationDrag } = dragOperationSlice.actions;
export default dragOperationSlice.reducer;
