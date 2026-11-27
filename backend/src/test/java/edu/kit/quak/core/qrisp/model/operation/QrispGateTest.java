package edu.kit.quak.core.qrisp.model.operation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.core.qrisp.exceptions.InvalidQrispProgramException;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.EnumSet;
import org.junit.jupiter.api.Test;

/** The gate set of the agreed Qrisp subset, and how gates are found by their Qrisp name. */
@UnitTest
class QrispGateTest {

    // Test fromQrispName()
    @Test
    void findsGateByQrispName() {
        assertEquals(QrispGate.S_DG, QrispGate.fromQrispName("s_dg"));
    }

    @Test
    void everyGateIsFoundByItsOwnName() {
        for (QrispGate gate : QrispGate.values()) {
            assertEquals(gate, QrispGate.fromQrispName(gate.getQrispName()));
        }
    }

    @Test
    void unknownNameGivesErrorThatNamesIt() {
        InvalidQrispProgramException error = assertThrows(InvalidQrispProgramException.class, () -> QrispGate.fromQrispName("ccx"));

        assertTrue(
            error
                .getMessage()
                .contains("Unknown gate 'ccx'. Supported gates: h, x, y, z, s, s_dg, t, t_dg, rx, ry, rz, cx, cz, swap, mcx."),
            error.getMessage()
        );
    }

    // Test Rotation Gates
    @Test
    void onlyRotationsTakeAnAngle() {
        EnumSet<QrispGate> rotations = EnumSet.of(QrispGate.RX, QrispGate.RY, QrispGate.RZ);

        for (QrispGate gate : QrispGate.values()) {
            assertEquals(rotations.contains(gate), gate.isTakesAngle(), gate.name());
        }
    }

    // Test Single Qubit Gates
    @Test
    void singleQubitGatesHaveNoControlAndOneTarget() {
        EnumSet<QrispGate> multiQubitGates = EnumSet.of(QrispGate.CX, QrispGate.CZ, QrispGate.SWAP, QrispGate.MCX);

        //Test the single-qubit gates:
        for (QrispGate gate : EnumSet.complementOf(multiQubitGates)) {
            assertEquals(0, gate.getControlArguments(), gate.name());
            assertEquals(1, gate.getTargetArguments(), gate.name());
        }
    }

    // Test Multi Qubit Gates
    @Test
    void cxAndCzHaveOneControlAndOneTarget() {
        for (QrispGate gate : EnumSet.of(QrispGate.CX, QrispGate.CZ)) {
            assertEquals(1, gate.getControlArguments(), gate.name());
            assertEquals(1, gate.getTargetArguments(), gate.name());
        }
    }

    @Test
    void swapHasTwoTargetsAndNoControl() {
        assertEquals(0, QrispGate.SWAP.getControlArguments());
        assertEquals(2, QrispGate.SWAP.getTargetArguments());
    }

    @Test
    void mcxHasOneControlArgumentAndOneTarget() {
        assertEquals(1, QrispGate.MCX.getControlArguments());
        assertEquals(1, QrispGate.MCX.getTargetArguments());
    }
}
