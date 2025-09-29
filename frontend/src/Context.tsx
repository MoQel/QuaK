import { createContext, Dispatch, SetStateAction } from "react";
import { QuantumGate } from "@/views/QuantumGate.tsx";

type MatrixStateContextType = {
    setMatrixState: Dispatch<SetStateAction<QuantumGate[][]>>;
    matrixState: QuantumGate[][];
    removeGate: (gateId: string) => void; // 👈 added
};

export const matrixContext = createContext<MatrixStateContextType>({
    matrixState: [],
    setMatrixState: () => {
        throw new Error("matrixContext not initialized with a Provider");
    },
    removeGate: () => {
        throw new Error("matrixContext not initialized with a Provider");
    },
});
