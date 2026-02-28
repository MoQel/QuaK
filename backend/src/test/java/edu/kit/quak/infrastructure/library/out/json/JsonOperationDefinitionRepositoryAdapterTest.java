package edu.kit.quak.infrastructure.library.out.json;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.core.library.model.OperationDefinition;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@UnitTest
class JsonOperationDefinitionRepositoryAdapterTest {

    private JsonOperationDefinitionRepositoryAdapter adapter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        // Arrange
        String testFile = "test-operation-definitions.json";
        adapter = new JsonOperationDefinitionRepositoryAdapter(objectMapper, testFile);
        adapter.init(); // Simulates @PostConstruct
    }

    @Test
    void loadOperationDefinitions_parsesComplexStructureCorrectly() {
        // Act
        List<OperationDefinition> operationDefinitions = adapter.findAllOperationDefinitions();

        // Assert
        assertFalse(operationDefinitions.isEmpty(), "Operation definition list should not be empty");

        OperationDefinition hOperationDefinition = operationDefinitions.getFirst();

        // Basic checks
        assertEquals("Hadamard", hOperationDefinition.name());
        assertEquals("H", hOperationDefinition.symbol());
        assertEquals("h", hOperationDefinition.id());

        // Deep checks for InspectorInfo
        assertNotNull(hOperationDefinition.inspectorInfo(), "InspectorInfo should be mapped");
        assertFalse(hOperationDefinition.inspectorInfo().truthTable().isEmpty(), "TruthTable should contain entries");
        assertEquals("|0⟩", hOperationDefinition.inspectorInfo().truthTable().getFirst().input());
    }

    @Test
    void loadOperationDefinitions_parsesMatrixDataCorrectly() {
        // Act
        OperationDefinition hOperationDefinition = adapter.findAllOperationDefinitions().getFirst();
        OperationDefinition.MatrixInfo matrix = hOperationDefinition.inspectorInfo().matrix();

        // Assert
        assertNotNull(matrix);
        assertEquals(2, matrix.rows());
        assertEquals(2, matrix.computable().size());
        // Verify nested list access (computable matrix)
        assertEquals("1/sqrt(2)", matrix.computable().getFirst().getFirst());
    }

    @Test
    void findOperationDefinitionById() {
        // Act
        Optional<OperationDefinition> result = adapter.findOperationDefinitionById("h");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Hadamard", result.get().name());
    }
}
