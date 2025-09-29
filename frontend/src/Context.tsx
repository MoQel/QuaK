import {createContext, Dispatch, SetStateAction} from "react";
import {QuantumGate} from "@/views/circuit-view/QuantumGate.tsx";

type MatrixStateContextType = {
    setMatrixState: Dispatch<SetStateAction<QuantumGate[][]>>;
    matrixState: QuantumGate[][];
};

export const matrixContext = createContext<MatrixStateContextType>({
    matrixState: [],
    setMatrixState: () => {
        throw new Error("matrixContext not initialized with a Provider");
    },
});