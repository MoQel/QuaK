import { createContext, useContext } from 'react';
import { OperationDefinitionResponse } from '@/api/dto/library';
import { CircuitResponse } from '@/api/dto/circuit';

export type PanelContextType = {
    circuit: CircuitResponse | null;
    setCircuit: (c: CircuitResponse | null) => void;
    selectedOperation: OperationDefinitionResponse | undefined;
    setSelectedOperation: (op: OperationDefinitionResponse | undefined) => void;
};

export const PanelDataContext = createContext<PanelContextType | null>(null);

export const usePanelData = () => {
    const context = useContext(PanelDataContext);
    if (!context) throw new Error('Panel components must be used within PanelDataContext');
    return context;
};
