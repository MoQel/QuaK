package edu.kit.quak.core.circuit.codegen;

import edu.kit.quak.core.circuit.model.LoopBlock;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.gate.GateDefinition;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.ConcreteQuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

public class QasmCodeGenerator {

    /**
     * How to write a qubit and which name each user-defined gate is declared under.
     *
     * <p>Qubit naming differs by where the code is being written: in the circuit a selector is
     * {@code q[0]}, inside a {@code gate} body the very same selector points at the definition's
     * formal parameters and has to come out as {@code a}. The gate names are looked up rather than
     * taken from the definition because two definitions can carry the same name (see
     * {@link #assignGateNames}).
     */
    private record Emission(Function<ElementSelector, String> qubitName, Map<String, String> gateNames) {}

    public static String toCode(QuantumCircuit quantumCircuit) {
        StringBuilder codeStringBuilder = new StringBuilder();

        List<Register> registers = quantumCircuit.getRegisters();
        for (Register register : registers) {
            if (register instanceof QuantumRegister quantumRegister) {
                codeStringBuilder.append("// Register ").append(quantumRegister.getName()).append("\n");
                codeStringBuilder
                    .append("qubit[")
                    .append(quantumRegister.getNumberOfQubits())
                    .append("] ")
                    .append(quantumRegister.getName())
                    .append(";\n");
            }
            // TODO classical register?
        }

        codeStringBuilder.append("\n");

        // Declarations first: the parser records a `gate` when it reaches it, so a call before its
        // declaration fails. Without this the emitted code referred to gates it never defined, and a
        // parse -> toCode -> parse round trip died on "Unsupported gate".
        List<String> declarations = new ArrayList<>();
        Map<String, String> gateNames = assignGateNames(collectDefinitions(quantumCircuit), declarations);
        for (String declaration : declarations) {
            codeStringBuilder.append(declaration).append("\n");
        }

        Emission emission = new Emission(selector -> toCode(quantumCircuit, selector), gateNames);
        // A frame's members are written out as one `for`, at the position of its first member; the
        // rest are skipped when their layer comes round, which is what `written` keeps track of.
        Frames frames = new Frames(quantumCircuit.getLoopBlocks(), operationsById(quantumCircuit), new HashSet<>());

        List<Layer> layers = quantumCircuit.getLayers();
        for (int layerIdx = 0; layerIdx < layers.size(); layerIdx++) {
            String layerCode = toCode(layers.get(layerIdx), emission, frames);
            // A layer holding nothing but members of a frame written earlier contributes no code;
            // its heading would just dangle.
            if (layerCode.isEmpty()) {
                continue;
            }
            codeStringBuilder.append("// Layer ").append(layerIdx + 1).append("\n");
            codeStringBuilder.append(layerCode).append("\n");
        }

        return codeStringBuilder.toString();
    }

    /** Repetition frames plus the bookkeeping needed to write each of their members exactly once. */
    private record Frames(List<LoopBlock> blocks, Map<String, QuantumOperation> byId, Set<String> written) {
        Frames nestedIn(LoopBlock block) {
            return new Frames(
                blocks
                    .stream()
                    .filter(candidate -> candidate.isStrictlyInside(block))
                    .toList(),
                byId,
                written
            );
        }
    }

    private static Map<String, QuantumOperation> operationsById(QuantumCircuit quantumCircuit) {
        Map<String, QuantumOperation> byId = new HashMap<>();
        for (Layer layer : quantumCircuit.getLayers()) {
            for (QuantumOperation operation : layer.getQuantumOperations()) {
                byId.put(operation.getId(), operation);
            }
        }
        return byId;
    }

    /**
     * Writes one operation — or, when it is the first member of a repetition frame, the whole
     * {@code for} loop that frame stands for.
     *
     * <p>The frame is written where its first member sits, which is correct because the scheduler
     * keeps a frame's rectangle to itself: anything sharing one of its columns lies outside its
     * wires and therefore commutes with everything inside.
     *
     * <p>Several frames over the very same operations become nested {@code for} loops, so the body
     * runs the product of their counts — the same reading the simulator takes.
     */
    private static String statementFor(QuantumOperation operation, Emission emission, Frames frames, int depth) {
        if (frames.written().contains(operation.getId())) {
            return "";
        }

        List<LoopBlock> enclosing = LoopBlock.outermostCovering(frames.blocks(), operation.getId());
        if (enclosing.isEmpty()) {
            frames.written().add(operation.getId());
            return indent(depth) + toCode(operation, emission) + "\n";
        }

        LoopBlock block = enclosing.getFirst();
        List<QuantumOperation> members = block
            .getOperationIds()
            .stream()
            .map(frames.byId()::get)
            .filter(java.util.Objects::nonNull)
            .toList();

        StringBuilder body = new StringBuilder();
        Frames inner = frames.nestedIn(block);
        for (QuantumOperation member : members) {
            body.append(statementFor(member, emission, inner, depth + enclosing.size()));
        }
        members.forEach(member -> frames.written().add(member.getId()));

        String code = body.toString();
        for (int level = enclosing.size() - 1; level >= 0; level--) {
            code = wrapInLoop(code, enclosing.get(level).getRepeatCount(), depth + level);
        }
        return code;
    }

    private static String wrapInLoop(String body, int repeatCount, int depth) {
        // Inclusive stop, so [0:n-1] is exactly n passes. The counter is unused — the body is the
        // same every time, which is the very reason this is a frame and not an unrolled sweep.
        return "%sfor uint %s in [0:%d] {\n%s%s}\n".formatted(indent(depth), loopVariable(depth), repeatCount - 1, body, indent(depth));
    }

    private static String loopVariable(int depth) {
        return depth < LOOP_VARIABLES.length() ? String.valueOf(LOOP_VARIABLES.charAt(depth)) : "i" + depth;
    }

    private static final String LOOP_VARIABLES = "ijklmn";

    private static String indent(int depth) {
        return "    ".repeat(depth);
    }

    /**
     * The user-defined gates the circuit uses, dependencies before their users.
     *
     * <p>A gate body may call further gates, and OpenQASM needs those declared first, so this is a
     * depth-first walk that appends a definition only after everything it builds on. Termination is
     * guaranteed by {@link GateDefinition}, which rejects a recursive body.
     */
    private static List<GateDefinition> collectDefinitions(QuantumCircuit quantumCircuit) {
        List<GateDefinition> ordered = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        for (Layer layer : quantumCircuit.getLayers()) {
            for (QuantumOperation operation : layer.getQuantumOperations()) {
                collectDefinitions(operation, ordered, visited);
            }
        }
        return ordered;
    }

    private static void collectDefinitions(QuantumOperation operation, List<GateDefinition> ordered, Set<String> visited) {
        if (!(operation instanceof CompositeQuantumGate composite)) {
            return;
        }
        GateDefinition definition = composite.getDefinition();
        if (!visited.add(definition.getId())) {
            return;
        }
        for (QuantumOperation bodyOperation : definition.getBody()) {
            collectDefinitions(bodyOperation, ordered, visited);
        }
        ordered.add(definition);
    }

    /**
     * Decides under which name each definition is declared, and renders the declarations.
     *
     * <p>Two things force this indirection instead of just using {@code definition.getName()}.
     * Reading a circuit back from the database rebuilds a definition per call site, so the same gate
     * arrives as several equal definitions — declaring each would be "gate defined more than once".
     * And a gate parametrized by an angle produces one definition per argument value, all carrying
     * the same name but different bodies — declaring only the first would silently change the
     * circuit. Identical definitions therefore collapse onto one declaration, and genuinely
     * different ones with the same name get a suffix.
     *
     * @param definitions dependencies first, so a nested gate's name is already known here
     * @param declarations receives the rendered {@code gate ... { ... }} blocks, in emission order
     * @return the name to write at a call site, by definition id
     */
    private static Map<String, String> assignGateNames(List<GateDefinition> definitions, List<String> declarations) {
        Map<String, String> nameByDefinition = new HashMap<>();
        Map<String, String> nameByShape = new HashMap<>();
        Set<String> takenNames = builtInGateNames();

        for (GateDefinition definition : definitions) {
            String body = declarationBody(definition, nameByDefinition);
            String shape = definition.getParameterNames() + "|" + body;

            String sameShape = nameByShape.get(shape);
            if (sameShape != null) {
                nameByDefinition.put(definition.getId(), sameShape);
                continue;
            }

            String name = uniqueName(definition.getName(), takenNames);
            takenNames.add(name);
            nameByShape.put(shape, name);
            nameByDefinition.put(definition.getId(), name);
            declarations.add("gate %s %s {\n%s}\n".formatted(name, String.join(", ", definition.getParameterNames()), body));
        }
        return nameByDefinition;
    }

    /** Built-in gate names, so a user-defined gate can never be declared over one of them. */
    private static Set<String> builtInGateNames() {
        return Arrays.stream(QuantumOperationLibrary.values())
            .filter(gate -> gate != QuantumOperationLibrary.COMPOSITE)
            .map(QasmCodeGenerator::toCode)
            .collect(java.util.stream.Collectors.toCollection(HashSet::new));
    }

    private static String uniqueName(String preferred, Set<String> taken) {
        if (!taken.contains(preferred)) {
            return preferred;
        }
        int suffix = 2;
        while (taken.contains(preferred + "_" + suffix)) {
            suffix++;
        }
        return preferred + "_" + suffix;
    }

    /**
     * The statements of a gate body, in program order.
     *
     * <p>Deliberately not sorted by qubit the way a layer is: a body is a sequence, and reordering it
     * would change what the gate does.
     */
    private static String declarationBody(GateDefinition definition, Map<String, String> gateNames) {
        Emission emission = new Emission(selector -> definition.getParameterName(selector.getIndex()), gateNames);
        StringBuilder body = new StringBuilder();
        for (QuantumOperation operation : definition.getBody()) {
            body.append("    ").append(toCode(operation, emission)).append("\n");
        }
        return body.toString();
    }

    private static String toCode(Layer layer, Emission emission, Frames frames) {
        //TODO rotation angle aus Elementary holen falls vorhanden
        StringBuilder codeStringBuilder = new StringBuilder();
        // Emit operations in canonical order (topmost involved qubit first) so that
        // generating code and re-parsing it yields a stable circuit layout.
        List<QuantumOperation> quantumOperations = layer.getQuantumOperations();
        List<QuantumOperation> sortedOperations = quantumOperations
            .stream()
            .sorted(Comparator.comparingInt(QasmCodeGenerator::minInvolvedQubitIndex))
            .toList();
        for (QuantumOperation operation : sortedOperations) {
            codeStringBuilder.append(statementFor(operation, emission, frames, 0));
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

    private static String toCode(QuantumOperation quantumOperation, Emission emission) {
        StringBuilder codeStringBuilder = new StringBuilder();

        // Prefix
        if (quantumOperation.isInverseForm()) {
            codeStringBuilder.append("inv @ ");
        }

        // Operator
        String operatorCode = operatorToCode(quantumOperation, emission);
        codeStringBuilder.append(operatorCode);

        // Control and Target Qubits
        List<String> qubitStrings = new java.util.ArrayList<>();

        if (quantumOperation.getControlQubits() != null) {
            for (ElementSelector control : quantumOperation.getControlQubits()) {
                qubitStrings.add(emission.qubitName().apply(control));
            }
        }

        for (ElementSelector target : quantumOperation.getTargetQubits()) {
            qubitStrings.add(emission.qubitName().apply(target));
        }

        if (!qubitStrings.isEmpty()) {
            codeStringBuilder.append(" ").append(String.join(", ", qubitStrings));
        }

        // Semicolon
        codeStringBuilder.append(";");

        return codeStringBuilder.toString();
    }

    private static String operatorToCode(QuantumOperation quantumOperation, Emission emission) {
        // A composite is written under the name its definition was declared with, which is not
        // necessarily its own name -- see assignGateNames.
        if (quantumOperation instanceof CompositeQuantumGate composite) {
            return emission.gateNames().getOrDefault(composite.getDefinition().getId(), composite.getGateName());
        }

        QuantumOperationLibrary operationDefinition = quantumOperation.getOperationDefinition();
        String operatorCode = toCode(operationDefinition);
        if (quantumOperation instanceof ElementaryQuantumGate elementaryQuantumGate) {
            if (operationDefinition.getDefinition() instanceof ConcreteQuantumOperation<?> definition && definition.isHasRotationAngle()) {
                return operatorCode + "(" + formatAngle(elementaryQuantumGate.getRotationAngle()) + ")";
            }
            return operatorCode;
        }

        // TODO CompositeOperations
        // TODO Meassurement

        return operatorCode;
    }

    /** Named constants the QASM parser understands, with a small tolerance for round-trip matching. */
    private static final double CONSTANT_MATCH_EPSILON = 1e-9;

    /**
     * Formatiert den Winkel für QASM. Die benannten Konstanten tau und euler sowie rationale Vielfache
     * von pi werden symbolisch ausgegeben (z.B. "tau", "euler", "pi/2", "-pi/4", "2*pi/3"), ansonsten als
     * Dezimalzahl. So überleben sie einen parse → toCode → parse Round-Trip.
     */
    private static String formatAngle(double angle) {
        if (!Double.isFinite(angle)) {
            // Guard against emitting non-QASM tokens like "Infinity"/"NaN"; fall back to a neutral angle.
            return "0";
        }
        if (angle == 0.0) {
            return "0";
        }
        // Check tau before the pi logic so that 2*pi is emitted as "tau" rather than "2*pi".
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

    /** Emits "tau"/"euler" (and their negatives) for the matching constant values, otherwise {@code null}. */
    private static String tryFormatAsNamedConstant(double angle) {
        if (Math.abs(angle - Math.TAU) < CONSTANT_MATCH_EPSILON) {
            return "tau";
        }
        if (Math.abs(angle + Math.TAU) < CONSTANT_MATCH_EPSILON) {
            return "-tau";
        }
        if (Math.abs(angle - Math.E) < CONSTANT_MATCH_EPSILON) {
            return "euler";
        }
        if (Math.abs(angle + Math.E) < CONSTANT_MATCH_EPSILON) {
            return "-euler";
        }
        return null;
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

    private static String toCode(QuantumOperationLibrary quantumOperation) {
        return switch (quantumOperation) {
            case H -> "h";
            case X -> "x";
            case Y -> "y";
            case Z -> "z";
            case CX -> "cx";
            case CZ -> "cz";
            case SWAP -> "swap";
            case CCX -> "ccx";
            case S -> "s";
            case T -> "t";
            case RX -> "rx";
            case RY -> "ry";
            case RZ -> "rz";
            case MEASURE -> "measure";
            // Unreachable: operatorToCode resolves composites from their definition beforehand.
            case COMPOSITE -> throw new IllegalStateException("A composite gate must be named by its definition, not by the library.");
        };
    }

    private static String toCode(QuantumCircuit quantumCircuit, ElementSelector elementSelector) {
        String name = quantumCircuit.getQuantumRegisterNameById(elementSelector.getRegisterId());
        return name + "[" + elementSelector.getIndex() + "]";
    }
}
