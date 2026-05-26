package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public abstract class QuantumOperation extends ElementWithId {

    protected QuantumOperationLibrary operationDefinition;
    protected boolean inverseForm;
    protected List<ElementSelector> targetQubits;
    protected List<ElementSelector> controlQubits;

    protected QuantumOperation(
        @NonNull QuantumOperationLibrary operationDefinition,
        boolean inverseForm,
        @NonNull List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits
    ) {
        super();
        this.operationDefinition = operationDefinition;
        this.inverseForm = inverseForm;
        if (targetQubits.isEmpty()) {
            throw new InvalidOperationConfigurationException("Must provide at least one qubit to target.");
        }
        this.targetQubits = targetQubits;
        this.controlQubits = controlQubits;
    }

    public String toCode(QuantumCircuit quantumCircuit) {
        StringBuilder sb = new StringBuilder();

        String operatorCode = this.operationDefinition.toCode(quantumCircuit);
        sb.append(operatorCode);

        //TODO
        // Falls du invertierte Gates hast (in OpenQASM 3 oft via 'inv @ gate')
        if (this.inverseForm) {
            // Hinweis: Je nach OpenQASM 3 Dialekt schreibt man "inv @ h"
            // Wenn du das brauchst, müsstest du den String entsprechend vorne anpassen.
        }

        // 2. Qubits sammeln (Zuerst Controls, dann Targets – das ist QASM-Standard)
        List<String> qubitStrings = new java.util.ArrayList<>();

        if (this.controlQubits != null) {
            for (ElementSelector control : this.controlQubits) {
                qubitStrings.add(control.toCode(quantumCircuit)); // Angenommen ElementSelector hat ein toCode() für "q[0]"
            }
        }

        for (ElementSelector target : this.targetQubits) {
            qubitStrings.add(target.toCode(quantumCircuit));
        }

        // 3. Wenn Qubits vorhanden sind, mit Leerzeichen trennen und Komma-separiert anhängen
        if (!qubitStrings.isEmpty()) {
            sb.append(" ").append(String.join(", ", qubitStrings));
        }

        // 4. Jedes Statement in OpenQASM endet mit einem Semikolon
        sb.append(";");

        return sb.toString();
    }
}
