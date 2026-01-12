package edu.kit.quak.application.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;

public interface CircuitServicePort {
    QuantumCircuit init();
    QuantumCircuit get(String circuitId);
    void delete(String circuitId);

    QuantumCircuit addQubit(String circuitId);
    QuantumCircuit deleteQubit(String circuitId, String qubitId);

    QuantumCircuit addGate(String circuitId, ElementaryQuantumGateType type, int qubitIdx, int positionIdx);
    QuantumCircuit moveGate(String circuitId, String id, int qubitIdx, int positionIdx);
    QuantumCircuit deleteGate(String circuitId, String gateId);
}
