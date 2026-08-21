package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import static org.assertj.core.api.Assertions.assertThat;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.gate.GateDefinition;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

/**
 * Persisting a user-defined gate. Only the call is stored; the definition is rebuilt on load by
 * inverting the binding of the stored body, so these tests are what guarantee that inversion is
 * faithful.
 */
@DataJpaTest
@Import(
    {
        CircuitJpaAdapter.class,
        CircuitJpaMapperImpl.class,
        RegisterJpaMapperImpl.class,
        LayerJpaMapperImpl.class,
        QuantumOperationJpaMapperImpl.class,
        ElementSelectorJpaMapperImpl.class,
    }
)
class CompositeGatePersistenceTest {

    @Autowired
    private CircuitJpaAdapter jpaAdapter;

    @Autowired
    private TestEntityManager entityManager;

    /**
     * Reads the circuit back through the database rather than out of the persistence context.
     *
     * <p>Without the {@code clear()} the first-level cache hands back the very object graph that was
     * just saved, so a body that never reached a table still looks intact — which is exactly how the
     * missing-body bug hid at first.
     */
    private CompositeQuantumGate reloadComposite() {
        entityManager.flush();
        entityManager.clear();
        return (CompositeQuantumGate) jpaAdapter
            .findById("circuit-1")
            .orElseThrow()
            .getLayers()
            .getFirst()
            .getQuantumOperations()
            .getFirst();
    }

    /** `gate bell a, b { h a; cx a, b; }` */
    private static GateDefinition bellDefinition() {
        GateDefinition bell = new GateDefinition("bell", List.of("a", "b"));
        bell.addOperation(new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(bell.selectorFor("a")), List.of(), 0.0));
        bell.addOperation(
            new ElementaryQuantumGate(
                QuantumOperationLibrary.CX,
                false,
                List.of(bell.selectorFor("b")),
                List.of(bell.selectorFor("a")),
                0.0
            )
        );
        return bell;
    }

    private static QuantumCircuit circuitWith(QuantumOperation operation, String registerId) {
        QuantumRegister register = new QuantumRegister("q", 4);
        register.setId(registerId);
        return QuantumCircuit.builder()
            .id("circuit-1")
            .projectId("p1")
            .fileId("f1")
            .registers(List.<Register>of(register))
            .layers(List.of(new Layer(List.of(operation))))
            .build();
    }

    @Test
    void compositeSurvivesASaveAndLoadRoundTrip() {
        String registerId = "reg-1";
        CompositeQuantumGate call = new CompositeQuantumGate(
            bellDefinition(),
            false,
            List.of(new ElementSelector(registerId, 0), new ElementSelector(registerId, 1))
        );
        jpaAdapter.save(circuitWith(call, registerId));

        CompositeQuantumGate reloaded = reloadComposite();

        assertThat(reloaded.getId()).isEqualTo(call.getId());
        assertThat(reloaded.getGateName()).isEqualTo("bell");
        assertThat(reloaded.getDefinition().getParameterNames()).containsExactly("a", "b");
        assertThat(reloaded.getTargetQubits()).containsExactly(new ElementSelector(registerId, 0), new ElementSelector(registerId, 1));

        // The rebuilt definition must behave like the original one.
        assertThat(
            reloaded
                .expandToElementary()
                .stream()
                .map(op -> ((ElementaryQuantumGate) op).getOperationDefinition())
        ).containsExactly(QuantumOperationLibrary.H, QuantumOperationLibrary.CX);
        assertThat(reloaded.expandToElementary().get(1).getControlQubits()).containsExactly(new ElementSelector(registerId, 0));
    }

    /** The gate must come back bound to the wires it was called on, not to parameter positions. */
    @Test
    void compositeOnNonZeroQubitsKeepsItsBinding() {
        String registerId = "reg-2";
        CompositeQuantumGate call = new CompositeQuantumGate(
            bellDefinition(),
            false,
            List.of(new ElementSelector(registerId, 3), new ElementSelector(registerId, 1))
        );
        jpaAdapter.save(circuitWith(call, registerId));

        CompositeQuantumGate reloaded = reloadComposite();

        // Parameter a -> wire 3, parameter b -> wire 1.
        List<QuantumOperation> body = reloaded.expandToElementary();
        assertThat(body.get(0).getTargetQubits()).containsExactly(new ElementSelector(registerId, 3));
        assertThat(body.get(1).getTargetQubits()).containsExactly(new ElementSelector(registerId, 1));
        assertThat(body.get(1).getControlQubits()).containsExactly(new ElementSelector(registerId, 3));
    }

    /** A declared but unused parameter has no body operation, so only the arity can carry it. */
    @Test
    void unusedParameterSurvivesTheRoundTrip() {
        String registerId = "reg-3";
        GateDefinition skip = new GateDefinition("skip", List.of("a", "b", "c", "d"));
        skip.addOperation(new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(skip.selectorFor("c")), List.of(), 0.0));
        skip.addOperation(
            new ElementaryQuantumGate(
                QuantumOperationLibrary.CX,
                false,
                List.of(skip.selectorFor("d")),
                List.of(skip.selectorFor("c")),
                0.0
            )
        );

        CompositeQuantumGate call = new CompositeQuantumGate(
            skip,
            false,
            List.of(
                new ElementSelector(registerId, 0),
                new ElementSelector(registerId, 1),
                new ElementSelector(registerId, 2),
                new ElementSelector(registerId, 3)
            )
        );
        jpaAdapter.save(circuitWith(call, registerId));

        CompositeQuantumGate reloaded = reloadComposite();

        assertThat(reloaded.getDefinition().getParameterNames()).containsExactly("a", "b", "c", "d");
        assertThat(reloaded.getDefinition().getUsedParameterNames()).containsExactly("c", "d");
        assertThat(reloaded.getTargetQubits()).hasSize(4);
    }

    /** Nesting must not be flattened by the round trip. */
    @Test
    void nestedCompositeSurvivesTheRoundTrip() {
        String registerId = "reg-4";
        GateDefinition outer = new GateDefinition("outer", List.of("x", "y"));
        outer.addOperation(new CompositeQuantumGate(bellDefinition(), false, List.of(outer.selectorFor("x"), outer.selectorFor("y"))));

        CompositeQuantumGate call = new CompositeQuantumGate(
            outer,
            false,
            List.of(new ElementSelector(registerId, 0), new ElementSelector(registerId, 1))
        );
        jpaAdapter.save(circuitWith(call, registerId));

        CompositeQuantumGate reloaded = reloadComposite();

        assertThat(reloaded.getGateName()).isEqualTo("outer");
        List<QuantumOperation> oneLevel = reloaded.expand();
        assertThat(oneLevel).hasSize(1);
        assertThat(oneLevel.getFirst()).isInstanceOf(CompositeQuantumGate.class);
        assertThat(((CompositeQuantumGate) oneLevel.getFirst()).getGateName()).isEqualTo("bell");
        assertThat(
            reloaded
                .expandToElementary()
                .stream()
                .map(op -> ((ElementaryQuantumGate) op).getOperationDefinition())
        ).containsExactly(QuantumOperationLibrary.H, QuantumOperationLibrary.CX);
    }

    /** The frontend autosaves repeatedly, so replacing a stored circuit must not trip over the body rows. */
    @Test
    void savingTheSameCircuitTwiceReplacesItCleanly() {
        String registerId = "reg-5";
        CompositeQuantumGate call = new CompositeQuantumGate(
            bellDefinition(),
            false,
            List.of(new ElementSelector(registerId, 0), new ElementSelector(registerId, 1))
        );
        jpaAdapter.save(circuitWith(call, registerId));

        CompositeQuantumGate reloaded = reloadComposite();

        // Save the loaded circuit again, exactly as a debounced autosave would.
        jpaAdapter.save(circuitWith(reloaded, registerId));

        CompositeQuantumGate afterSecondSave = reloadComposite();

        assertThat(afterSecondSave.getGateName()).isEqualTo("bell");
        assertThat(afterSecondSave.expandToElementary()).hasSize(2);
    }
}
