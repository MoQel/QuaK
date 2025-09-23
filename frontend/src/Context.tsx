import {createContext, Dispatch, SetStateAction} from "react";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";

export const setMatrixStateContext = createContext<Dispatch<SetStateAction<QuantumGate[][]>> | null>(null);