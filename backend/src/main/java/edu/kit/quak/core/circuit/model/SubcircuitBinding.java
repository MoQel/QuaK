package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.SubcircuitOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Binds the contents of a referenced circuit onto the qubits a subcircuit call passes it.
 *
 * <p>A subcircuit stores only the id of the circuit it calls, so on its own it says nothing about
 * what it does. Everything that has to look inside -- simulating it, writing it out, drawing its
 * body -- needs that content expressed in the caller's qubits, which is what this produces.
 *
 * <p>The mapping is positional or explicitly indexed over the referenced circuit's qubits:
 * subcircuit qubit {@code subcircuitQubitIndices[i]} becomes the <em>i</em>-th qubit of the call.
 * Operations acting solely on imported qubits are rebound; operations acting solely on unimported
 * independent qubits are skipped; operations that link an imported qubit with an unimported qubit
 * produce a binding error explaining the missing dependency.
 */
public final class SubcircuitBinding {

    public record BindingResult(List<QuantumOperation> operations, String errorMessage) {
        public boolean isSuccess() {
            return errorMessage == null;
        }
    }

    private SubcircuitBinding() {}

    /**
     * The referenced circuit's operations in the caller's qubits, or empty when the call cannot be
     * expressed that way.
     */
    public static List<QuantumOperation> bind(QuantumCircuit definition, List<ElementSelector> callQubits) {
        return bind(definition, callQubits, null);
    }

    public static List<QuantumOperation> bind(
        QuantumCircuit definition,
        List<ElementSelector> callQubits,
        List<Integer> subcircuitQubitIndices
    ) {
        BindingResult result = bindWithResult(definition, callQubits, subcircuitQubitIndices);
        return result.isSuccess() ? result.operations() : List.of();
    }

    public static BindingResult bindWithResult(
        QuantumCircuit definition,
        List<ElementSelector> callQubits,
        List<Integer> subcircuitQubitIndices
    ) {
        if (callQubits == null || callQubits.isEmpty()) {
            return new BindingResult(List.of(), null);
        }

        List<ElementSelector> defQubits = new ArrayList<>();
        Map<String, Integer> defQubitIndexByKey = new HashMap<>();
        Map<String, String> defQubitLabelByKey = new HashMap<>();
        int flatIndex = 0;
        for (Register register : definition.getRegisters()) {
            if (!(register instanceof QuantumRegister qr)) {
                continue;
            }
            for (int i = 0; i < qr.getNumberOfQubits(); i++) {
                ElementSelector sel = new ElementSelector(qr.getId(), i);
                defQubits.add(sel);
                String k = key(qr.getId(), i);
                defQubitIndexByKey.put(k, flatIndex);
                defQubitLabelByKey.put(k, qr.getName() + "[" + i + "]");
                flatIndex++;
            }
        }

        List<Integer> indices = subcircuitQubitIndices;
        if (indices == null || indices.isEmpty()) {
            indices = new ArrayList<>();
            int count = Math.min(callQubits.size(), defQubits.size());
            for (int i = 0; i < count; i++) {
                indices.add(i);
            }
        }

        if (indices.size() > callQubits.size()) {
            return new BindingResult(null, "Number of specified subcircuit qubit indices exceeds call qubits count.");
        }

        Map<String, ElementSelector> mapping = new HashMap<>();
        Set<Integer> seenIndices = new HashSet<>();
        for (int pos = 0; pos < indices.size(); pos++) {
            int targetDefIndex = indices.get(pos);
            if (targetDefIndex < 0 || targetDefIndex >= defQubits.size()) {
                return new BindingResult(null, "Subcircuit qubit index " + targetDefIndex + " is out of range for definition.");
            }
            if (!seenIndices.add(targetDefIndex)) {
                return new BindingResult(null, "Duplicate subcircuit qubit index " + targetDefIndex + " specified.");
            }
            ElementSelector defSel = defQubits.get(targetDefIndex);
            mapping.put(key(defSel.getRegisterId(), defSel.getIndex()), callQubits.get(pos));
        }

        List<QuantumOperation> bound = new ArrayList<>();
        for (Layer layer : definition.getLayers()) {
            for (QuantumOperation operation : layer.getQuantumOperations()) {
                List<ElementSelector> involved = new ArrayList<>(operation.getTargetQubits());
                if (operation.getControlQubits() != null) {
                    involved.addAll(operation.getControlQubits());
                }

                int importedCount = 0;
                String firstImportedLabel = null;
                String firstUnimportedLabel = null;

                for (ElementSelector sel : involved) {
                    String k = key(sel.getRegisterId(), sel.getIndex());
                    if (mapping.containsKey(k)) {
                        importedCount++;
                        if (firstImportedLabel == null) {
                            firstImportedLabel = defQubitLabelByKey.getOrDefault(k, "q" + defQubitIndexByKey.get(k));
                        }
                    } else {
                        if (firstUnimportedLabel == null) {
                            firstUnimportedLabel = defQubitLabelByKey.getOrDefault(k, "q" + defQubitIndexByKey.get(k));
                        }
                    }
                }

                if (importedCount == 0) {
                    // Entirely on unimported wires: independent, safe to skip
                    continue;
                }

                if (importedCount < involved.size()) {
                    // Cross-wire operation: imported qubit is entangled/linked with unimported qubit!
                    String gateName = describeOperation(operation);
                    return new BindingResult(
                        null,
                        String.format(
                            "Subcircuit qubit %s is linked to unmapped qubit %s via %s.",
                            firstImportedLabel,
                            firstUnimportedLabel,
                            gateName
                        )
                    );
                }

                // All involved qubits are imported
                if (operation instanceof Measurement) {
                    return new BindingResult(null, "Measurements on imported qubits are not supported in subcircuits.");
                }

                Optional<QuantumOperation> rebound = rebind(operation, mapping);
                if (rebound.isEmpty()) {
                    return new BindingResult(null, "Failed to rebind operation " + describeOperation(operation) + ".");
                }
                bound.add(rebound.get());
            }
        }

        return new BindingResult(bound, null);
    }

    private static Optional<QuantumOperation> rebind(QuantumOperation operation, Map<String, ElementSelector> mapping) {
        List<ElementSelector> targets = new ArrayList<>();
        for (ElementSelector selector : operation.getTargetQubits()) {
            ElementSelector mapped = mapping.get(key(selector.getRegisterId(), selector.getIndex()));
            if (mapped == null) {
                return Optional.empty();
            }
            targets.add(new ElementSelector(mapped.getRegisterId(), mapped.getIndex()));
        }

        List<ElementSelector> controls = new ArrayList<>();
        for (ElementSelector selector : operation.getControlQubits() == null ? List.<ElementSelector>of() : operation.getControlQubits()) {
            ElementSelector mapped = mapping.get(key(selector.getRegisterId(), selector.getIndex()));
            if (mapped == null) {
                return Optional.empty();
            }
            controls.add(new ElementSelector(mapped.getRegisterId(), mapped.getIndex()));
        }

        // copyForQubits is the per-subclass hook, so a composite in the body stays a composite and a
        // nested subcircuit keeps pointing at its own definition.
        return Optional.of(operation.copyForQubits(targets, controls));
    }

    private static String describeOperation(QuantumOperation operation) {
        if (operation instanceof ElementaryQuantumGate elem) {
            return elem.getOperationDefinition().name();
        }
        if (operation instanceof CompositeQuantumGate comp) {
            return comp.getDefinition().getName();
        }
        if (operation instanceof SubcircuitOperation sub) {
            return sub.getDefinitionName() != null ? sub.getDefinitionName() : "subcircuit";
        }
        if (operation instanceof Measurement) {
            return "Measurement";
        }
        return operation.getClass().getSimpleName();
    }

    private static String key(String registerId, int index) {
        return registerId + "#" + index;
    }
}
