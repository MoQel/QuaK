package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubcircuitOperationDto extends QuantumOperationDto {

    private String definitionCircuitId;

    /**
     * Name of the referenced circuit's file, for display only.
     *
     * <p>Derived on every read instead of stored, so renaming the file cannot leave a stale name
     * behind. Null when the reference cannot be resolved - the editor then falls back to the id.
     */
    private String definitionName;

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
