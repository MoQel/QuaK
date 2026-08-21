package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubcircuitOperationDto extends QuantumOperationDto {

    private String definitionCircuitId;

    public SubcircuitOperationDto(
        String id,
        String identifier,
        boolean inverseForm,
        List<ElementSelectorDto> targetQubits,
        List<ElementSelectorDto> controlQubits,
        String definitionCircuitId
    ) {
        super(id, identifier, inverseForm, targetQubits, controlQubits);
        this.definitionCircuitId = definitionCircuitId;
    }
}
