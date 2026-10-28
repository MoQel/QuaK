import { createContext, useContext } from 'react';
import { OperationDefinitionResponse, CircuitResponse } from '@quak/circuit-core';

export type PanelContextType = {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
    selectedOperation: OperationDefinitionResponse | undefined;
    setSelectedOperation: (op: OperationDefinitionResponse | undefined) => void;
};

export const PanelDataContext = createContext<PanelContextType | null>(null);

export const usePanelData = () => {
    const context = useContext(PanelDataContext);
    if (!context) throw new Error('Panel components must be used within PanelDataContext');
    return context;
};
