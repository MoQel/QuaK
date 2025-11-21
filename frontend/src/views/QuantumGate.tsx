import React from "react";
import {CircleGauge} from "lucide-react";
import {TextIcon} from "./TextIcon.tsx"

export type QuantumGate = {
    id: string,
    type: 'DUMMY' | 'H' | 'X' | 'Y' | 'Z' | 'CX' | 'CCX' | 'CZ' | 'SWAP' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'GPHASE' | 'MEASURE'
    matrix?: (number|string)[][]
}

export const GateIcons: Record<QuantumGate["type"], React.ElementType> = {
    DUMMY: TextIcon("dummy"),
    H: TextIcon("H"),
    X: TextIcon("X"),
    Y: TextIcon("Y"),
    Z: TextIcon("Z"),
    CX: TextIcon("CX"),
    CZ: TextIcon("CZ"),
    SWAP: TextIcon("SWAP"),
    CCX: TextIcon("CCX"),
    S: TextIcon("S"),
    T: TextIcon("T"),
    RX: TextIcon("RX"),
    RY: TextIcon("RY"),
    RZ: TextIcon("RZ"),
    GPHASE: TextIcon("GPHASE"),
    MEASURE: CircleGauge, // icon component, likewise TextIcons can be changed in the future
};

// Mapping: QASM gate name -> QuantumGate.type
export const gateMap: Record<string, QuantumGate["type"]> = {
    x: "X",
    h: "H",
    y: "Y",
    z: "Z",
    cx: "CX",
    ccx: "CCX",
    cz: "CZ",
    swap: "SWAP",
    s: "S",
    t: "T",
    rx: "RX",
    ry: "RY",
    rz: "RZ",
    gphase: "GPHASE",
    measure: "MEASURE"
};