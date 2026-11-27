package edu.kit.quak.core.qrisp.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.Test;

@UnitTest
class ClassicalConstantTest {

    @Test
    void keepsIdNameAndValue() {
        ClassicalConstant constant = new ClassicalConstant("c1", "angle", 0.5);

        assertEquals("c1", constant.getId());
        assertEquals("angle", constant.getName());
        assertEquals(0.5, constant.getValue());
    }

    @Test
    void rejectsMissingId() {
        assertThrows(NullPointerException.class, () -> new ClassicalConstant(null, "angle", 0.5));
    }

    @Test
    void rejectsMissingName() {
        assertThrows(NullPointerException.class, () -> new ClassicalConstant("c1", null, 0.5));
    }
}
