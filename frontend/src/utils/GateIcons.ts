import React from "react";
import {TextIcon} from "@/views/TextIcon.tsx";
import {CircleGauge} from "lucide-react";
import {QuantumGate} from "@/views/QuantumGate.tsx";

export const GateIcons: Record<QuantumGate["type"], React.ElementType> = {
    PLACEHOLDER: TextIcon(""),
    H: TextIcon("H"),
    X: TextIcon("X"),
    Y: TextIcon("Y"),
    Z: TextIcon("Z"),
    CNOT: TextIcon("CNOT"),
    CZ: TextIcon("CZ"),
    SWAP: TextIcon("SWAP"),
    CCX: TextIcon("CCX"),
    S: TextIcon("S"),
    T: TextIcon("T"),
    RX: TextIcon("RX"),
    RY: TextIcon("RY"),
    RZ: TextIcon("RZ"),
    MEASURE: CircleGauge, // icon component, likewise TextIcons can be changed in the future
};