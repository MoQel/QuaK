import { CircuitResponse } from "@/api/dto/circuit.ts";
import {SimulationResult} from "@/simulation/simulation.types.ts";

// Action types
// Create new if we add more features (e.g. "STOP", "CALCULATE_GATE")
export type WorkerAction = 'CALCULATE_CIRCUIT';

export interface WorkerRequest {
    type: WorkerAction;
    requestId: number;
    circuit: CircuitResponse;
}

export type WorkerResponse =
    | { type: "SUCCESS"; requestId: number; payload: SimulationResult }
    | { type: "ERROR"; requestId: number; error: string };