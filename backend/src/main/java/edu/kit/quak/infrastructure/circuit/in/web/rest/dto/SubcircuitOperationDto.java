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

    /**
     * What the referenced circuit does, in this call's qubits.
     *
     * <p>Derived on every read like the name, because the referenced circuit can change under a
     * call that stores only its id. It is what lets a consumer look inside: the simulator expands
     * it, and without it a subcircuit could only be reported as unsupported.
     *
     * <p>Empty when the contents cannot be expressed in the caller's qubits -- see
     * {@code SubcircuitBinding}. Half a body would run a circuit the file does not describe, so
     * nothing is offered instead.
     */
    private List<QuantumOperationDto> body;

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
