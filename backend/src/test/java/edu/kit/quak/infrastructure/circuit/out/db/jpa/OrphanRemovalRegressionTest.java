package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import static org.assertj.core.api.Assertions.assertThat;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

/**
 * Regression tests for the historical orphanRemoval data loss: moving an operation
 * between layers while keeping its id used to make Hibernate delete the operation
 * instead of moving it, which was papered over by regenerating operation ids in
 * QuantumCircuit.rescheduleOperations(). That workaround has been removed; these
 * tests guard the id-preserving move/swap/layer-drop scenarios end-to-end through
 * the JPA adapter (MapStruct toEntity + merge via saveAndFlush).
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
class OrphanRemovalRegressionTest {

    @Autowired
    private CircuitJpaAdapter jpaAdapter;

    @Test
    void movingOperationBetweenLayers_keepingItsId_mustNotLoseOperations() {
        // Arrange: circuit with layer0=[Z(q0)], layer1=[CX(q0->q1)]
        QuantumRegister register = new QuantumRegister("q", 3);
        String regId = register.getId();
        ElementaryQuantumGate z = new ElementaryQuantumGate(
            QuantumOperationLibrary.Z,
            false,
            List.of(new ElementSelector(regId, 0)),
            null,
            0d
        );
        ElementaryQuantumGate cx = new ElementaryQuantumGate(
            QuantumOperationLibrary.CX,
            false,
            List.of(new ElementSelector(regId, 1)),
            List.of(new ElementSelector(regId, 0)),
            0d
        );
        QuantumCircuit v1 = QuantumCircuit.builder()
            .id("c-repro")
            .projectId("p-repro")
            .fileId("f-repro")
            .registers(List.of(register))
            .layers(List.of(new Layer(List.of(z)), new Layer(List.of(cx))))
            .build();
        jpaAdapter.save(v1);

        // Act: load, move Z from layer0 to layer1 WITHOUT regenerating its id, save again.
        QuantumCircuit loaded = jpaAdapter.findById("c-repro").orElseThrow();
        Layer layer0 = loaded.getLayers().get(0);
        Layer layer1 = loaded.getLayers().get(1);
        QuantumOperation movedOp = layer0.getQuantumOperations().getFirst();
        String movedOpId = movedOp.getId();
        layer0.removeQuantumOperation(movedOp);
        layer1.addQuantumOperation(movedOp);
        jpaAdapter.save(loaded);

        // Assert: both operations must still exist, the moved one with its original id.
        QuantumCircuit reloaded = jpaAdapter.findById("c-repro").orElseThrow();
        List<QuantumOperation> allOps = reloaded
            .getLayers()
            .stream()
            .flatMap(l -> l.getQuantumOperations().stream())
            .toList();
        assertThat(allOps).hasSize(2);
        assertThat(allOps).extracting(QuantumOperation::getId).contains(movedOpId);
    }

    @Test
    void movingOperation_whenSourceLayerGetsDropped_mustNotLoseOperation() {
        // Arrange: layer0=[Z(q2)], layer1=[CX(q0->q1)] — Z is alone in its layer.
        QuantumRegister register = new QuantumRegister("q", 3);
        String regId = register.getId();
        ElementaryQuantumGate z = new ElementaryQuantumGate(
            QuantumOperationLibrary.Z,
            false,
            List.of(new ElementSelector(regId, 2)),
            null,
            0d
        );
        ElementaryQuantumGate cx = new ElementaryQuantumGate(
            QuantumOperationLibrary.CX,
            false,
            List.of(new ElementSelector(regId, 1)),
            List.of(new ElementSelector(regId, 0)),
            0d
        );
        QuantumCircuit v1 = QuantumCircuit.builder()
            .id("c-repro-2")
            .projectId("p-repro")
            .fileId("f-repro-2")
            .registers(List.of(register))
            .layers(List.of(new Layer(List.of(z)), new Layer(List.of(cx))))
            .build();
        jpaAdapter.save(v1);

        // Act: move Z into the CX layer and DROP the now-empty source layer entirely
        // (mirrors flushLayers() removing empty layers), keeping all ids.
        QuantumCircuit loaded = jpaAdapter.findById("c-repro-2").orElseThrow();
        QuantumOperation movedOp = loaded.getLayers().get(0).getQuantumOperations().getFirst();
        String movedOpId = movedOp.getId();
        Layer targetLayer = loaded.getLayers().get(1);
        targetLayer.addQuantumOperation(movedOp);
        QuantumCircuit v2 = QuantumCircuit.builder()
            .id(loaded.getId())
            .projectId(loaded.getProjectId())
            .fileId(loaded.getFileId())
            .registers(loaded.getRegisters())
            .layers(List.of(targetLayer))
            .build();
        jpaAdapter.save(v2);

        // Assert
        QuantumCircuit reloaded = jpaAdapter.findById("c-repro-2").orElseThrow();
        List<QuantumOperation> allOps = reloaded
            .getLayers()
            .stream()
            .flatMap(l -> l.getQuantumOperations().stream())
            .toList();
        assertThat(allOps).hasSize(2);
        assertThat(allOps).extracting(QuantumOperation::getId).contains(movedOpId);
    }

    @Test
    void swappingOperationsBetweenLayers_keepingIds_mustNotLoseOperations() {
        // Arrange: layer0=[Z(q2)], layer1=[X(q2)] — then swap their layers.
        QuantumRegister register = new QuantumRegister("q", 3);
        String regId = register.getId();
        ElementaryQuantumGate z = new ElementaryQuantumGate(
            QuantumOperationLibrary.Z,
            false,
            List.of(new ElementSelector(regId, 2)),
            null,
            0d
        );
        ElementaryQuantumGate x = new ElementaryQuantumGate(
            QuantumOperationLibrary.X,
            false,
            List.of(new ElementSelector(regId, 2)),
            null,
            0d
        );
        QuantumCircuit v1 = QuantumCircuit.builder()
            .id("c-repro-3")
            .projectId("p-repro")
            .fileId("f-repro-3")
            .registers(List.of(register))
            .layers(List.of(new Layer(List.of(z)), new Layer(List.of(x))))
            .build();
        jpaAdapter.save(v1);

        // Act: swap the operations between the two existing layers, all ids kept.
        QuantumCircuit loaded = jpaAdapter.findById("c-repro-3").orElseThrow();
        Layer layer0 = loaded.getLayers().get(0);
        Layer layer1 = loaded.getLayers().get(1);
        QuantumOperation op0 = layer0.getQuantumOperations().getFirst();
        QuantumOperation op1 = layer1.getQuantumOperations().getFirst();
        layer0.removeQuantumOperation(op0);
        layer1.removeQuantumOperation(op1);
        layer0.addQuantumOperation(op1);
        layer1.addQuantumOperation(op0);
        jpaAdapter.save(loaded);

        // Assert
        QuantumCircuit reloaded = jpaAdapter.findById("c-repro-3").orElseThrow();
        List<QuantumOperation> allOps = reloaded
            .getLayers()
            .stream()
            .flatMap(l -> l.getQuantumOperations().stream())
            .toList();
        assertThat(allOps).hasSize(2);
        assertThat(allOps).extracting(QuantumOperation::getId).containsExactlyInAnyOrder(op0.getId(), op1.getId());
    }
}
