package edu.kit.quak.application.circuit.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;

public interface CircuitServicePort {
    QuantumCircuit init();

    QuantumCircuit get(String circuitId);

    void delete(String circuitId);

    QuantumCircuit addQubit(String circuitId);

    QuantumCircuit changeQubitName(String circuitId, String qubitId, String name);

    QuantumCircuit deleteQubit(String circuitId, String qubitId);

    QuantumCircuit addGate(
            String circuitId,
            ElementaryQuantumGateDefinitionIdentifier definitionId,
            int qubitIdx,
            int positionIdx);

    QuantumCircuit moveGate(String circuitId, String id, int qubitIdx, int positionIdx);

    QuantumCircuit deleteGate(String circuitId, String gateId);
}
