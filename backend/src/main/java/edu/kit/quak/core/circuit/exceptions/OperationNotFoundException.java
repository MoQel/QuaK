package edu.kit.quak.core.circuit.exceptions;

public class OperationNotFoundException extends CircuitComponentNotFoundException {

    public OperationNotFoundException(String operationId) {
        super("Operation", operationId);
    }
}
