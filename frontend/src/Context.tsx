import {createContext, Dispatch, SetStateAction} from "react";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";

type MatrixStateContextType = {
    setMatrixState: Dispatch<SetStateAction<QuantumGate[][]>>;
    matrixState: QuantumGate[][];
};

export const matrixContext = createContext<MatrixStateContextType | null>(null);
