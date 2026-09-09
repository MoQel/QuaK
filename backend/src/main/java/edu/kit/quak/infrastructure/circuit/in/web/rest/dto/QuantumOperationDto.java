package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    {
        @JsonSubTypes.Type(value = ElementaryQuantumGateDto.class, name = "ELEMENTARY_QUANTUM_GATE"),
        @JsonSubTypes.Type(value = MeasurementDto.class, name = "MEASUREMENT"),
        @JsonSubTypes.Type(value = SubcircuitOperationDto.class, name = "SUBCIRCUIT_OPERATION"),
        @JsonSubTypes.Type(value = CompositeQuantumGateDto.class, name = "COMPOSITE_QUANTUM_GATE"),
    }
)
@Getter
@Setter
public abstract class QuantumOperationDto {

    // Accepted in requests so operations keep a stable identity across full-replace
    // saves; ids colliding with another circuit are rejected in CircuitService.
    protected String id;

    protected String identifier;
    protected boolean inverseForm;
    protected List<ElementSelectorDto> targetQubits;
    protected List<ElementSelectorDto> controlQubits;

    protected QuantumOperationDto(
        String id,
        String identifier,
        boolean inverseForm,
        List<ElementSelectorDto> targetQubits,
        List<ElementSelectorDto> controlQubits
    ) {
        this.id = id;
        this.identifier = identifier;
        this.inverseForm = inverseForm;
        this.targetQubits = targetQubits;
        this.controlQubits = controlQubits;
    }
}
