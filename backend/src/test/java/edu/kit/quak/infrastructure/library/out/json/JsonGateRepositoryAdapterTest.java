package edu.kit.quak.infrastructure.library.out.json;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.core.library.model.Gate;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@UnitTest
class JsonGateRepositoryAdapterTest {

    private JsonGateRepositoryAdapter adapter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        // Arrange
        String testFile = "test-gates.json";
        adapter = new JsonGateRepositoryAdapter(objectMapper, testFile);
        adapter.init(); // Simulates @PostConstruct
    }

    @Test
    void loadGates_parsesComplexStructureCorrectly() {
        // Act
        List<Gate> gates = adapter.findAllGates();

        // Assert
        assertFalse(gates.isEmpty(), "Gate list should not be empty");

        Gate hGate = gates.getFirst();

        // Basic checks
        assertEquals("Hadamard", hGate.name());
        assertEquals("H", hGate.symbol());
        assertEquals("h", hGate.id());

        // Deep checks for InspectorInfo
        assertNotNull(hGate.inspectorInfo(), "InspectorInfo should be mapped");
        assertFalse(hGate.inspectorInfo().truthTable().isEmpty(), "TruthTable should contain entries");
        assertEquals("|0⟩", hGate.inspectorInfo().truthTable().getFirst().input());
    }

    @Test
    void loadGates_parsesMatrixDataCorrectly() {
        // Act
        Gate hGate = adapter.findAllGates().getFirst();
        Gate.MatrixInfo matrix = hGate.inspectorInfo().matrix();

        // Assert
        assertNotNull(matrix);
        assertEquals(2, matrix.rows());
        assertEquals(2, matrix.computable().size());
        // Verify nested list access (computable matrix)
        assertEquals("1/sqrt(2)", matrix.computable().getFirst().getFirst());
    }

    @Test
    void findGateById() {
        // Act
        Optional<Gate> result = adapter.findGateById("h");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Hadamard", result.get().name());
    }
}