package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import static org.assertj.core.api.Assertions.assertThat;

import edu.kit.quak.core.circuit.model.LoopBlock;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
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
 * Persisting a repetition frame.
 *
 * <p>The frame carries no geometry, only a repeat count and the ids of the operations it covers, so
 * what these tests guard is that those ids come back complete and in program order — that order is
 * the loop body, and code generation writes it inside the {@code for}.
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
class LoopBlockPersistenceTest {

    private static final String REGISTER_ID = "reg-1";

    @Autowired
    private CircuitJpaAdapter jpaAdapter;

    @Autowired
    private TestEntityManager entityManager;

    /**
     * Reads the circuit back through the database rather than out of the persistence context.
     *
     * <p>Without the {@code clear()} the first-level cache hands back the very object graph that was
     * just saved, so frames that never reached a table would still look intact — the same way the
     * missing composite body hid at first.
     */
    private QuantumCircuit reload() {
        entityManager.flush();
        entityManager.clear();
        return jpaAdapter.findById("circuit-1").orElseThrow();
    }

    private static ElementaryQuantumGate gateOn(int qubitIdx) {
        return new ElementaryQuantumGate(
            QuantumOperationLibrary.H,
            false,
            List.of(new ElementSelector(REGISTER_ID, qubitIdx)),
            List.of(),
            0.0
        );
    }

    private static QuantumCircuit circuitWith(List<Layer> layers, List<LoopBlock> loopBlocks) {
        QuantumRegister register = new QuantumRegister("q", 4);
        register.setId(REGISTER_ID);
        return QuantumCircuit.builder()
            .id("circuit-1")
            .projectId("p1")
            .fileId("f1")
            .registers(List.<Register>of(register))
            .layers(layers)
            .loopBlocks(loopBlocks)
            .build();
    }

    @Test
    void frameSurvivesASaveAndLoadRoundTrip() {
        QuantumOperation first = gateOn(0);
        QuantumOperation second = gateOn(1);
        LoopBlock block = new LoopBlock(4, List.of(first.getId(), second.getId()));
        jpaAdapter.save(circuitWith(List.of(new Layer(List.of(first, second))), List.of(block)));

        QuantumCircuit reloaded = reload();

        assertThat(reloaded.getLoopBlocks()).hasSize(1);
        LoopBlock reloadedBlock = reloaded.getLoopBlocks().getFirst();
        assertThat(reloadedBlock.getId()).isEqualTo(block.getId());
        assertThat(reloadedBlock.getRepeatCount()).isEqualTo(4);
        assertThat(reloadedBlock.getOperationIds()).containsExactly(first.getId(), second.getId());
    }

    /** Member order is the loop body's program order, so it must not come back as a bag. */
    @Test
    void memberOrderIsPreserved() {
        List<QuantumOperation> members = List.of(gateOn(3), gateOn(0), gateOn(2), gateOn(1));
        List<String> ids = members.stream().map(QuantumOperation::getId).toList();
        jpaAdapter.save(circuitWith(List.of(new Layer(members)), List.of(new LoopBlock(2, ids))));

        assertThat(reload().getLoopBlocks().getFirst().getOperationIds()).containsExactlyElementsOf(ids);
    }

    /**
     * Saving an already-stored circuit again is what every autosave does. A unidirectional
     * association is what silently dropped the composite gate's body at exactly this point, so the
     * frames get the same check.
     */
    @Test
    void framesSurviveBeingSavedTwice() {
        QuantumOperation gate = gateOn(0);
        LoopBlock block = new LoopBlock(3, List.of(gate.getId()));
        jpaAdapter.save(circuitWith(List.of(new Layer(List.of(gate))), List.of(block)));

        QuantumCircuit stored = reload();
        jpaAdapter.save(stored);

        QuantumCircuit reloaded = reload();
        assertThat(reloaded.getLoopBlocks()).hasSize(1);
        assertThat(reloaded.getLoopBlocks().getFirst().getOperationIds()).containsExactly(gate.getId());
    }

    /** Nested loops are two frames over overlapping members; neither may swallow the other. */
    @Test
    void nestedFramesAreStoredSideBySide() {
        QuantumOperation outerOnly = gateOn(0);
        QuantumOperation shared = gateOn(1);
        LoopBlock inner = new LoopBlock(3, List.of(shared.getId()));
        LoopBlock outer = new LoopBlock(2, List.of(outerOnly.getId(), shared.getId()));
        jpaAdapter.save(circuitWith(List.of(new Layer(List.of(outerOnly, shared))), List.of(inner, outer)));

        QuantumCircuit reloaded = reload();

        assertThat(reloaded.getLoopBlocks()).hasSize(2);
        assertThat(reloaded.getLoopBlocks().stream().map(LoopBlock::getRepeatCount)).containsExactly(3, 2);
        assertThat(reloaded.getLoopBlocks().get(1).getOperationIds()).containsExactly(outerOnly.getId(), shared.getId());
    }

    /** A circuit without frames must not grow an empty one, and must still load. */
    @Test
    void aCircuitWithoutFramesStaysWithoutFrames() {
        jpaAdapter.save(circuitWith(List.of(new Layer(List.of(gateOn(0)))), List.of()));

        assertThat(reload().getLoopBlocks()).isEmpty();
    }
}
