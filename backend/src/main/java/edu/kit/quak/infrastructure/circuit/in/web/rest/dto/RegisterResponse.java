package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.Setter;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = QuantumRegisterResponse.class, name = "Quantum_Register"),
    @JsonSubTypes.Type(value = ClassicRegisterResponse.class, name = "Classic_Register")
})
@Getter
@Setter
public abstract class RegisterResponse {
    protected String id;
    protected String name;
}
