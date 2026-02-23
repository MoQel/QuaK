package edu.kit.quak.core.circuit.model.layer.operation;

import java.util.Objects;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class ElementSelector {
    private String registerId;
    private int index;

    public ElementSelector(@NonNull String registerId, int index) {
        this.registerId = registerId;
        this.index = index;
    }

    public void decreaseIndex() {
        index--;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ElementSelector that = (ElementSelector) o;
        return index == that.index && Objects.equals(registerId, that.registerId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(registerId, index);
    }
}
