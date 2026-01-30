package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuantumRegisterResponse extends RegisterResponse {
    private int numberOfQubits;
}
