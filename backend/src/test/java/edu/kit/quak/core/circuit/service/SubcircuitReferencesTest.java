package edu.kit.quak.core.circuit.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.SubcircuitOperation;
import edu.kit.quak.core.common.exception.DomainRuleViolationException;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@UnitTest
class SubcircuitReferencesTest {

    @Test
    @DisplayName("offers declared subcircuits other than the host that do not lead back to it")
    void offersOnlyCircuitsWithoutLoop() {
        QuantumCircuit host = circuit("host", false);
        QuantumCircuit plain = circuit("plain", true);
        QuantumCircuit undeclared = circuit("undeclared", false);
        QuantumCircuit callsHostIndirectly = circuit("indirect", true, "middle");
        QuantumCircuit middle = circuit("middle", false, "host");

        List<QuantumCircuit> offered = SubcircuitReferences.offerableTo(
            "host",
            List.of(host, plain, undeclared, callsHostIndirectly, middle)
        );

        assertEquals(List.of(plain), offered);
    }

    @Test
    @DisplayName("disallows the host's file, declared subcircuits and files leading back to the host")
    void disallowsFilesThatCannotBecomeSubcircuits() {
        QuantumCircuit host = circuit("host", false);
        QuantumCircuit declared = circuit("declared", true);
        QuantumCircuit callsHost = circuit("caller", false, "host");
        QuantumCircuit free = circuit("free", false);

        Set<String> disallowed = SubcircuitReferences.disallowedFileIdsFor("host", List.of(host, declared, callsHost, free));

        assertEquals(Set.of("f-host", "f-declared", "f-caller"), disallowed);
    }

    @Test
    @DisplayName("rejects offering a circuit to itself, to a circuit it leads back to, or a second time")
    void rejectsInvalidOffers() {
        QuantumCircuit host = circuit("host", false);
        QuantumCircuit callsHost = circuit("caller", false, "host");
        QuantumCircuit declared = circuit("declared", true);
        QuantumCircuit free = circuit("free", false);
        List<QuantumCircuit> project = List.of(host, callsHost, declared, free);

        assertThrows(DomainRuleViolationException.class, () -> SubcircuitReferences.ensureCanBeOfferedTo(host, "host", project));
        assertThrows(DomainRuleViolationException.class, () -> SubcircuitReferences.ensureCanBeOfferedTo(callsHost, "host", project));
        assertThrows(DomainRuleViolationException.class, () -> SubcircuitReferences.ensureCanBeOfferedTo(declared, "host", project));
        assertDoesNotThrow(() -> SubcircuitReferences.ensureCanBeOfferedTo(free, "host", project));
    }

    private static QuantumCircuit circuit(String id, boolean offered, String... calls) {
        List<Layer> layers = new ArrayList<>();
        for (String called : calls) {
            layers.add(
                new Layer(
                    new ArrayList<>(
                        List.of(
                            new SubcircuitOperation(
                                false,
                                new ArrayList<>(List.of(new ElementSelector("reg", 0))),
                                new ArrayList<>(),
                                called
                            )
                        )
                    )
                )
            );
        }
        return QuantumCircuit.builder()
            .id(id)
            .projectId("p-1")
            .fileId("f-" + id)
            .offeredAsSubcircuit(offered)
            .registers(List.of())
            .layers(layers)
            .build();
    }
}
