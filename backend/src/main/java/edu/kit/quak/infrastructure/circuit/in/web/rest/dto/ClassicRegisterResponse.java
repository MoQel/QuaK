package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClassicRegisterResponse extends RegisterResponse {
    private int numberOfBits;
}
