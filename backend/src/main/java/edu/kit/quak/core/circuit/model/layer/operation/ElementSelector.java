package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.model.ElementWithId;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class ElementSelector extends ElementWithId {
    private String registerId;
    private int index;

    public ElementSelector(@NonNull String registerId, int index) {
        super();
        this.registerId = registerId;
        this.index = index;
    }
}
