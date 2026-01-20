package edu.kit.quak.infrastructure.library.out.json;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.core.library.model.GateDefinition;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@UnitTest
class JsonGateDefinitionDefinitionRepositoryAdapterTest {

    private JsonGateDefinitionDefinitionRepositoryAdapter adapter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        // Arrange
        String testFile = "test-gatedefinitions.json";
        adapter = new JsonGateDefinitionDefinitionRepositoryAdapter(objectMapper, testFile);
        adapter.init(); // Simulates @PostConstruct
    }

    @Test
    void loadGates_parsesComplexStructureCorrectly() {
        // Act
        List<GateDefinition> gateDefinitions = adapter.findAllGateDefinitions();

        // Assert
        assertFalse(gateDefinitions.isEmpty(), "Gate list should not be empty");

        GateDefinition hGateDefinition = gateDefinitions.getFirst();

        // Basic checks
        assertEquals("Hadamard", hGateDefinition.name());
        assertEquals("H", hGateDefinition.symbol());
        assertEquals("h", hGateDefinition.id());

        // Deep checks for InspectorInfo
        assertNotNull(hGateDefinition.inspectorInfo(), "InspectorInfo should be mapped");
        assertFalse(hGateDefinition.inspectorInfo().truthTable().isEmpty(), "TruthTable should contain entries");
        assertEquals("|0⟩", hGateDefinition.inspectorInfo().truthTable().getFirst().input());
    }

    @Test
    void loadGates_parsesMatrixDataCorrectly() {
        // Act
        GateDefinition hGateDefinition = adapter.findAllGateDefinitions().getFirst();
        GateDefinition.MatrixInfo matrix = hGateDefinition.inspectorInfo().matrix();

        // Assert
        assertNotNull(matrix);
        assertEquals(2, matrix.rows());
        assertEquals(2, matrix.computable().size());
        // Verify nested list access (computable matrix)
        assertEquals("1/sqrt(2)", matrix.computable().getFirst().getFirst());
    }

    @Test
    void findGateDefinitionById() {
        // Act
        Optional<GateDefinition> result = adapter.findGateDefinitionById("h");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Hadamard", result.get().name());
    }
}