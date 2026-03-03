package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeasurementDto extends QuantumOperationDto {

    private List<ElementSelectorDto> classicBits;

    public MeasurementDto(
        String id,
        String identifier,
        boolean inverseForm,
        List<ElementSelectorDto> targetQubits,
        List<ElementSelectorDto> controlQubits,
        List<ElementSelectorDto> classicBits
    ) {
        super(id, identifier, inverseForm, targetQubits, controlQubits);
        this.classicBits = classicBits;
    }
}
