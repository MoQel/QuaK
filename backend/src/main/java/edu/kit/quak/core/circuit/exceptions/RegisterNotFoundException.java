package edu.kit.quak.core.circuit.exceptions;

public class RegisterNotFoundException extends CircuitComponentNotFoundException {

    public RegisterNotFoundException(String registerId) {
        super("Register", registerId);
    }
}
