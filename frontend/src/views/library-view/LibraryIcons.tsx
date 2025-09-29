import React from "react";
import {TextIcon} from "@/views/TextIcon.tsx";
import {CircleGauge} from "lucide-react";
import {QuantumGate} from "@/views/QuantumGate.tsx";

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