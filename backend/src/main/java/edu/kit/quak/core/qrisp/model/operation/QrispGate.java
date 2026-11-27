package edu.kit.quak.core.qrisp.model.operation;

import edu.kit.quak.core.qrisp.exceptions.InvalidQrispProgramException;
import java.util.Arrays;
import java.util.stream.Collectors;
import lombok.Getter;

/**
 * The gates a Qrisp program may use.
 */
@Getter
public enum QrispGate {
    H("h", 0, 1, false),
    X("x", 0, 1, false),
    Y("y", 0, 1, false),
    Z("z", 0, 1, false),
    S("s", 0, 1, false),
    S_DG("s_dg", 0, 1, false),
    T("t", 0, 1, false),
    T_DG("t_dg", 0, 1, false),
    RX("rx", 0, 1, true),
    RY("ry", 0, 1, true),
    RZ("rz", 0, 1, true),
    CX("cx", 1, 1, false),
    CZ("cz", 1, 1, false),
    SWAP("swap", 0, 2, false),
    MCX("mcx", 1, 1, false);

    private final String qrispName;
    private final int controlArguments;
    private final int targetArguments;
    private final boolean takesAngle;

    QrispGate(String qrispName, int controlArguments, int targetArguments, boolean takesAngle) {
        this.qrispName = qrispName;
        this.controlArguments = controlArguments;
        this.targetArguments = targetArguments;
        this.takesAngle = takesAngle;
    }

    /**
     * Finds a gate by the name used in Qrisp code.
     *
     * @param qrispName the name of the gate in Qrisp code
     * @return the corresponding QrispGate
     * @throws InvalidQrispProgramException if Qrisp has no such gate in the supported subset
     */
    public static QrispGate fromQrispName(String qrispName) {
        return Arrays.stream(values())
            .filter(gate -> gate.qrispName.equals(qrispName))
            .findFirst()
            .orElseThrow(() ->
                new InvalidQrispProgramException(
                    "Unknown gate '%s'. Supported gates: %s.".formatted(
                        qrispName,
                        Arrays.stream(values()).map(QrispGate::getQrispName).collect(Collectors.joining(", "))
                    )
                )
            );
    }
}
