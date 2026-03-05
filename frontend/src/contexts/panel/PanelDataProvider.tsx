import { useMemo, useState, ReactNode } from 'react';
import { OperationDefinitionResponse } from '@/api/dto/library';
import { CircuitResponse } from '@/api/dto/circuit';
import { PanelDataContext } from '@/contexts/panel/PanelDataContext';

export const PanelDataProvider = ({ children }: { children: ReactNode }) => {
    const [selectedOperation, setSelectedOperation] = useState<OperationDefinitionResponse | undefined>(undefined);
    const [circuit, setCircuit] = useState<CircuitResponse | undefined>(undefined);

    const value = useMemo(
        () => ({
            selectedOperation,
            setSelectedOperation,
            circuit,
            setCircuit,
        }),
        [circuit, selectedOperation],
    );

    return <PanelDataContext.Provider value={value}>{children}</PanelDataContext.Provider>;
};
