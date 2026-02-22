import { useMemo, useState, ReactNode } from 'react';
import { GateDefinitionResponse } from '@/api/dto/library';
import { CircuitResponse } from '@/api/dto/circuit';
import { PanelDataContext } from '@/contexts/panel/PanelDataContext';

export const PanelDataProvider = ({ children }: { children: ReactNode }) => {
    const [selectedGate, setSelectedGate] = useState<GateDefinitionResponse | undefined>(undefined);
    const [circuit, setCircuit] = useState<CircuitResponse | null>(null);

    const value = useMemo(
        () => ({
            circuit,
            setCircuit,
            selectedGate,
            setSelectedGate,
        }),
        [circuit, selectedGate],
    );

    return <PanelDataContext.Provider value={value}>{children}</PanelDataContext.Provider>;
};
