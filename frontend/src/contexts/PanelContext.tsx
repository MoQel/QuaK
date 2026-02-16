import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { GateDefinitionResponse } from '@/api/dto/library';
import { CircuitResponse } from '@/api/dto/circuit';
import { File } from '@/views/project-manager-view/util/FileElement';

type PanelContextType = {
    file: File;
    openFile: (file: File) => void;
    circuit: CircuitResponse | null;
    setCircuit: (c: CircuitResponse | null) => void;
    selectedGate: GateDefinitionResponse | undefined;
    setSelectedGate: (g: GateDefinitionResponse | undefined) => void;
};

const PanelDataContext = createContext<PanelContextType | null>(null);

export const usePanelData = () => {
    const context = useContext(PanelDataContext);
    if (!context) throw new Error('Panel components must be used within PanelDataContext');
    return context;
};

// The Provider Component
export const PanelDataProvider = ({ children }: { children: ReactNode }) => {
    const [file, openFile] = useState(undefined as unknown as File);
    const [selectedGate, setSelectedGate] = useState<GateDefinitionResponse | undefined>(undefined);
    const [circuit, setCircuit] = useState<CircuitResponse | null>(null);

    const value = useMemo(
        () => ({
            file,
            openFile,
            circuit,
            setCircuit,
            selectedGate,
            setSelectedGate,
        }),
        [file, circuit, selectedGate],
    );

    return <PanelDataContext.Provider value={value}>{children}</PanelDataContext.Provider>;
};
