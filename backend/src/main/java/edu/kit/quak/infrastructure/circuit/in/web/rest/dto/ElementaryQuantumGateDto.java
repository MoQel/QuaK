package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ElementaryQuantumGateDto extends QuantumOperationDto {
    private double rotationAngle;

    public ElementaryQuantumGateDto(
            String id,
            String identifier,
            boolean inverseForm,
            List<ElementSelectorDto> targetQubits,
            List<ElementSelectorDto> controlQubits,
            double rotationAngle) {
        super(id, identifier, inverseForm, targetQubits, controlQubits);
        this.rotationAngle = rotationAngle;
    }
}
