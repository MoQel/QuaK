import { createContext, useContext } from 'react';
import { GateDefinitionResponse } from '@/api/dto/library';
import { CircuitResponse } from '@/api/dto/circuit';

export type PanelContextType = {
    circuit: CircuitResponse | null;
    setCircuit: (c: CircuitResponse | null) => void;
    selectedGate: GateDefinitionResponse | undefined;
    setSelectedGate: (g: GateDefinitionResponse | undefined) => void;
};

export const PanelDataContext = createContext<PanelContextType | null>(null);

export const usePanelData = () => {
    const context = useContext(PanelDataContext);
    if (!context) throw new Error('Panel components must be used within PanelDataContext');
    return context;
};
