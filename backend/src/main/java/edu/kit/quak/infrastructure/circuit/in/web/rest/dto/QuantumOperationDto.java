package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = ElementaryQuantumGateDto.class, name = "ELEMENTARY_QUANTUM_GATE"),
    @JsonSubTypes.Type(value = MeasurementDto.class, name = "MEASUREMENT")
})
@Getter
@Setter
public abstract class QuantumOperationDto {
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    protected String id; // Is only returned within response, not expected within request.

    protected String identifier;
    protected boolean inverseForm;
    protected List<ElementSelectorDto> targetQubits;
    protected List<ElementSelectorDto> controlQubits;

    protected QuantumOperationDto(
            String id,
            String identifier,
            boolean inverseForm,
            List<ElementSelectorDto> targetQubits,
            List<ElementSelectorDto> controlQubits) {
        this.id = id;
        this.identifier = identifier;
        this.inverseForm = inverseForm;
        this.targetQubits = targetQubits;
        this.controlQubits = controlQubits;
    }
}
