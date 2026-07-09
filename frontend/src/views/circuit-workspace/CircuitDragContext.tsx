import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface CircuitDragState {
    isOperationDragging: boolean;
    draggingOperationSize: number;
}

interface CircuitDragContextValue extends CircuitDragState {
    startOperationDrag: (operationSize: number) => void;
    stopOperationDrag: () => void;
}

const CircuitDragContext = createContext<CircuitDragContextValue | null>(null);

const initialState: CircuitDragState = {
    isOperationDragging: false,
    draggingOperationSize: 1,
};

export function CircuitDragProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [dragState, setDragState] = useState(initialState);

    const startOperationDrag = useCallback((draggingOperationSize: number) => {
        setDragState({ isOperationDragging: true, draggingOperationSize });
    }, []);

    const stopOperationDrag = useCallback(() => {
        setDragState((currentState) => ({ ...currentState, isOperationDragging: false }));
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
