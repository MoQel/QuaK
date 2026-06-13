package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.library.ConcreteQuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class ElementaryQuantumGate extends QuantumOperation {

    private double rotationAngle;

    public ElementaryQuantumGate(
        @NonNull QuantumOperationLibrary operationDefinition,
        boolean inverseForm,
        @NonNull List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits,
        double rotationAngle
    ) {
        super(operationDefinition, inverseForm, targetQubits, controlQubits);
        this.rotationAngle = rotationAngle;
        if (operationDefinition.getDefinition().getType() != getClass()) {
            throw new InvalidOperationConfigurationException(
                "Operation type mismatch: expected %s but got %s".formatted(getClass(), operationDefinition.getDefinition().getType())
            );
        }
    }

    @Override
    protected String operatorToCode(QuantumCircuit quantumCircuit) {
        String operatorCode = super.operatorToCode(quantumCircuit);
        if (operationDefinition.getDefinition() instanceof ConcreteQuantumOperation<?> definition && definition.isHasRotationAngle()) {
            return operatorCode + "(" + formatAngle(rotationAngle) + ")";
        }
        return operatorCode;
    }

    /**
     * Formatiert den Winkel für QASM. Rationale Vielfache von pi werden symbolisch ausgegeben
     * (z.B. "pi/2", "-pi/4", "2*pi/3"), ansonsten als Dezimalzahl.
     */
    private static String formatAngle(double angle) {
        if (!Double.isFinite(angle)) {
            // Guard against emitting non-QASM tokens like "Infinity"/"NaN"; fall back to a neutral angle.
            return "0";
        }
        if (angle == 0.0) {
            return "0";
        }
        String piTerm = tryFormatAsPiMultiple(angle);
        if (piTerm != null) {
            return piTerm;
        }
        if (angle == Math.rint(angle) && !Double.isInfinite(angle)) {
            return Long.toString((long) angle);
        }
        return Double.toString(angle);
    }

    /**
     * Versucht, den Winkel als rationales Vielfaches von pi darzustellen (Nenner bis 12).
     * Liefert {@code null}, wenn keine passende Darstellung gefunden wird.
     */
    private static String tryFormatAsPiMultiple(double angle) {
        final double epsilon = 1e-9;
        double ratio = angle / Math.PI;
        for (int denominator = 1; denominator <= 12; denominator++) {
            double scaled = ratio * denominator;
            long numerator = Math.round(scaled);
            if (numerator != 0 && Math.abs(scaled - numerator) < epsilon) {
                long gcd = gcd(Math.abs(numerator), denominator);
                return buildPiTerm(numerator / gcd, denominator / gcd);
            }
        }
        return null;
    }

    private static String buildPiTerm(long numerator, long denominator) {
        StringBuilder sb = new StringBuilder();
        if (numerator < 0) {
            sb.append("-");
            numerator = -numerator;
        }
        sb.append(numerator == 1 ? "pi" : numerator + "*pi");
        if (denominator != 1) {
            sb.append("/").append(denominator);
        }
        return sb.toString();
    }

    private static long gcd(long a, long b) {
        while (b != 0) {
            long temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    @Override
    public String toString() {
        return String.format("[ElementaryQuantumGate: %s (quantumOperationId=%s)]", getOperationDefinition(), getId());
    }
}
