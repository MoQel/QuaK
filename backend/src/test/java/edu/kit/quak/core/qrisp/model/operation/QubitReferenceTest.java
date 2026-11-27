package edu.kit.quak.core.qrisp.model.operation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.Test;

@UnitTest
class QubitReferenceTest {

    @Test
    void singleQubit() {
        QubitReference reference = QubitReference.qubit("a", 0);

        assertEquals("a", reference.variableId());
        assertEquals(0, reference.index());
        assertFalse(reference.isWholeVariable());
    }

    @Test
    void wholeVariable() {
        QubitReference reference = QubitReference.wholeVariable("a");

        assertTrue(reference.isWholeVariable());
    }

    @Test
    void sameVariableAndIndexAreEqual() {
        assertEquals(QubitReference.qubit("a", 1), QubitReference.qubit("a", 1));
    }

    @Test
    void rejectsMissingVariable() {
        assertThrows(NullPointerException.class, () -> QubitReference.qubit(null, 0));
    }
}
