import React from "react";
import {CircleGauge} from "lucide-react";
import {TextIcon} from "./TextIcon.tsx"
export type QuantumGate = {
    id: string,
    type: 'DUMMY' | 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'MEASURE'
}

export const GateIcons: Record<QuantumGate["type"], React.ElementType> = {
    DUMMY: TextIcon("dummy"),
    H: TextIcon("H"),
    X: TextIcon("X"),
    Y: TextIcon("Y"),
    Z: TextIcon("Z"),
    CNOT: TextIcon("CNOT"),
    S: TextIcon("S"),
    T: TextIcon("T"),
    RX: TextIcon("RX"),
    RY: TextIcon("RY"),
    RZ: TextIcon("RZ"),
    MEASURE: CircleGauge, // icon component
};