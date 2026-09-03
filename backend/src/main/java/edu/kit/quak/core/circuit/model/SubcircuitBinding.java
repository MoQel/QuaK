package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Binds the contents of a referenced circuit onto the qubits a subcircuit call passes it.
 *
 * <p>A subcircuit stores only the id of the circuit it calls, so on its own it says nothing about
 * what it does. Everything that has to look inside -- simulating it, writing it out, drawing its
 * body -- needs that content expressed in the caller's qubits, which is what this produces.
 *
 * <p>The mapping is positional over the referenced circuit's qubits in register order: its qubit
 * <em>i</em> becomes the <em>i</em>-th qubit of the call. That is the same order the drop uses when
 * it sizes a call from the referenced circuit's qubit count, so the two cannot drift apart.
 */
public final class SubcircuitBinding {

    private SubcircuitBinding() {}

    /**
     * The referenced circuit's operations in the caller's qubits, or empty when the call cannot be
     * expressed that way.
     *
     * <p>Empty rather than partial, deliberately: a caller that receives half a body would run a
     * circuit that is not the one the file describes. The cases are a call passing fewer qubits
     * than the circuit uses, and a circuit that measures -- a measurement writes to a classical
     * register of its own circuit, and the caller has no bit standing for it.
     */
    public static List<QuantumOperation> bind(QuantumCircuit definition, List<ElementSelector> callQubits) {
        Map<String, ElementSelector> byDefinitionQubit = qubitMapping(definition, callQubits);
        if (byDefinitionQubit == null) {
            return List.of();
        }

        List<QuantumOperation> bound = new ArrayList<>();
        for (Layer layer : definition.getLayers()) {
            for (QuantumOperation operation : layer.getQuantumOperations()) {
                if (operation instanceof Measurement) {
                    return List.of();
                }
                Optional<QuantumOperation> rebound = rebind(operation, byDefinitionQubit);
                if (rebound.isEmpty()) {
                    return List.of();
                }
                bound.add(rebound.get());
            }
        }
        return bound;
    }

    /** The referenced circuit's qubits in register order, paired with the call's, or null if too few. */
    private static Map<String, ElementSelector> qubitMapping(QuantumCircuit definition, List<ElementSelector> callQubits) {
        Map<String, ElementSelector> mapping = new HashMap<>();
        int position = 0;
        for (Register register : definition.getRegisters()) {
            if (!(register instanceof QuantumRegister quantumRegister)) {
                continue;
            }
            for (int index = 0; index < quantumRegister.getNumberOfQubits(); index++) {
                if (position >= callQubits.size()) {
                    return null;
                }
                mapping.put(key(quantumRegister.getId(), index), callQubits.get(position));
                position++;
            }
        }
        return mapping;
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

    private static String key(String registerId, int index) {
        return registerId + "#" + index;
    }
}
