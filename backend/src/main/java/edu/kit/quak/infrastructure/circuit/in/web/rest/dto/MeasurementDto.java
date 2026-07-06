package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
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
        validateMeasurementConfiguration(targetQubits, inverseForm, controlQubits, classicBits);
        this.classicBits = classicBits;
    }

    private static void validateMeasurementConfiguration(
        List<ElementSelectorDto> targetQubits,
        boolean inverseForm,
        List<ElementSelectorDto> controlQubits,
        List<ElementSelectorDto> classicBits
    ) {
        if (targetQubits == null || targetQubits.size() != 1) {
            throw new InvalidOperationConfigurationException("A measurement operation must target exactly one qubit.");
        }
        if (inverseForm) {
            throw new InvalidOperationConfigurationException("A measurement operation cannot be inverted.");
        }
        if (controlQubits != null && !controlQubits.isEmpty()) {
            throw new InvalidOperationConfigurationException("A measurement operation cannot be controlled.");
        }
        if (classicBits == null || classicBits.isEmpty()) {
            throw new InvalidOperationConfigurationException("A measurement operation must assign its result to at least one classic bit.");
        }
    }
}
