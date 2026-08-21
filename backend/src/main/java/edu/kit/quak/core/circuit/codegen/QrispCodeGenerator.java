package edu.kit.quak.core.circuit.codegen;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.ConcreteQuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class QrispCodeGenerator {

    public static String toCode(QuantumCircuit quantumCircuit) {
        StringBuilder codeStringBuilder = new StringBuilder();

        // Qrisp Python Header - wir importieren die benötigten Funktionen und Abstraktionen
        codeStringBuilder.append(
            "from qrisp import QuantumVariable, h, x, y, z, cx, cz, swap, mcx, s, s_dg, t, t_dg, rx, ry, rz, measure\n"
        );
        codeStringBuilder.append("import math\n\n");

        List<Register> registers = quantumCircuit.getRegisters();
        for (Register register : registers) {
            if (register instanceof QuantumRegister quantumRegister) {
                String regName = quantumRegister.getName();
                codeStringBuilder.append("# QuantumVariable ").append(regName).append("\n");
                codeStringBuilder
                    .append(regName)
                    .append(" = QuantumVariable(")
                    .append(quantumRegister.getNumberOfQubits())
                    .append(", name='")
                    .append(regName)
                    .append("')\n");
            }
            // TODO classical register?
        }

        codeStringBuilder.append("\n");

        List<Layer> layers = quantumCircuit.getLayers();
        for (int layerIdx = 0; layerIdx < layers.size(); layerIdx++) {
            Layer layer = layers.get(layerIdx);
            codeStringBuilder.append("# Layer ").append(layerIdx + 1).append("\n");
            codeStringBuilder.append(toCode(quantumCircuit, layer)).append("\n");
        }

        return codeStringBuilder.toString();
    }

    private static String toCode(QuantumCircuit quantumCircuit, Layer layer) {
        StringBuilder codeStringBuilder = new StringBuilder();
        // Emit operations in canonical order
        List<QuantumOperation> quantumOperations = layer.getQuantumOperations();
        List<QuantumOperation> sortedOperations = quantumOperations
            .stream()
            .sorted(Comparator.comparingInt(QrispCodeGenerator::minInvolvedQubitIndex))
            .toList();
        for (QuantumOperation operation : sortedOperations) {
            codeStringBuilder.append(toCode(quantumCircuit, operation)).append("\n");
        }
        return codeStringBuilder.toString();
    }

    private static int minInvolvedQubitIndex(QuantumOperation quantumOperation) {
        int min = Integer.MAX_VALUE;
        for (ElementSelector selector : quantumOperation.getTargetQubits()) {
            min = Math.min(min, selector.getIndex());
        }
        if (quantumOperation.getControlQubits() != null) {
            for (ElementSelector selector : quantumOperation.getControlQubits()) {
                min = Math.min(min, selector.getIndex());
            }
        }
        return min;
    }

    private static String toCode(QuantumCircuit quantumCircuit, QuantumOperation quantumOperation) {
        StringBuilder codeStringBuilder = new StringBuilder();

        // Operator Name (wird in Qrisp direkt als Funktion aufgerufen)
        String operatorCode = getOperatorMethodName(quantumOperation);
        codeStringBuilder.append(operatorCode).append("(");

        List<String> args = new ArrayList<>();

        // 1. Parameter / Winkel (in Qrisp i.d.R. erstes Argument)
        if (quantumOperation instanceof ElementaryQuantumGate elementaryQuantumGate) {
            QuantumOperationLibrary operationDefinition = elementaryQuantumGate.getOperationDefinition();
            if (operationDefinition.getDefinition() instanceof ConcreteQuantumOperation<?> definition && definition.isHasRotationAngle()) {
                double angle = elementaryQuantumGate.getRotationAngle();
                if (quantumOperation.isInverseForm()) {
                    angle = -angle;
                }
                args.add(formatAngle(angle));
            }
        }

        List<String> controls = new ArrayList<>();
        if (quantumOperation.getControlQubits() != null) {
            for (ElementSelector control : quantumOperation.getControlQubits()) {
                controls.add(toCode(quantumCircuit, control));
            }
        }

        List<String> targets = new ArrayList<>();
        for (ElementSelector target : quantumOperation.getTargetQubits()) {
            targets.add(toCode(quantumCircuit, target));
        }

        // Qrisp verwendet oft mcx([control1, control2, ...], target) für Multi-Control-Gates
        if (operatorCode.equals("mcx") && !controls.isEmpty()) {
            args.add("[" + String.join(", ", controls) + "]");
            args.addAll(targets);
        } else {
            args.addAll(controls);
            args.addAll(targets);
        }

        codeStringBuilder.append(String.join(", ", args)).append(")");

        return codeStringBuilder.toString();
    }

    private static String getOperatorMethodName(QuantumOperation quantumOperation) {
        // operationDefinition sitzt seit der Composite-Einfuehrung pro Subklasse: nur Operationen mit
        // Library-Definition haben eine. Ein Subcircuit hat keine und wird hier nicht abgebildet.
        QuantumOperationLibrary operationDefinition;
        if (quantumOperation instanceof ElementaryQuantumGate elementaryQuantumGate) {
            operationDefinition = elementaryQuantumGate.getOperationDefinition();
        } else if (quantumOperation instanceof Measurement measurement) {
            operationDefinition = measurement.getOperationDefinition();
        } else {
            return "";
        }
        String operatorCode = toCode(operationDefinition);

        if (quantumOperation.isInverseForm()) {
            switch (operatorCode) {
                case "s":
                    return "s_dg";
                case "t":
                    return "t_dg";
                // R-Rotationen werden über negativen Winkel im toCode() umgesetzt
            }
        }

        // Qrisp mappt CCX-Gatter vorzugsweise auf mcx
        if (operatorCode.equals("ccx")) {
            return "mcx";
        }

        return operatorCode;
    }

    private static final double CONSTANT_MATCH_EPSILON = 1e-9;

    private static String formatAngle(double angle) {
        if (!Double.isFinite(angle)) {
            return "0";
        }
        if (angle == 0.0) {
            return "0";
        }
        String namedConstant = tryFormatAsNamedConstant(angle);
        if (namedConstant != null) {
            return namedConstant;
        }
        String piTerm = tryFormatAsPiMultiple(angle);
        if (piTerm != null) {
            return piTerm;
        }
        if (angle == Math.rint(angle)) {
            return Long.toString((long) angle);
        }
        return Double.toString(angle);
    }

    private static String tryFormatAsNamedConstant(double angle) {
        if (Math.abs(angle - Math.TAU) < CONSTANT_MATCH_EPSILON) {
            return "math.tau";
        }
        if (Math.abs(angle + Math.TAU) < CONSTANT_MATCH_EPSILON) {
            return "-math.tau";
        }
        if (Math.abs(angle - Math.E) < CONSTANT_MATCH_EPSILON) {
            return "math.e";
        }
        if (Math.abs(angle + Math.E) < CONSTANT_MATCH_EPSILON) {
            return "-math.e";
        }
        return null;
    }

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
        sb.append(numerator == 1 ? "math.pi" : numerator + "*math.pi");
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

    private static String toCode(QuantumOperationLibrary quantumOperation) {
        return switch (quantumOperation) {
            case H -> "h";
            case X -> "x";
            case Y -> "y";
            case Z -> "z";
            case CX -> "cx";
            case CZ -> "cz";
            case SWAP -> "swap";
            case CCX -> "ccx"; // Wird im getOperatorMethodName nach "mcx" umgeleitet
            case S -> "s";
            case T -> "t";
            case RX -> "rx";
            case RY -> "ry";
            case RZ -> "rz";
            case MEASURE -> "measure";
            // User-defined gates have no Qrisp equivalent here; expand them before generating.
            case COMPOSITE -> throw new IllegalStateException("Composite gates are not supported by the Qrisp generator yet.");
        };
    }

    private static String toCode(QuantumCircuit quantumCircuit, ElementSelector elementSelector) {
        String name = quantumCircuit.getQuantumRegisterNameById(elementSelector.getRegisterId());
        // Qrisp QuantumVariables lassen sich genauso mit Listenindizierung zugreifen wie Qiskit Register
        return name + "[" + elementSelector.getIndex() + "]";
    }
}
