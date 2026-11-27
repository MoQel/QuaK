package edu.kit.quak.core.qrisp.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import edu.kit.quak.core.qrisp.exceptions.InvalidQrispProgramException;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.Test;

/** A value is a literal number or a constant reference, never both and never neither. */
@UnitTest
class ValueTest {

    @Test
    void literalNumberHasNoConstant() {
        Value value = Value.of(0.5);

        assertEquals(0.5, value.number());
        assertNull(value.constantId());
    }

    @Test
    void constantReferenceHasNoNumber() {
        Value value = Value.ofConstant("c1");

        assertEquals("c1", value.constantId());
        assertNull(value.number());
    }

    @Test
    void wholeNumberIsStoredAsDouble() {
        assertEquals(3.0, Value.of(3).number());
    }

    @Test
    void rejectsNumberAndConstantTogether() {
        assertThrows(InvalidQrispProgramException.class, () -> new Value(1.0, "c1"));
    }

    @Test
    void rejectsNeitherNumberNorConstant() {
        assertThrows(InvalidQrispProgramException.class, () -> new Value(null, null));
    }

    @Test
    void rejectsMissingConstantId() {
        assertThrows(NullPointerException.class, () -> Value.ofConstant(null));
    }
}
