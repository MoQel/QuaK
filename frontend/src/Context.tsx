import { createContext, Dispatch, SetStateAction } from "react";
import type { CircuitCell } from "./App"; // or better: from a shared types file

type MatrixStateContextType = {
    setMatrixState: Dispatch<SetStateAction<CircuitCell[][]>>;
    matrixState: CircuitCell[][];
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
