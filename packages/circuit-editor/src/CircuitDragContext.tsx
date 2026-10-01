import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface CircuitDragState {
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

interface CircuitDragContextValue extends CircuitDragState {
    startOperationDrag: (drag: number | { size: number; grabOffset: number }) => void;
    stopOperationDrag: () => void;
}

const CircuitDragContext = createContext<CircuitDragContextValue | null>(null);

const initialState: CircuitDragState = {
    isOperationDragging: false,
    draggingOperationSize: 1,
    draggingGrabOffset: 0,
};

export function CircuitDragProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [dragState, setDragState] = useState(initialState);

    const startOperationDrag = useCallback((drag: number | { size: number; grabOffset: number }) => {
        const { size, grabOffset } = typeof drag === 'number' ? { size: drag, grabOffset: 0 } : drag;
        setDragState({ isOperationDragging: true, draggingOperationSize: size, draggingGrabOffset: grabOffset });
    }, []);

    const stopOperationDrag = useCallback(() => {
        setDragState((currentState) => ({ ...currentState, isOperationDragging: false, draggingGrabOffset: 0 }));
    }, []);

    const value = useMemo(
        () => ({ ...dragState, startOperationDrag, stopOperationDrag }),
        [dragState, startOperationDrag, stopOperationDrag],
    );

    return <CircuitDragContext.Provider value={value}>{children}</CircuitDragContext.Provider>;
}

export function useCircuitDrag() {
    const context = useContext(CircuitDragContext);
    if (!context) throw new Error('useCircuitDrag must be used within CircuitDragProvider');
    return context;
}
