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

    /**
     * The 0-based indices of the subcircuit's qubits mapped to the call's targetQubits.
     */
    private List<Integer> subcircuitQubitIndices;

    /**
     * An explanatory message if the subcircuit could not be bound (e.g. linked to unmapped qubits).
     */
    private String bindingError;

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

    @com.fasterxml.jackson.annotation.JsonCreator
    @edu.kit.quak.shared.annotations.Default
    public SubcircuitOperationDto(
        @com.fasterxml.jackson.annotation.JsonProperty("id") String id,
        @com.fasterxml.jackson.annotation.JsonProperty("identifier") String identifier,
        @com.fasterxml.jackson.annotation.JsonProperty("inverseForm") boolean inverseForm,
        @com.fasterxml.jackson.annotation.JsonProperty("targetQubits") List<ElementSelectorDto> targetQubits,
        @com.fasterxml.jackson.annotation.JsonProperty("controlQubits") List<ElementSelectorDto> controlQubits,
        @com.fasterxml.jackson.annotation.JsonProperty("definitionCircuitId") String definitionCircuitId,
        @com.fasterxml.jackson.annotation.JsonProperty("subcircuitQubitIndices") List<Integer> subcircuitQubitIndices
    ) {
        super(id, identifier, inverseForm, targetQubits, controlQubits);
        this.definitionCircuitId = definitionCircuitId;
        this.subcircuitQubitIndices = subcircuitQubitIndices;
    }
}
